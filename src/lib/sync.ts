import { RxChangeEvent, RxCollection, RxDatabase } from 'rxdb';
import { replicateSupabase } from 'rxdb/plugins/replication-supabase';
import { supabase } from './supabase';
import { getDeviceId } from './device';
import { DatabaseCollections } from './db';

type BaseSyncDocument = {
  id: string;
  created_at: string;
  updated_at: string;
  is_trashed: boolean;
  trashed_at: string | null;
};

type SyncDocument = BaseSyncDocument & Record<string, unknown>;

type CollectionName = keyof DatabaseCollections;
type AnyCollection = DatabaseCollections[CollectionName];

const collectionConfig = {
  projects: {
    table: 'projects',
    fields: [
      'id',
      'title',
      'description',
      'status',
      'start_date',
      'due_date',
      'area_id',
      'okr_id',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  tasks: {
    table: 'tasks',
    fields: [
      'id',
      'project_id',
      'area_id',
      'title',
      'description',
      'completed',
      'is_someday',
      'is_next',
      'is_waiting',
      'waiting_note',
      'waiting_started_at',
      'start_date',
      'due_date',
      'tags',
      'content',
      'priority',
      'depends_on',
      'okr_id',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  notes: {
    table: 'notes',
    fields: [
      'id',
      'title',
      'content',
      'inbox_at',
      'note_type',
      'is_pinned',
      'properties',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  habits: {
    table: 'habits',
    fields: [
      'id',
      'title',
      'description',
      'frequency',
      'target',
      'active',
      'okr_id',
      'streak',
      'last_completed_at',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  habit_completions: {
    table: 'habit_completions',
    fields: [
      'id',
      'habit_id',
      'completed_date',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  time_entries: {
    table: 'time_entries',
    fields: [
      'id',
      'task_id',
      'entry_type',
      'label',
      'label_normalized',
      'session_id',
      'started_at',
      'stopped_at',
      'duration_seconds',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  note_links: {
    table: 'note_links',
    fields: [
      'id',
      'source_id',
      'target_id',
      'target_title',
      'header',
      'alias',
      'position',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  templates: {
    table: 'templates',
    fields: [
      'id',
      'title',
      'content',
      'description',
      'category',
      'sort_order',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  note_versions: {
    table: 'note_versions',
    fields: [
      'id',
      'note_id',
      'content',
      'properties',
      'version_number',
      'created_by',
      'change_summary',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  captures: {
    table: 'captures',
    fields: [
      'id',
      'body',
      'source',
      'processed',
      'processed_at',
      'result_type',
      'result_id',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  okrs: {
    table: 'okrs',
    fields: [
      'id',
      'title',
      'description',
      'type',
      'parent_id',
      'period_start',
      'period_end',
      'status',
      'progress',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  tags: {
    table: 'tags',
    fields: [
      'id',
      'name',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  areas: {
    table: 'areas',
    fields: [
      'id',
      'title',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
  sources: {
    table: 'sources',
    fields: [
      'id',
      'url',
      'title',
      'content_type',
      'read_status',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
      'owner',
      'device_id',
    ],
  },
} as const satisfies Record<
  CollectionName,
  { table: string; fields: readonly string[] }
>;

const collectionNames = Object.keys(collectionConfig) as CollectionName[];

let setupPromise: Promise<void> | null = null;
const syncQueueByCollection = new Map<CollectionName, Set<string>>();
const remoteUpdateByCollection = new Map<
  CollectionName,
  Map<string, { updatedAt: string; ts: number }>
>();
const REMOTE_SUPPRESSION_MS = 3000;

function getQueue(name: CollectionName) {
  const existing = syncQueueByCollection.get(name);
  if (existing) return existing;
  const created = new Set<string>();
  syncQueueByCollection.set(name, created);
  return created;
}

function getRemoteUpdateMap(name: CollectionName) {
  const existing = remoteUpdateByCollection.get(name);
  if (existing) return existing;
  const created = new Map<string, { updatedAt: string; ts: number }>();
  remoteUpdateByCollection.set(name, created);
  return created;
}

function markRemoteUpdate(name: CollectionName, docId: string, updatedAt: string) {
  const map = getRemoteUpdateMap(name);
  map.set(docId, { updatedAt, ts: Date.now() });
}

function isRecentRemoteUpdate(
  name: CollectionName,
  docId: string,
  updatedAt: string
) {
  const map = getRemoteUpdateMap(name);
  const marker = map.get(docId);
  if (!marker) return false;
  if (Date.now() - marker.ts > REMOTE_SUPPRESSION_MS) {
    map.delete(docId);
    return false;
  }
  return marker.updatedAt === updatedAt;
}

function buildPayload<T extends Record<string, unknown>>(
  doc: T,
  fields: readonly string[]
) {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    payload[field] = doc[field];
  }
  return payload;
}

function asSyncCollection(collection: AnyCollection) {
  return collection as unknown as RxCollection<SyncDocument>;
}

export async function setupSync(db: RxDatabase<DatabaseCollections>) {
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    // Wait for a valid auth session before syncing. On hard refresh, Supabase
    // restores the session from localStorage asynchronously — without this guard,
    // the first sync attempt would be unauthenticated (401 on tables with RLS).
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Reset so setupSync can be called again once auth is available.
      setupPromise = null;
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (newSession && !setupPromise) {
          subscription.unsubscribe();
          setupSync(db);
        }
      });
      return;
    }

    const ownerId = session.user.id;

    for (const name of collectionNames) {
      const collection = asSyncCollection(db[name]);
      const { table, fields } = collectionConfig[name];

      // Plugin: handles pull with Realtime, checkpoint-based incremental sync,
      // and multi-tab leader election (waitForLeadership: true by default).
      // Push is omitted because the plugin's conflict detection throws on array/object
      // fields (tags, depends_on, properties). Manual push below handles this correctly.
      replicateSupabase({
        replicationIdentifier: `personalos-${name}`,
        collection,
        client: supabase,
        tableName: table,
        modifiedField: 'updated_at',
        deletedField: 'deleted',
        live: true,
        retryTime: 5000,
        pull: {
          batchSize: 50,
          modifier: (doc) => {
            // Mark as recently pulled so the push subscription below skips it,
            // preventing an echo loop back to Supabase.
            const docId = doc.id as string | undefined;
            const updatedAt = doc.updated_at as string | undefined;
            if (docId && updatedAt) {
              markRemoteUpdate(name, docId, updatedAt);
            }
            // Strip Supabase-only columns that aren't in the RxDB schema.
            // wrappedValidateZSchemaStorage rejects unknown fields, so leaving
            // owner/device_id/revision in causes silent validation failures on
            // fresh databases where all data must come through the pull.
            // Keep `deleted` — the plugin needs it to map to _deleted.
            const { owner: _o, device_id: _d, revision: _r, ...rxDoc } = doc as Record<string, unknown>;
            return rxDoc;
          },
        },
      });

      // Manual push: handles all local writes → Supabase upsert.
      // Uses upsert instead of the plugin's optimistic-lock UPDATE because array
      // fields (tags, depends_on, properties) would cause a JS throw in addDocEqualityToQuery.
      collection.$.subscribe(async (changeEvent: RxChangeEvent<SyncDocument>) => {
        const docId = changeEvent.documentData?.id as string | undefined;
        if (!docId) return;
        const updatedAt = changeEvent.documentData?.updated_at as string | undefined;
        if (updatedAt && isRecentRemoteUpdate(name, docId, updatedAt)) return;

        const queue = getQueue(name);
        if (queue.has(docId)) return;
        queue.add(docId);

        try {
          if (changeEvent.operation === 'DELETE') {
            await markTrashedInSupabase(docId, table);
          } else {
            await pushToSupabase(changeEvent.documentData, name, ownerId, fields);
          }
        } catch (error) {
          if (error instanceof Error && !error.message.includes('Failed to fetch')) {
            console.error(`Push error [${name}]:`, error);
          }
        } finally {
          queue.delete(docId);
        }
      });
    }

    // On reconnect, flush any queued local changes to Supabase.
    if (typeof window !== 'undefined') {
      window.addEventListener('online', async () => {
        for (const name of collectionNames) {
          const collection = asSyncCollection(db[name]);
          const { table, fields } = collectionConfig[name];
          const allDocs = await collection.find().exec();
          for (const doc of allDocs) {
            const docData = doc.toJSON();
            await pushToSupabase(docData, name, ownerId, fields);
          }
        }
      });
    }
  })();

  return setupPromise;
}

async function pushToSupabase(
  doc: Record<string, unknown>,
  name: CollectionName,
  ownerId: string,
  fields: readonly string[]
) {
  try {
    const { table } = collectionConfig[name];
    const payload = {
      ...buildPayload(doc, fields),
      owner: ownerId,
      device_id: getDeviceId(),
      revision: ((doc.sync_rev as number) ?? 0) + 1,
      deleted: false,
    };

    const { error } = await supabase.from(table).upsert(payload);
    if (error) throw error;
  } catch (error) {
    const msg = error instanceof Error
      ? error.message
      : (error as { message?: string })?.message ?? String(error);
    if (!msg.includes('Failed to fetch')) {
      console.error(`Push error [${name}]:`, error);
    }
  }
}

async function markTrashedInSupabase(id: string, table: string) {
  try {
    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from(table)
      .update({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp })
      .eq('id', id);
    if (error) throw error;
  } catch (error) {
    const msg = error instanceof Error
      ? error.message
      : (error as { message?: string })?.message ?? String(error);
    if (!msg.includes('Failed to fetch')) {
      console.error('Trash error:', error);
    }
  }
}
