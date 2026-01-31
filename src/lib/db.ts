import { createRxDatabase, addRxPlugin, RxCollection, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { wrappedValidateZSchemaStorage } from 'rxdb/plugins/validate-z-schema';
import { z } from 'zod';

addRxPlugin(RxDBMigrationSchemaPlugin);

// Only in development
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin);
}

const baseFields = {
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  is_deleted: z.boolean(),
  deleted_at: z.string().nullable(),
};

export const syncTestSchema = z.object({
  ...baseFields,
  content: z.string(),
});

export const projectSchema = z.object({
  ...baseFields,
  title: z.string(),
  description: z.string().nullable(),
});

export const taskSchema = z.object({
  ...baseFields,
  project_id: z.string().uuid().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  completed: z.boolean(),
  due_date: z.string().nullable(),
});

export const noteSchema = z.object({
  ...baseFields,
  title: z.string(),
  content: z.string().nullable(),
});

export const habitSchema = z.object({
  ...baseFields,
  title: z.string(),
  description: z.string().nullable(),
});

export const habitCompletionSchema = z.object({
  ...baseFields,
  habit_id: z.string().uuid(),
  completed_date: z.string(),
});

export const timeEntrySchema = z.object({
  ...baseFields,
  task_id: z.string().uuid().nullable(),
  started_at: z.string(),
  stopped_at: z.string().nullable(),
  duration_seconds: z.number().int().nonnegative().nullable(),
});

const baseProperties = {
  id: { type: 'string', maxLength: 36 },
  created_at: { type: 'string', format: 'date-time' },
  updated_at: { type: 'string', format: 'date-time' },
  is_deleted: { type: 'boolean' },
  deleted_at: { type: ['string', 'null'], format: 'date-time' },
} as const;

const baseRequired = [
  'id',
  'created_at',
  'updated_at',
  'is_deleted',
  'deleted_at',
] as const;

const syncTestRxSchema = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    content: { type: 'string' },
  },
  required: [...baseRequired, 'content'],
};

const projectsRxSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
  },
  required: [...baseRequired, 'title', 'description'],
};

const tasksRxSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    project_id: { type: ['string', 'null'], maxLength: 36 },
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    completed: { type: 'boolean' },
    due_date: { type: ['string', 'null'], format: 'date-time' },
  },
  required: [...baseRequired, 'project_id', 'title', 'description', 'completed', 'due_date'],
};

const notesRxSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    title: { type: 'string' },
    content: { type: ['string', 'null'] },
  },
  required: [...baseRequired, 'title', 'content'],
};

const habitsRxSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
  },
  required: [...baseRequired, 'title', 'description'],
};

const habitCompletionsRxSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    habit_id: { type: 'string', maxLength: 36 },
    completed_date: { type: 'string', format: 'date' },
  },
  required: [...baseRequired, 'habit_id', 'completed_date'],
};

const timeEntriesRxSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    task_id: { type: ['string', 'null'], maxLength: 36 },
    started_at: { type: 'string', format: 'date-time' },
    stopped_at: { type: ['string', 'null'], format: 'date-time' },
    duration_seconds: { type: ['number', 'null'] },
  },
  required: [
    ...baseRequired,
    'task_id',
    'started_at',
    'stopped_at',
    'duration_seconds',
  ],
};

type LegacySyncTestDocument = {
  id: string;
  content: string;
  updated_at: string;
  is_deleted?: boolean;
  created_at?: string;
  deleted_at?: string | null;
};

const syncTestMigrationStrategies = {
  1: (oldDoc: LegacySyncTestDocument) => ({
    ...oldDoc,
    is_deleted: oldDoc.is_deleted ?? false,
    created_at: oldDoc.created_at ?? oldDoc.updated_at,
    deleted_at: oldDoc.deleted_at ?? null,
  }),
};

export type SyncTestDocument = z.infer<typeof syncTestSchema>;
export type ProjectDocument = z.infer<typeof projectSchema>;
export type TaskDocument = z.infer<typeof taskSchema>;
export type NoteDocument = z.infer<typeof noteSchema>;
export type HabitDocument = z.infer<typeof habitSchema>;
export type HabitCompletionDocument = z.infer<typeof habitCompletionSchema>;
export type TimeEntryDocument = z.infer<typeof timeEntrySchema>;

export type DatabaseCollections = {
  sync_test: RxCollection<SyncTestDocument>;
  projects: RxCollection<ProjectDocument>;
  tasks: RxCollection<TaskDocument>;
  notes: RxCollection<NoteDocument>;
  habits: RxCollection<HabitDocument>;
  habit_completions: RxCollection<HabitCompletionDocument>;
  time_entries: RxCollection<TimeEntryDocument>;
};

let dbPromise: Promise<RxDatabase<DatabaseCollections>> | null = null;

export async function getDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = createRxDatabase<DatabaseCollections>({
    name: 'personalos',
    storage: wrappedValidateZSchemaStorage({
      storage: getRxStorageDexie(),
    }),
  });

  const db = await dbPromise;

  await db.addCollections({
    sync_test: {
      schema: syncTestRxSchema,
      migrationStrategies: syncTestMigrationStrategies,
    },
    projects: {
      schema: projectsRxSchema,
    },
    tasks: {
      schema: tasksRxSchema,
    },
    notes: {
      schema: notesRxSchema,
    },
    habits: {
      schema: habitsRxSchema,
    },
    habit_completions: {
      schema: habitCompletionsRxSchema,
    },
    time_entries: {
      schema: timeEntriesRxSchema,
    },
  });

  return db;
}
