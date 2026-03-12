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
  items: {
    table: 'items',
    fields: [
      'id',
      'type',
      'parent_id',
      'title',
      'content',
      'tags',
      'is_pinned',
      'item_status',
      'priority',
      'due_date',
      'start_date',
      'completed',
      'is_next',
      'is_someday',
      'is_waiting',
      'waiting_note',
      'waiting_started_at',
      'depends_on',
      'slug',
      'inbox_at',
      'subtype',
      'url',
      'content_type',
      'read_status',
      'period_start',
      'period_end',
      'progress',
      'frequency',
      'target',
      'active',
      'streak',
      'last_completed_at',
      'body',
      'capture_source',
      'processed',
      'processed_at',
      'result_type',
      'result_id',
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
  item_links: {
    table: 'item_links',
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
  item_versions: {
    table: 'item_versions',
    fields: [
      'id',
      'item_id',
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
  time_entries: {
    table: 'time_entries',
    fields: [
      'id',
      'item_id',
      'session_id',
      'entry_type',
      'label',
      'label_normalized',
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
} as const satisfies Record<
  CollectionName,
  { table: string; fields: readonly string[] }
>;

const collectionNames = Object.keys(collectionConfig) as CollectionName[];

let setupPromise: Promise<void> | null = null;
let lastSyncedAt: string | null = null;
let onlineHandler: (() => void) | null = null;
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
    // Wait for a valid auth session before syncing.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
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
            const docId = doc.id as string | undefined;
            const updatedAt = doc.updated_at as string | undefined;
            if (docId && updatedAt) {
              markRemoteUpdate(name, docId, updatedAt);
            }
            // Strip Supabase-only columns not in RxDB schema.
            const { owner: _o, device_id: _d, revision: _r, ...rxDoc } = doc as Record<string, unknown>;
            return rxDoc as typeof doc;
          },
        },
      });

      collection.$.subscribe(async (changeEvent: RxChangeEvent<SyncDocument>) => {
        const docId = changeEvent.documentData?.id as string | undefined;
        if (!docId) return;
        const updatedAt = changeEvent.documentData?.updated_at as string | undefined;
        if (updatedAt && isRecentRemoteUpdate(name, docId, updatedAt)) return;

        const queue = getQueue(name);
        if (queue.has(docId)) return;
        queue.add(docId);

        try {
          await pushToSupabase(changeEvent.documentData, name, ownerId, fields);
        } catch (error) {
          if (error instanceof Error && !error.message.includes('Failed to fetch')) {
            console.error(`Push error [${name}]:`, error);
          }
        } finally {
          queue.delete(docId);
        }
      });
    }

    if (typeof window !== 'undefined') {
      if (onlineHandler) {
        window.removeEventListener('online', onlineHandler);
      }
      onlineHandler = async () => {
        const since = lastSyncedAt;
        const now = new Date().toISOString();
        for (const name of collectionNames) {
          const collection = asSyncCollection(db[name]);
          const { fields } = collectionConfig[name];
          const selector = since ? { updated_at: { $gte: since } } : {};
          const docs = await collection.find({ selector }).exec();
          for (const doc of docs) {
            await pushToSupabase(doc.toJSON(), name, ownerId, fields);
          }
        }
        lastSyncedAt = now;
      };
      window.addEventListener('online', onlineHandler);
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
