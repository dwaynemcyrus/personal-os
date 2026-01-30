import { createRxDatabase, addRxPlugin, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { wrappedValidateZSchemaStorage } from 'rxdb/plugins/validate-z-schema';
import { z } from 'zod';

// Only in development
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin);
}

// Zod schema
const syncTestSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  updated_at: z.string(),
  is_deleted: z.boolean(),
});

// RxDB schema
const syncTestRxSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    content: { type: 'string' },
    updated_at: { type: 'string', format: 'date-time' },
    is_deleted: { type: 'boolean' },
  },
  required: ['id', 'content', 'updated_at', 'is_deleted'],
};

let dbPromise: Promise<RxDatabase> | null = null;

export async function getDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = createRxDatabase({
    name: 'personalos',
    storage: wrappedValidateZSchemaStorage({
      storage: getRxStorageDexie(),
    }),
  });

  const db = await dbPromise;

  // Create collection
  await db.addCollections({
    sync_test: {
      schema: syncTestRxSchema,
    },
  });

  return db;
}

export type SyncTestDocument = z.infer<typeof syncTestSchema>;