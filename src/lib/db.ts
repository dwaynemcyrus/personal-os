import { createRxDatabase, addRxPlugin, RxCollection, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin, disableWarnings } from 'rxdb/plugins/dev-mode';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { wrappedValidateZSchemaStorage } from 'rxdb/plugins/validate-z-schema';
import { z } from 'zod';

addRxPlugin(RxDBMigrationSchemaPlugin);

// Only in development
if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin);
  disableWarnings();
}

const baseFields = {
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  is_trashed: z.boolean(),
  trashed_at: z.string().nullable(),
};

const timeEntryTypes = ['planned', 'unplanned'] as const;

const normalizeLabel = (value: string) => value.trim().toLowerCase();

export const syncTestSchema = z.object({
  ...baseFields,
  content: z.string(),
});

const projectStatuses = ['backlog', 'next', 'active', 'hold'] as const;

const coerceProjectStatus = (value: unknown) => {
  if (
    value === 'backlog' ||
    value === 'next' ||
    value === 'active' ||
    value === 'hold'
  ) {
    return value;
  }
  return 'backlog';
};

export const projectSchema = z.object({
  ...baseFields,
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(projectStatuses),
  start_date: z.string().nullable(),
  due_date: z.string().nullable(),
  okr_id: z.string().uuid().nullable().optional(),
});

const taskStatuses = ['backlog', 'waiting', 'next'] as const;

const coerceTaskStatus = (value: unknown) => {
  if (value === 'active') return 'next';
  if (value === 'backlog' || value === 'waiting' || value === 'next') {
    return value;
  }
  return 'backlog';
};

export const taskSchema = z.object({
  ...baseFields,
  project_id: z.string().uuid().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(taskStatuses),
  completed: z.boolean(),
  due_date: z.string().nullable(),
  content: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(4).nullable().optional(),
  depends_on: z.array(z.string().uuid()).readonly().nullable().optional(),
  okr_id: z.string().uuid().nullable().optional(),
});

export const notePropertiesSchema = z.object({
  project_id: z.string().uuid().nullable().optional(),
  status: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  related_notes: z.array(z.string().uuid()).optional(),
  due_date: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(5).nullable().optional(),
  okr_id: z.string().uuid().nullable().optional(),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'annual']).nullable().optional(),
  period_date: z.string().nullable().optional(),
}).passthrough(); // Allow additional custom properties

export const noteSchema = z.object({
  ...baseFields,
  title: z.string(),
  content: z.string().nullable(),
  inbox_at: z.string().nullable(),
  note_type: z.string().nullable(),
  is_pinned: z.boolean(),
  properties: notePropertiesSchema.nullable(),
});

const habitFrequencies = ['daily', 'weekdays', 'weekly'] as const;

export const habitSchema = z.object({
  ...baseFields,
  title: z.string(),
  description: z.string().nullable(),
  frequency: z.enum(habitFrequencies).optional(),
  target: z.number().int().positive().optional(),
  active: z.boolean().optional(),
  okr_id: z.string().uuid().nullable().optional(),
  streak: z.number().int().nonnegative().optional(),
  last_completed_at: z.string().nullable().optional(),
});

export const habitCompletionSchema = z.object({
  ...baseFields,
  habit_id: z.string().uuid(),
  completed_date: z.string(),
});

export const noteLinkSchema = z.object({
  ...baseFields,
  source_id: z.string().uuid(), // Note containing the link
  target_id: z.string().uuid().nullable(), // Note being linked to (null if unresolved)
  target_title: z.string(), // Title text used in the link
  header: z.string().nullable(), // Section header if [[Note#Header]]
  alias: z.string().nullable(), // Alias text if [[Note|alias]]
  position: z.number().int().nonnegative(), // Character position in source content
});

export const templateSchema = z.object({
  ...baseFields,
  title: z.string(), // Template name
  content: z.string(), // Template content with variables like {{date}}, {{title}}
  description: z.string().nullable(), // Brief description of template purpose
  category: z.string().nullable(), // Category for grouping (daily, meeting, etc.)
  sort_order: z.number().int().nonnegative(), // For custom ordering
});

const versionCreatedByTypes = ['auto', 'manual'] as const;

export const noteVersionSchema = z.object({
  ...baseFields,
  note_id: z.string().uuid(),
  content: z.string().nullable(),
  properties: z.record(z.string(), z.unknown()).nullable(),
  version_number: z.number().int().positive(),
  created_by: z.enum(versionCreatedByTypes),
  change_summary: z.string().nullable(),
});

export const timeEntrySchema = z.object({
  ...baseFields,
  task_id: z.string().uuid().nullable(),
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

const captureSources = ['quick', 'voice', 'email'] as const;
const captureResultTypes = ['note', 'task', 'project', 'discarded'] as const;

export const captureSchema = z.object({
  ...baseFields,
  body: z.string(),
  source: z.enum(captureSources).nullable(),
  processed: z.boolean(),
  processed_at: z.string().nullable(),
  result_type: z.enum(captureResultTypes).nullable(),
  result_id: z.string().uuid().nullable(),
});

export const OkrType = ['yearly', '12week', 'objective', 'key_result'] as const;
const okrStatuses = ['draft', 'active', 'complete', 'abandoned'] as const;

export const okrSchema = z.object({
  ...baseFields,
  title: z.string(),
  description: z.string().nullable(),
  type: z.enum(OkrType),
  parent_id: z.string().uuid().nullable(),
  period_start: z.string().nullable(),
  period_end: z.string().nullable(),
  status: z.enum(okrStatuses),
  progress: z.number().int().min(0).max(100),
});

const baseProperties = {
  id: { type: 'string', maxLength: 36 },
  created_at: { type: 'string', format: 'date-time' },
  updated_at: { type: 'string', format: 'date-time' },
  is_trashed: { type: 'boolean' },
  trashed_at: { type: ['string', 'null'], format: 'date-time' },
} as const;

const baseRequired = [
  'id',
  'created_at',
  'updated_at',
  'is_trashed',
  'trashed_at',
] as const;

const syncTestRxSchema = {
  version: 2,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    content: { type: 'string' },
  },
  required: [...baseRequired, 'content'],
};

const projectsRxSchema = {
  version: 3,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    status: { type: 'string', enum: projectStatuses },
    start_date: { type: ['string', 'null'], format: 'date-time' },
    due_date: { type: ['string', 'null'], format: 'date-time' },
    okr_id: { type: ['string', 'null'], maxLength: 36 },
  },
  required: [
    ...baseRequired,
    'title',
    'description',
    'status',
    'start_date',
    'due_date',
    'okr_id',
  ],
};

const tasksRxSchema = {
  version: 3,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    project_id: { type: ['string', 'null'], maxLength: 36 },
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    status: { type: 'string', enum: taskStatuses },
    completed: { type: 'boolean' },
    due_date: { type: ['string', 'null'], format: 'date-time' },
    content: { type: ['string', 'null'] },
    priority: { type: ['number', 'null'] },
    depends_on: { type: ['array', 'null'], items: { type: 'string', maxLength: 36 } },
    okr_id: { type: ['string', 'null'], maxLength: 36 },
  },
  required: [
    ...baseRequired,
    'project_id',
    'title',
    'description',
    'status',
    'completed',
    'due_date',
    'content',
    'priority',
    'depends_on',
    'okr_id',
  ],
};

const notesRxSchema = {
  version: 6,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    title: { type: 'string' },
    content: { type: ['string', 'null'] },
    inbox_at: { type: ['string', 'null'] },
    note_type: { type: ['string', 'null'] },
    is_pinned: { type: 'boolean' },
    properties: { type: ['object', 'null'] },
  },
  required: [
    ...baseRequired,
    'title',
    'content',
    'inbox_at',
    'note_type',
    'is_pinned',
    'properties',
  ],
};

const habitsRxSchema = {
  version: 2,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    frequency: { type: 'string', enum: habitFrequencies },
    target: { type: 'number' },
    active: { type: 'boolean' },
    okr_id: { type: ['string', 'null'], maxLength: 36 },
    streak: { type: 'number' },
    last_completed_at: { type: ['string', 'null'] },
  },
  required: [
    ...baseRequired,
    'title',
    'description',
    'frequency',
    'target',
    'active',
    'okr_id',
    'streak',
    'last_completed_at',
  ],
};

const habitCompletionsRxSchema = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    habit_id: { type: 'string', maxLength: 36 },
    completed_date: { type: 'string', format: 'date' },
  },
  required: [...baseRequired, 'habit_id', 'completed_date'],
};

const noteLinksRxSchema = {
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

const templatesRxSchema = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    title: { type: 'string' },
    content: { type: 'string' },
    description: { type: ['string', 'null'] },
    category: { type: ['string', 'null'] },
    sort_order: { type: 'number' },
  },
  required: [
    ...baseRequired,
    'title',
    'content',
    'description',
    'category',
    'sort_order',
  ],
};

const noteVersionsRxSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    note_id: { type: 'string', maxLength: 36 },
    content: { type: ['string', 'null'] },
    properties: { type: ['object', 'null'] },
    version_number: { type: 'number' },
    created_by: { type: 'string', enum: versionCreatedByTypes },
    change_summary: { type: ['string', 'null'] },
  },
  required: [
    ...baseRequired,
    'note_id',
    'content',
    'properties',
    'version_number',
    'created_by',
    'change_summary',
  ],
  indexes: ['note_id'],
};

const timeEntriesRxSchema = {
  version: 3,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    task_id: { type: ['string', 'null'], maxLength: 36 },
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
    'task_id',
    'session_id',
    'entry_type',
    'label',
    'label_normalized',
    'started_at',
    'stopped_at',
    'duration_seconds',
  ],
};

const capturesRxSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    body: { type: 'string' },
    source: { type: ['string', 'null'] },
    processed: { type: 'boolean' },
    processed_at: { type: ['string', 'null'] },
    result_type: { type: ['string', 'null'] },
    result_id: { type: ['string', 'null'], maxLength: 36 },
  },
  required: [
    ...baseRequired,
    'body',
    'source',
    'processed',
    'processed_at',
    'result_type',
    'result_id',
  ],
};

const okrsRxSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    ...baseProperties,
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    type: { type: 'string', enum: OkrType },
    parent_id: { type: ['string', 'null'], maxLength: 36 },
    period_start: { type: ['string', 'null'] },
    period_end: { type: ['string', 'null'] },
    status: { type: 'string', enum: okrStatuses },
    progress: { type: 'number' },
  },
  required: [
    ...baseRequired,
    'title',
    'description',
    'type',
    'parent_id',
    'period_start',
    'period_end',
    'status',
    'progress',
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

type LegacySoftDeleteFields = {
  is_deleted?: boolean;
  deleted_at?: string | null;
  is_trashed?: boolean;
  trashed_at?: string | null;
};

type LegacyTaskFields = {
  status?: unknown;
  completed?: unknown;
};

type LegacyProjectFields = {
  status?: unknown;
  start_date?: unknown;
  due_date?: unknown;
};

type LegacyTimeEntryFields = {
  entry_type?: unknown;
  label?: unknown;
  label_normalized?: unknown;
  session_id?: unknown;
};

type TimeEntryType = (typeof timeEntryTypes)[number];

const isTimeEntryType = (value: string): value is TimeEntryType =>
  timeEntryTypes.includes(value as TimeEntryType);

const coerceEntryType = (value: unknown): TimeEntryType => {
  if (value === 'log') return 'unplanned';
  if (typeof value === 'string' && isTimeEntryType(value)) return value;
  return 'planned';
};

function migrateSoftDeleteFields<T extends Record<string, unknown>>(
  oldDoc: T & LegacySoftDeleteFields
) {
  const { is_deleted, deleted_at, is_trashed, trashed_at, ...rest } =
    oldDoc as Record<string, unknown> & LegacySoftDeleteFields;

  return {
    ...rest,
    is_trashed: is_trashed ?? is_deleted ?? false,
    trashed_at: trashed_at ?? deleted_at ?? null,
  };
}

function migrateTimeEntryFields(
  oldDoc: LegacySoftDeleteFields & LegacyTimeEntryFields & Record<string, unknown>
) {
  const migrated = migrateSoftDeleteFields(oldDoc);
  const entry_type = coerceEntryType(oldDoc.entry_type);
  const label = typeof oldDoc.label === 'string' ? oldDoc.label : null;
  const label_normalized =
    typeof oldDoc.label_normalized === 'string'
      ? oldDoc.label_normalized
      : label
        ? normalizeLabel(label)
        : null;
  const session_id =
    typeof oldDoc.session_id === 'string' ? oldDoc.session_id : null;

  return {
    ...migrated,
    entry_type,
    label,
    label_normalized,
    session_id,
  };
}

const softDeleteMigrationStrategies = {
  1: (oldDoc: LegacySoftDeleteFields & Record<string, unknown>) =>
    migrateSoftDeleteFields(oldDoc),
};

const notesMigrationStrategies = {
  1: (oldDoc: LegacySoftDeleteFields & Record<string, unknown>) =>
    migrateSoftDeleteFields(oldDoc),
  2: (oldDoc: Record<string, unknown>) => ({
    ...oldDoc,
    inbox_at: oldDoc.inbox_at ?? null,
  }),
  3: (oldDoc: Record<string, unknown>) => ({
    ...oldDoc,
    note_type: oldDoc.note_type ?? null,
  }),
  4: (oldDoc: Record<string, unknown>) => ({
    ...oldDoc,
    is_pinned: oldDoc.is_pinned ?? false,
  }),
  5: (oldDoc: Record<string, unknown>) => ({
    ...oldDoc,
    properties: oldDoc.properties ?? null,
  }),
  6: (oldDoc: Record<string, unknown>) => ({ ...oldDoc }),
};

const tasksMigrationStrategies = {
  1: (oldDoc: LegacySoftDeleteFields & LegacyTaskFields & Record<string, unknown>) => {
    const migrated = migrateSoftDeleteFields(oldDoc);
    const completed = typeof oldDoc.completed === 'boolean' ? oldDoc.completed : false;
    const status = completed ? 'backlog' : coerceTaskStatus(oldDoc.status);

    return {
      ...migrated,
      status,
      completed,
    };
  },
  2: (oldDoc: LegacySoftDeleteFields & LegacyTaskFields & Record<string, unknown>) => {
    const migrated = migrateSoftDeleteFields(oldDoc);
    const completed = typeof oldDoc.completed === 'boolean' ? oldDoc.completed : false;
    const status = completed ? 'backlog' : coerceTaskStatus(oldDoc.status);

    return {
      ...migrated,
      status,
      completed,
    };
  },
  3: (oldDoc: Record<string, unknown>) => ({
    ...oldDoc,
    content: oldDoc.content ?? null,
    priority: oldDoc.priority ?? null,
    depends_on: Array.isArray(oldDoc.depends_on) ? oldDoc.depends_on : null,
    okr_id: oldDoc.okr_id ?? null,
  }),
};

const projectsMigrationStrategies = {
  1: (oldDoc: LegacySoftDeleteFields & LegacyProjectFields & Record<string, unknown>) => {
    const migrated = migrateSoftDeleteFields(oldDoc);
    const status = coerceProjectStatus(oldDoc.status);
    const start_date =
      typeof oldDoc.start_date === 'string' ? oldDoc.start_date : null;
    const due_date = typeof oldDoc.due_date === 'string' ? oldDoc.due_date : null;

    return {
      ...migrated,
      status,
      start_date,
      due_date,
    };
  },
  2: (oldDoc: LegacySoftDeleteFields & LegacyProjectFields & Record<string, unknown>) => {
    const migrated = migrateSoftDeleteFields(oldDoc);
    const status = coerceProjectStatus(oldDoc.status);
    const start_date =
      typeof oldDoc.start_date === 'string' ? oldDoc.start_date : null;
    const due_date = typeof oldDoc.due_date === 'string' ? oldDoc.due_date : null;

    return {
      ...migrated,
      status,
      start_date,
      due_date,
    };
  },
  3: (oldDoc: Record<string, unknown>) => ({
    ...oldDoc,
    okr_id: oldDoc.okr_id ?? null,
  }),
};

const habitsMigrationStrategies = {
  1: (oldDoc: LegacySoftDeleteFields & Record<string, unknown>) =>
    migrateSoftDeleteFields(oldDoc),
  2: (oldDoc: Record<string, unknown>) => ({
    ...oldDoc,
    frequency: (oldDoc.frequency as string) ?? 'daily',
    target: (oldDoc.target as number) ?? 1,
    active: (oldDoc.active as boolean) ?? true,
    okr_id: oldDoc.okr_id ?? null,
    streak: (oldDoc.streak as number) ?? 0,
    last_completed_at: oldDoc.last_completed_at ?? null,
  }),
};

const timeEntriesMigrationStrategies = {
  1: (oldDoc: LegacySoftDeleteFields & Record<string, unknown>) =>
    migrateSoftDeleteFields(oldDoc),
  2: (oldDoc: LegacySoftDeleteFields &
    LegacyTimeEntryFields &
    Record<string, unknown>) => migrateTimeEntryFields(oldDoc),
  3: (oldDoc: LegacySoftDeleteFields &
    LegacyTimeEntryFields &
    Record<string, unknown>) => migrateTimeEntryFields(oldDoc),
};

const syncTestMigrationStrategies = {
  1: (oldDoc: LegacySyncTestDocument) => ({
    ...oldDoc,
    is_deleted: oldDoc.is_deleted ?? false,
    created_at: oldDoc.created_at ?? oldDoc.updated_at,
    deleted_at: oldDoc.deleted_at ?? null,
  }),
  2: (oldDoc: LegacySoftDeleteFields & Record<string, unknown>) =>
    migrateSoftDeleteFields(oldDoc),
};

export type SyncTestDocument = z.infer<typeof syncTestSchema>;
export type ProjectDocument = z.infer<typeof projectSchema>;
export type TaskDocument = z.infer<typeof taskSchema>;
export type NoteDocument = z.infer<typeof noteSchema>;
export type NoteProperties = z.infer<typeof notePropertiesSchema>;
export type HabitDocument = z.infer<typeof habitSchema>;
export type HabitCompletionDocument = z.infer<typeof habitCompletionSchema>;
export type TimeEntryDocument = z.infer<typeof timeEntrySchema>;
export type NoteLinkDocument = z.infer<typeof noteLinkSchema>;
export type TemplateDocument = z.infer<typeof templateSchema>;
export type NoteVersionDocument = z.infer<typeof noteVersionSchema>;
export type CaptureDocument = z.infer<typeof captureSchema>;
export type OkrDocument = z.infer<typeof okrSchema>;
export type OkrTypeValue = (typeof OkrType)[number];

export type DatabaseCollections = {
  sync_test: RxCollection<SyncTestDocument>;
  projects: RxCollection<ProjectDocument>;
  tasks: RxCollection<TaskDocument>;
  notes: RxCollection<NoteDocument>;
  habits: RxCollection<HabitDocument>;
  habit_completions: RxCollection<HabitCompletionDocument>;
  time_entries: RxCollection<TimeEntryDocument>;
  note_links: RxCollection<NoteLinkDocument>;
  templates: RxCollection<TemplateDocument>;
  note_versions: RxCollection<NoteVersionDocument>;
  captures: RxCollection<CaptureDocument>;
  okrs: RxCollection<OkrDocument>;
};

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
      sync_test: {
        schema: syncTestRxSchema,
        migrationStrategies: syncTestMigrationStrategies,
      },
      projects: {
        schema: projectsRxSchema,
        migrationStrategies: projectsMigrationStrategies,
      },
      tasks: {
        schema: tasksRxSchema,
        migrationStrategies: tasksMigrationStrategies,
      },
      notes: {
        schema: notesRxSchema,
        migrationStrategies: notesMigrationStrategies,
      },
      habits: {
        schema: habitsRxSchema,
        migrationStrategies: habitsMigrationStrategies,
      },
      habit_completions: {
        schema: habitCompletionsRxSchema,
        migrationStrategies: softDeleteMigrationStrategies,
      },
      time_entries: {
        schema: timeEntriesRxSchema,
        migrationStrategies: timeEntriesMigrationStrategies,
      },
      note_links: {
        schema: noteLinksRxSchema,
        migrationStrategies: softDeleteMigrationStrategies,
      },
      templates: {
        schema: templatesRxSchema,
        migrationStrategies: softDeleteMigrationStrategies,
      },
      note_versions: {
        schema: noteVersionsRxSchema,
      },
      captures: {
        schema: capturesRxSchema,
      },
      okrs: {
        schema: okrsRxSchema,
      },
    });

    return db;
  })();

  return dbPromise;
}
