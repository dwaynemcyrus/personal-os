import { createRxDatabase, addRxPlugin, RxCollection, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin, disableWarnings } from 'rxdb/plugins/dev-mode';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { wrappedValidateZSchemaStorage } from 'rxdb/plugins/validate-z-schema';
import { z } from 'zod';

addRxPlugin(RxDBMigrationSchemaPlugin);

// Only in development
if (import.meta.env.DEV) {
  disableWarnings();
  addRxPlugin(RxDBDevModePlugin);
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const itemTypes = [
  'area',
  'plan',
  'objective',
  'key_result',
  'project',
  'task',
  'note',
  'capture',
  'source',
  'habit',
  'habit_entry',
  'template',
] as const;

export const itemStatuses = [
  'inbox',
  'active',
  'backlog',
  'someday',
  'complete',
  'archived',
] as const;

export const itemPriorities = ['low', 'medium', 'high', 'urgent'] as const;

export const contentTypes = ['audio', 'video', 'text', 'live'] as const;

export const readStatuses = ['inbox', 'reading', 'read'] as const;

export const habitFrequencies = ['daily', 'weekdays', 'weekly'] as const;

export const captureSources = ['quick', 'voice', 'email'] as const;

// ── Zod schemas ───────────────────────────────────────────────────────────────

const baseFields = {
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  is_trashed: z.boolean(),
  trashed_at: z.string().nullable(),
  // Sync fields
  owner: z.string().uuid().nullable().optional(),
  device_id: z.string().nullable().optional(),
  sync_rev: z.number().int().nonnegative().nullable().optional(),
};

export const itemSchema = z.object({
  ...baseFields,
  type: z.enum(itemTypes),
  parent_id: z.string().uuid().nullable(),

  // Common
  title: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  tags: z.array(z.string()).readonly().optional(),
  is_pinned: z.boolean(),
  item_status: z.enum(itemStatuses),
  priority: z.enum(itemPriorities).nullable().optional(),

  // Scheduling (tasks, projects)
  due_date: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  completed: z.boolean(),
  is_next: z.boolean(),
  is_someday: z.boolean(),
  is_waiting: z.boolean(),
  waiting_note: z.string().nullable().optional(),
  waiting_started_at: z.string().nullable().optional(),
  depends_on: z.array(z.string().uuid()).readonly().nullable().optional(),

  // Note-specific
  inbox_at: z.string().nullable().optional(),
  subtype: z.string().nullable().optional(),

  // Source-specific
  url: z.string().nullable().optional(),
  content_type: z.enum(contentTypes).nullable().optional(),
  read_status: z.enum(readStatuses).nullable().optional(),

  // OKR / planning
  period_start: z.string().nullable().optional(),
  period_end: z.string().nullable().optional(),
  progress: z.number().int().min(0).max(100).nullable().optional(),

  // Habit
  frequency: z.enum(habitFrequencies).nullable().optional(),
  target: z.number().int().positive().nullable().optional(),
  active: z.boolean().nullable().optional(),
  streak: z.number().int().nonnegative().nullable().optional(),
  last_completed_at: z.string().nullable().optional(),

  // Capture
  body: z.string().nullable().optional(),
  capture_source: z.enum(captureSources).nullable().optional(),
  processed: z.boolean(),
  processed_at: z.string().nullable().optional(),
  result_type: z.string().nullable().optional(),
  result_id: z.string().uuid().nullable().optional(),

  // Template
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  sort_order: z.number().int().nonnegative().nullable().optional(),
});

export const itemLinkSchema = z.object({
  ...baseFields,
  source_id: z.string().uuid(),
  target_id: z.string().uuid().nullable(),
  target_title: z.string(),
  header: z.string().nullable(),
  alias: z.string().nullable(),
  position: z.number().int().nonnegative(),
});

export const itemVersionSchema = z.object({
  ...baseFields,
  item_id: z.string().uuid(),
  content: z.string().nullable(),
  properties: z.record(z.string(), z.unknown()).nullable(),
  version_number: z.number().int().positive(),
  created_by: z.enum(['auto', 'manual']),
  change_summary: z.string().nullable(),
});

const timeEntryTypes = ['planned', 'unplanned'] as const;

const normalizeLabel = (value: string) => value.trim().toLowerCase();

export const timeEntrySchema = z.object({
  ...baseFields,
  item_id: z.string().uuid().nullable(),
  session_id: z.string().uuid().nullable(),
  entry_type: z.enum(timeEntryTypes),
  label: z.string().nullable(),
  label_normalized: z.string().nullable(),
  started_at: z.string(),
  stopped_at: z.string().nullable(),
  duration_seconds: z.number().int().nonnegative().nullable(),
}).superRefine((value, ctx) => {
  if (value.entry_type === 'unplanned') {
    if (!value.label?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unplanned entries require a label.',
        path: ['label'],
      });
    }
    if (!value.label_normalized?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unplanned entries require a normalized label.',
        path: ['label_normalized'],
      });
    }
    if (
      value.label &&
      value.label_normalized &&
      value.label_normalized !== normalizeLabel(value.label)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Normalized label must match the label.',
        path: ['label_normalized'],
      });
    }
  }
});

export const tagSchema = z.object({
  ...baseFields,
  name: z.string(),
});

// ── JSON schemas (RxDB) ───────────────────────────────────────────────────────

const baseProperties = {
  id: { type: 'string', maxLength: 36 },
  created_at: { type: 'string', format: 'date-time' },
  updated_at: { type: 'string', format: 'date-time' },
  is_trashed: { type: 'boolean' },
  trashed_at: { type: ['string', 'null'], format: 'date-time' },
  owner: { type: ['string', 'null'], maxLength: 36 },
  device_id: { type: ['string', 'null'] },
  sync_rev: { type: ['number', 'null'] },
} as const;

const baseRequired = [
  'id',
  'created_at',
  'updated_at',
  'is_trashed',
  'trashed_at',
] as const;

const itemsRxSchema = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    type: { type: 'string', maxLength: 20 },
    parent_id: { type: ['string', 'null'], maxLength: 36 },

    // Common
    title: { type: ['string', 'null'] },
    content: { type: ['string', 'null'] },
    tags: { type: 'array', items: { type: 'string' } },
    is_pinned: { type: 'boolean' },
    item_status: { type: 'string' },
    priority: { type: ['string', 'null'] },

    // Scheduling
    due_date: { type: ['string', 'null'] },
    start_date: { type: ['string', 'null'] },
    completed: { type: 'boolean' },
    is_next: { type: 'boolean' },
    is_someday: { type: 'boolean' },
    is_waiting: { type: 'boolean' },
    waiting_note: { type: ['string', 'null'] },
    waiting_started_at: { type: ['string', 'null'] },
    depends_on: { type: ['array', 'null'], items: { type: 'string', maxLength: 36 } },

    // Note
    inbox_at: { type: ['string', 'null'] },
    subtype: { type: ['string', 'null'] },

    // Source
    url: { type: ['string', 'null'] },
    content_type: { type: ['string', 'null'] },
    read_status: { type: ['string', 'null'] },

    // OKR / planning
    period_start: { type: ['string', 'null'] },
    period_end: { type: ['string', 'null'] },
    progress: { type: ['number', 'null'] },

    // Habit
    frequency: { type: ['string', 'null'] },
    target: { type: ['number', 'null'] },
    active: { type: ['boolean', 'null'] },
    streak: { type: ['number', 'null'] },
    last_completed_at: { type: ['string', 'null'] },

    // Capture
    body: { type: ['string', 'null'] },
    capture_source: { type: ['string', 'null'] },
    processed: { type: 'boolean' },
    processed_at: { type: ['string', 'null'] },
    result_type: { type: ['string', 'null'] },
    result_id: { type: ['string', 'null'], maxLength: 36 },

    // Template
    description: { type: ['string', 'null'] },
    category: { type: ['string', 'null'] },
    sort_order: { type: ['number', 'null'] },
  },
  required: [
    ...baseRequired,
    'type',
    'parent_id',
    'is_pinned',
    'item_status',
    'completed',
    'is_next',
    'is_someday',
    'is_waiting',
    'processed',
  ],
  indexes: [
    'type',
    ['type', 'is_trashed'],
  ],
};

const itemLinksRxSchema = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    source_id: { type: 'string', maxLength: 36 },
    target_id: { type: ['string', 'null'], maxLength: 36 },
    target_title: { type: 'string' },
    header: { type: ['string', 'null'] },
    alias: { type: ['string', 'null'] },
    position: { type: 'number' },
  },
  required: [
    ...baseRequired,
    'source_id',
    'target_id',
    'target_title',
    'header',
    'alias',
    'position',
  ],
  indexes: ['source_id'],
};

const itemVersionsRxSchema = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    item_id: { type: 'string', maxLength: 36 },
    content: { type: ['string', 'null'] },
    properties: { type: ['object', 'null'] },
    version_number: { type: 'number' },
    created_by: { type: 'string', enum: ['auto', 'manual'] },
    change_summary: { type: ['string', 'null'] },
  },
  required: [
    ...baseRequired,
    'item_id',
    'content',
    'properties',
    'version_number',
    'created_by',
    'change_summary',
  ],
  indexes: ['item_id'],
};

const timeEntriesRxSchema = {
  version: 5,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    item_id: { type: ['string', 'null'], maxLength: 36 },
    session_id: { type: ['string', 'null'], maxLength: 36 },
    entry_type: { type: 'string', enum: timeEntryTypes },
    label: { type: ['string', 'null'] },
    label_normalized: { type: ['string', 'null'] },
    started_at: { type: 'string', format: 'date-time' },
    stopped_at: { type: ['string', 'null'], format: 'date-time' },
    duration_seconds: { type: ['number', 'null'] },
  },
  required: [
    ...baseRequired,
    'item_id',
    'session_id',
    'entry_type',
    'label',
    'label_normalized',
    'started_at',
    'stopped_at',
    'duration_seconds',
  ],
};

const tagsRxSchema = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    name: { type: 'string' },
  },
  required: [...baseRequired, 'name'],
};

// ── Migration strategies ───────────────────────────────────────────────────────

function migrateSyncV2Fields(oldDoc: Record<string, unknown>) {
  return {
    ...oldDoc,
    owner: null,
    device_id: null,
    sync_rev: 0,
  };
}

const itemsMigrationStrategies = {
  1: (oldDoc: Record<string, unknown>) => migrateSyncV2Fields(oldDoc),
};

const itemLinksMigrationStrategies = {
  1: (oldDoc: Record<string, unknown>) => migrateSyncV2Fields(oldDoc),
};

const itemVersionsMigrationStrategies = {
  1: (oldDoc: Record<string, unknown>) => migrateSyncV2Fields(oldDoc),
};

const timeEntriesMigrationStrategies = {
  // Versions 1–4 handled old task_id schema; all data is discarded on fresh installs.
  // Version 5 renames task_id → item_id and adds sync v2 fields.
  1: (oldDoc: Record<string, unknown>) => ({ ...oldDoc }),
  2: (oldDoc: Record<string, unknown>) => ({ ...oldDoc }),
  3: (oldDoc: Record<string, unknown>) => ({ ...oldDoc }),
  4: (oldDoc: Record<string, unknown>) => ({ ...oldDoc }),
  5: (oldDoc: Record<string, unknown>) => {
    const { task_id, ...rest } = oldDoc;
    return migrateSyncV2Fields({
      ...rest,
      item_id: task_id ?? null,
    });
  },
};

const tagsMigrationStrategies = {
  1: (oldDoc: Record<string, unknown>) => migrateSyncV2Fields(oldDoc),
};

// ── TypeScript types ──────────────────────────────────────────────────────────

export type ItemDocument = z.infer<typeof itemSchema>;
export type ItemLinkDocument = z.infer<typeof itemLinkSchema>;
export type ItemVersionDocument = z.infer<typeof itemVersionSchema>;
export type TimeEntryDocument = z.infer<typeof timeEntrySchema>;
export type TagDocument = z.infer<typeof tagSchema>;

export type ContentType = (typeof contentTypes)[number];
export type ReadStatus = (typeof readStatuses)[number];
export type ItemType = (typeof itemTypes)[number];
export type ItemStatus = (typeof itemStatuses)[number];
export type ItemPriority = (typeof itemPriorities)[number];

// ── DatabaseCollections ───────────────────────────────────────────────────────

export type DatabaseCollections = {
  items: RxCollection<ItemDocument>;
  item_links: RxCollection<ItemLinkDocument>;
  item_versions: RxCollection<ItemVersionDocument>;
  time_entries: RxCollection<TimeEntryDocument>;
  tags: RxCollection<TagDocument>;
};

// ── Database singleton ────────────────────────────────────────────────────────

let dbPromise: Promise<RxDatabase<DatabaseCollections>> | null = null;

export async function getDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const db = await createRxDatabase<DatabaseCollections>({
      name: 'personalos',
      storage: wrappedValidateZSchemaStorage({
        storage: getRxStorageDexie(),
      }),
    });

    await db.addCollections({
      items: {
        schema: itemsRxSchema,
        migrationStrategies: itemsMigrationStrategies,
      },
      item_links: {
        schema: itemLinksRxSchema,
        migrationStrategies: itemLinksMigrationStrategies,
      },
      item_versions: {
        schema: itemVersionsRxSchema,
        migrationStrategies: itemVersionsMigrationStrategies,
      },
      time_entries: {
        schema: timeEntriesRxSchema,
        migrationStrategies: timeEntriesMigrationStrategies,
      },
      tags: {
        schema: tagsRxSchema,
        migrationStrategies: tagsMigrationStrategies,
      },
    });

    return db;
  })();

  return dbPromise;
}
