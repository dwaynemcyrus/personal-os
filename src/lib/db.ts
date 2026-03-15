// ── Row types (what PowerSync / SQLite returns) ───────────────────────────────
// Booleans are 0|1 integers. Arrays are JSON strings.

export type ItemRow = {
  id: string;
  type: string;
  parent_id: string | null;
  title: string | null;
  content: string | null;
  tags: string | null;
  is_pinned: number;
  item_status: string;
  priority: string | null;
  due_date: string | null;
  start_date: string | null;
  completed: number;
  is_next: number;
  is_someday: number;
  is_waiting: number;
  waiting_note: string | null;
  waiting_started_at: string | null;
  depends_on: string | null;
  filename: string | null;
  inbox_at: string | null;
  subtype: string | null;
  url: string | null;
  content_type: string | null;
  read_status: string | null;
  period_start: string | null;
  period_end: string | null;
  progress: number | null;
  frequency: string | null;
  target: number | null;
  active: number | null;
  streak: number | null;
  last_completed_at: string | null;
  body: string | null;
  capture_source: string | null;
  processed: number;
  processed_at: string | null;
  result_type: string | null;
  result_id: string | null;
  description: string | null;
  category: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  is_trashed: number;
  trashed_at: string | null;
  owner: string | null;
};

export type ItemLinkRow = {
  id: string;
  source_id: string;
  target_id: string | null;
  target_title: string;
  header: string | null;
  alias: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  is_trashed: number;
  trashed_at: string | null;
  owner: string | null;
};

export type ItemVersionRow = {
  id: string;
  item_id: string;
  content: string | null;
  properties: string | null;
  version_number: number;
  created_by: string;
  change_summary: string | null;
  created_at: string;
  updated_at: string;
  is_trashed: number;
  trashed_at: string | null;
  owner: string | null;
};

// ── Value helpers ─────────────────────────────────────────────────────────────

/** Convert SQLite integer boolean to JS boolean */
export function bool(v: number | null | undefined): boolean {
  return v === 1;
}

/** Parse a JSON array stored as text */
export function parseTags(v: string | null | undefined): string[] {
  if (!v) return [];
  try { return JSON.parse(v) as string[]; } catch { return []; }
}

/** Serialize tags array to JSON string for SQLite storage */
export function serializeTags(tags: string[] | null | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  return JSON.stringify(tags);
}

// ── Current user ─────────────────────────────────────────────────────────────

import { supabase } from './supabase';

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// ── Item INSERT helper ────────────────────────────────────────────────────────

import type { AbstractPowerSyncDatabase } from '@powersync/web';

export type TimeEntryRow = {
  id: string;
  item_id: string | null;
  session_id: string | null;
  entry_type: string;
  label: string | null;
  label_normalized: string | null;
  started_at: string;
  stopped_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  is_trashed: number;
  trashed_at: string | null;
  owner: string | null;
};

export type TimeEntryDocument = TimeEntryRow;

export type NewItem = {
  id: string;
  type: string;
  parent_id?: string | null;
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  is_pinned?: boolean;
  item_status: string;
  priority?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  completed?: boolean;
  is_next?: boolean;
  is_someday?: boolean;
  is_waiting?: boolean;
  filename?: string | null;
  inbox_at?: string | null;
  subtype?: string | null;
  url?: string | null;
  content_type?: string | null;
  read_status?: string | null;
  body?: string | null;
  capture_source?: string | null;
  processed?: boolean;
  processed_at?: string | null;
  result_type?: string | null;
  result_id?: string | null;
  created_at: string;
  updated_at: string;
};

export async function insertItem(db: AbstractPowerSyncDatabase, item: NewItem): Promise<void> {
  const owner = await getCurrentUserId();
  await db.execute(
    `INSERT INTO items (
      id, type, parent_id, title, content, tags, is_pinned, item_status, priority,
      due_date, start_date, completed, is_next, is_someday, is_waiting,
      filename, inbox_at, subtype, url, content_type, read_status,
      body, capture_source, processed,
      processed_at, result_type, result_id,
      created_at, updated_at, is_trashed, trashed_at, owner
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, 0, NULL, ?
    )`,
    [
      item.id, item.type, item.parent_id ?? null,
      item.title ?? null, item.content ?? null,
      serializeTags(item.tags),
      item.is_pinned ? 1 : 0,
      item.item_status,
      item.priority ?? null,
      item.due_date ?? null, item.start_date ?? null,
      item.completed ? 1 : 0,
      item.is_next ? 1 : 0,
      item.is_someday ? 1 : 0,
      item.is_waiting ? 1 : 0,
      item.filename ?? null,
      item.inbox_at ?? null,
      item.subtype ?? null,
      item.url ?? null,
      item.content_type ?? null,
      item.read_status ?? null,
      item.body ?? null,
      item.capture_source ?? null,
      item.processed ? 1 : 0,
      item.processed_at ?? null,
      item.result_type ?? null,
      item.result_id ?? null,
      item.created_at, item.updated_at,
      owner,
    ]
  );
}

// ── Item PATCH helper ─────────────────────────────────────────────────────────

type ScalarValue = string | number | boolean | null | undefined;

type ItemPatch = {
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  is_pinned?: boolean;
  item_status?: string;
  priority?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  completed?: boolean;
  is_next?: boolean;
  is_someday?: boolean;
  is_waiting?: boolean;
  waiting_note?: string | null;
  filename?: string | null;
  inbox_at?: string | null;
  subtype?: string | null;
  url?: string | null;
  content_type?: string | null;
  read_status?: string | null;
  is_trashed?: boolean;
  trashed_at?: string | null;
  processed?: boolean;
  processed_at?: string | null;
  result_type?: string | null;
  result_id?: string | null;
  parent_id?: string | null;
  description?: string | null;
  updated_at?: string;
};

export async function patchItem(db: AbstractPowerSyncDatabase, id: string, patch: ItemPatch): Promise<void> {
  const entries = Object.entries(patch) as [keyof ItemPatch, ScalarValue | string[]][];
  if (entries.length === 0) return;

  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, val] of entries) {
    sets.push(`${key} = ?`);
    if (key === 'tags') {
      values.push(serializeTags(val as string[] | null));
    } else if (typeof val === 'boolean') {
      values.push(val ? 1 : 0);
    } else {
      values.push((val as string | number | null | undefined) ?? null);
    }
  }

  await db.execute(
    `UPDATE items SET ${sets.join(', ')} WHERE id = ?`,
    [...values, id]
  );
}

// ── Item link helpers ─────────────────────────────────────────────────────────

export type NewItemLink = {
  id: string;
  source_id: string;
  target_id: string | null;
  target_title: string;
  header: string | null;
  alias: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export async function insertItemLink(db: AbstractPowerSyncDatabase, link: NewItemLink): Promise<void> {
  const owner = await getCurrentUserId();
  await db.execute(
    `INSERT INTO item_links (
      id, source_id, target_id, target_title, header, alias, position,
      created_at, updated_at, is_trashed, trashed_at, owner
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?)`,
    [
      link.id, link.source_id, link.target_id,
      link.target_title, link.header, link.alias, link.position,
      link.created_at, link.updated_at,
      owner,
    ]
  );
}

// ── Item version helpers ──────────────────────────────────────────────────────

export type NewItemVersion = {
  id: string;
  item_id: string;
  content: string | null;
  properties: string | null;
  version_number: number;
  created_by: 'auto' | 'manual';
  change_summary: string | null;
  created_at: string;
  updated_at: string;
};

export async function insertItemVersion(db: AbstractPowerSyncDatabase, v: NewItemVersion): Promise<void> {
  const owner = await getCurrentUserId();
  await db.execute(
    `INSERT INTO item_versions (
      id, item_id, content, properties, version_number, created_by, change_summary,
      created_at, updated_at, is_trashed, trashed_at, owner
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?)`,
    [
      v.id, v.item_id, v.content, v.properties,
      v.version_number, v.created_by, v.change_summary,
      v.created_at, v.updated_at,
      owner,
    ]
  );
}

// ── Legacy type alias (for gradual migration) ─────────────────────────────────
// Components that previously used ItemDocument can use ItemRow instead.
export type ItemDocument = ItemRow;

// ── Domain value types ────────────────────────────────────────────────────────

export type ContentType = 'audio' | 'video' | 'text' | 'live';
export type ReadStatus = 'inbox' | 'reading' | 'read';
export type ItemStatus = 'backlog' | 'active' | 'someday' | 'archived';

export const contentTypes: ContentType[] = ['audio', 'video', 'text', 'live'];
export const readStatuses: ReadStatus[] = ['inbox', 'reading', 'read'];
