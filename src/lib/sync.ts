import { RxChangeEvent, RxCollection, RxDatabase } from 'rxdb';
import { supabase } from './supabase';
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
  sync_test: {
    table: 'sync_test',
    fields: ['id', 'content', 'created_at', 'updated_at', 'is_trashed', 'trashed_at'],
  },
  projects: {
    table: 'projects',
    fields: [
      'id',
      'title',
      'description',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
    ],
  },
  tasks: {
    table: 'tasks',
    fields: [
      'id',
      'project_id',
      'title',
      'description',
      'status',
      'completed',
      'due_date',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
    ],
  },
  notes: {
    table: 'notes',
    fields: [
      'id',
      'title',
      'content',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
    ],
  },
  habits: {
    table: 'habits',
    fields: [
      'id',
      'title',
      'description',
      'created_at',
      'updated_at',
      'is_trashed',
      'trashed_at',
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
    ],
  },
} as const satisfies Record<
  CollectionName,
  { table: string; fields: readonly string[] }
>;

const collectionNames = Object.keys(collectionConfig) as CollectionName[];

let setupPromise: Promise<void> | null = null;
let syncInterval: NodeJS.Timeout | null = null;
const syncQueueByCollection = new Map<CollectionName, Set<string>>();
const syncInProgress = new Set<CollectionName>();
let onlineListenerAttached = false;
let visibilityListenerAttached = false;
const remoteUpdateByCollection = new Map<
  CollectionName,
  Map<string, { updatedAt: string; ts: number }>
>();
const REMOTE_SUPPRESSION_MS = 2000;
const ACTIVE_PULL_INTERVAL_MS = 5000;

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

function startSyncInterval(db: RxDatabase<DatabaseCollections>) {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => pullAll(db), ACTIVE_PULL_INTERVAL_MS);
}

function stopSyncInterval() {
  if (!syncInterval) return;
  clearInterval(syncInterval);
  syncInterval = null;
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

function isRemoteNewer(remoteUpdatedAt: string, localUpdatedAt: string) {
  const remoteTime = Date.parse(remoteUpdatedAt);
  const localTime = Date.parse(localUpdatedAt);

  if (Number.isNaN(remoteTime)) return false;
  if (Number.isNaN(localTime)) return true;

  return remoteTime > localTime;
}

function normalizeValue(value: unknown) {
  return value === undefined ? null : value;
}

function hasMeaningfulDiff(
  remote: SyncDocument,
  local: SyncDocument,
  fields: readonly string[]
) {
  for (const field of fields) {
    if (field === 'updated_at') continue;
    const remoteValue = normalizeValue(remote[field]);
    const localValue = normalizeValue(local[field]);
    if (!Object.is(remoteValue, localValue)) {
      return true;
    }
  }
  return false;
}

export async function setupSync(db: RxDatabase<DatabaseCollections>) {
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    for (const name of collectionNames) {
      const collection = asSyncCollection(db[name]);
      await pullFromSupabase(collection, name);
      await cleanupInvalidUUIDs(collection);
      await pushAllToSupabase(collection, name);

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
            await markTrashedInSupabase(docId, name);
          } else {
            await pushToSupabase(changeEvent.documentData, name);
          }
        } finally {
          queue.delete(docId);
        }
      });
    }

    if (typeof window !== 'undefined') {
      if (document.visibilityState === 'visible') {
        startSyncInterval(db);
      } else {
        stopSyncInterval();
      }
    } else {
      startSyncInterval(db);
    }

    if (typeof window !== 'undefined' && !onlineListenerAttached) {
      onlineListenerAttached = true;
      window.addEventListener('online', async () => {
        await pushAll(db);
        await pullAll(db);
      });
    }

    if (typeof window !== 'undefined' && !visibilityListenerAttached) {
      visibilityListenerAttached = true;
      window.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          startSyncInterval(db);
          await pullAll(db);
        } else {
          stopSyncInterval();
        }
      });
    }
  })();

  return setupPromise;
}

async function pullAll(db: RxDatabase<DatabaseCollections>) {
  for (const name of collectionNames) {
    await pullFromSupabase(asSyncCollection(db[name]), name);
  }
}

async function pushAll(db: RxDatabase<DatabaseCollections>) {
  for (const name of collectionNames) {
    await pushAllToSupabase(asSyncCollection(db[name]), name);
  }
}

function asSyncCollection(collection: AnyCollection) {
  return collection as unknown as RxCollection<SyncDocument>;
}

async function cleanupInvalidUUIDs(collection: RxCollection<SyncDocument>) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const allDocs = await collection.find().exec();
  for (const doc of allDocs) {
    const data = doc.toJSON();
    if (!uuidRegex.test(data.id)) {
      await doc.remove();
    }
  }
}

async function pullFromSupabase(
  collection: RxCollection<SyncDocument>,
  name: CollectionName
) {
  try {
    const { table, fields } = collectionConfig[name];
    const { data, error } = await supabase.from(table).select('*');

    if (error) throw error;

    for (const item of data || []) {
      const row = item as SyncDocument;
      const docId = row.id;
      const queue = getQueue(name);

      queue.add(docId);
      try {
        const exists = await collection.findOne(docId).exec();
        if (!exists) {
          markRemoteUpdate(name, docId, row.updated_at);
          await collection.insert(row);
        } else {
          const localData = exists.toJSON();
          if (isRemoteNewer(row.updated_at, localData.updated_at)) {
            if (!hasMeaningfulDiff(row, localData, fields)) continue;
            markRemoteUpdate(name, docId, row.updated_at);
            await exists.patch(row);
          }
        }
      } finally {
        queue.delete(docId);
      }
    }
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Failed to fetch')) {
      console.error('Pull error:', error);
    }
  }
}

async function pushAllToSupabase(
  collection: RxCollection<SyncDocument>,
  name: CollectionName
) {
  if (syncInProgress.has(name)) return;
  syncInProgress.add(name);

  try {
    const allDocs = await collection.find().exec();
    if (allDocs.length === 0) return;

    for (const doc of allDocs) {
      const docData = doc.toJSON();
      const queue = getQueue(name);

      queue.add(docData.id);
      try {
        await pushToSupabase(docData, name);
      } finally {
        queue.delete(docData.id);
      }
    }
  } catch (error) {
    console.error('Push all error:', error);
  } finally {
    syncInProgress.delete(name);
  }
}

async function pushToSupabase(
  doc: Record<string, unknown>,
  name: CollectionName
) {
  try {
    const { table, fields } = collectionConfig[name];
    const payload = buildPayload(doc, fields);

    const { error } = await supabase.from(table).upsert(payload);
    if (error) throw error;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Failed to fetch')) {
      console.error('Push error:', error);
    }
  }
}

async function markTrashedInSupabase(id: string, name: CollectionName) {
  try {
    const { table } = collectionConfig[name];
    const timestamp = new Date().toISOString();

    const { error } = await supabase
      .from(table)
      .update({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Failed to fetch')) {
      console.error('Delete error:', error);
    }
  }
}
