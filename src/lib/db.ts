// ── Row types (what Supabase returns) ─────────────────────────────────────────
// Boolean columns come back as true/false from PostgREST.

export type ItemRow = {
  id: string;
  type: string;
  parent_id: string | null;
  title: string | null;
  content: string | null;
  tags: string | null;          // JSON string e.g. '["tag1","tag2"]'
  is_pinned: boolean;
  item_status: string;
  priority: string | null;
  due_date: string | null;
  start_date: string | null;
  completed: boolean;
  is_next: boolean;
  is_someday: boolean;
  is_waiting: boolean;
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
  processed: boolean;
  processed_at: string | null;
  result_type: string | null;
  result_id: string | null;
  description: string | null;
  category: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  is_trashed: boolean;
  trashed_at: string | null;
  owner: string | null;
  has_todos: boolean | null;
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
  is_trashed: boolean;
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
  is_trashed: boolean;
  trashed_at: string | null;
  owner: string | null;
};

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
  is_trashed: boolean;
  trashed_at: string | null;
  owner: string | null;
};

export type TimeEntryDocument = TimeEntryRow;

// ── Value helpers ─────────────────────────────────────────────────────────────

/** No-op kept for compatibility — Supabase returns real booleans */
export function bool(v: boolean | number | null | undefined): boolean {
  return Boolean(v);
}

/** Parse a JSON array stored as text */
export function parseTags(v: string | null | undefined): string[] {
  if (!v) return [];
  try { return JSON.parse(v) as string[]; } catch { return []; }
}

/** Serialize tags array to JSON string for storage */
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

export async function insertItem(item: NewItem): Promise<void> {
  const owner = await getCurrentUserId();

  const row = {
    id: item.id,
    type: item.type,
    parent_id: item.parent_id ?? null,
    title: item.title ?? null,
    content: item.content ?? null,
    tags: serializeTags(item.tags),
    is_pinned: item.is_pinned ?? false,
    item_status: item.item_status,
    priority: item.priority ?? null,
    due_date: item.due_date ?? null,
    start_date: item.start_date ?? null,
    completed: item.completed ?? false,
    is_next: item.is_next ?? false,
    is_someday: item.is_someday ?? false,
    is_waiting: item.is_waiting ?? false,
    filename: item.filename ?? null,
    inbox_at: item.inbox_at ?? null,
    subtype: item.subtype ?? null,
    url: item.url ?? null,
    content_type: item.content_type ?? null,
    read_status: item.read_status ?? null,
    body: item.body ?? null,
    capture_source: item.capture_source ?? null,
    processed: item.processed ?? false,
    processed_at: item.processed_at ?? null,
    result_type: item.result_type ?? null,
    result_id: item.result_id ?? null,
    is_trashed: false,
    trashed_at: null,
    created_at: item.created_at,
    updated_at: item.updated_at,
    owner,
    has_todos: item.content ? item.content.includes('- [ ]') : false,
  };

  const { error } = await supabase.from('items').insert(row);
  if (error) throw error;

  // Mirror content to item_content so note editors read from there
  if (item.content) {
    const { error: ceError } = await supabase.from('item_content').upsert({
      item_id: item.id,
      content: item.content,
      updated_at: item.updated_at,
      owner,
    }, { onConflict: 'item_id' });
    if (ceError) console.error('[insertItem] item_content upsert error:', ceError);
  }
}

// ── Item PATCH helper ─────────────────────────────────────────────────────────

export type ItemPatch = {
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
  has_todos?: boolean | null;
};

export async function patchItem(id: string, patch: ItemPatch): Promise<void> {
  if (Object.keys(patch).length === 0) return;

  // Build the items update object (convert tags, keep booleans as-is for Supabase)
  const itemsUpdate: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(patch)) {
    if (key === 'tags') {
      itemsUpdate[key] = serializeTags(val as string[] | null);
    } else {
      itemsUpdate[key] = val ?? null;
    }
  }

  // Compute has_todos if content is being updated
  if ('content' in patch && patch.content !== undefined) {
    itemsUpdate.has_todos = patch.content ? patch.content.includes('- [ ]') : false;
  }

  const { error } = await supabase.from('items').update(itemsUpdate).eq('id', id);
  if (error) throw error;

  // Mirror content to item_content when it's being updated
  if ('content' in patch && patch.content !== undefined) {
    const owner = await getCurrentUserId();
    const { error: ceError } = await supabase.from('item_content').upsert({
      item_id: id,
      content: patch.content ?? null,
      updated_at: patch.updated_at ?? new Date().toISOString(),
      owner,
    }, { onConflict: 'item_id' });
    if (ceError) console.error('[patchItem] item_content upsert error:', ceError);
  }
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

export async function insertItemLink(link: NewItemLink): Promise<void> {
  const owner = await getCurrentUserId();
  const { error } = await supabase.from('item_links').insert({
    id: link.id,
    source_id: link.source_id,
    target_id: link.target_id,
    target_title: link.target_title,
    header: link.header,
    alias: link.alias,
    position: link.position,
    created_at: link.created_at,
    updated_at: link.updated_at,
    is_trashed: false,
    trashed_at: null,
    owner,
  });
  if (error) throw error;
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

export async function insertItemVersion(v: NewItemVersion): Promise<void> {
  const owner = await getCurrentUserId();
  const { error } = await supabase.from('item_versions').insert({
    id: v.id,
    item_id: v.item_id,
    content: v.content,
    properties: v.properties,
    version_number: v.version_number,
    created_by: v.created_by,
    change_summary: v.change_summary,
    created_at: v.created_at,
    updated_at: v.updated_at,
    is_trashed: false,
    trashed_at: null,
    owner,
  });
  if (error) throw error;
}

// ── Legacy type alias ─────────────────────────────────────────────────────────
export type ItemDocument = ItemRow;

// ── Domain value types ────────────────────────────────────────────────────────
export type ContentType = 'audio' | 'video' | 'text' | 'live';
export type ReadStatus = 'inbox' | 'reading' | 'read';
export type ItemStatus = 'backlog' | 'active' | 'someday' | 'archived';

export const contentTypes: ContentType[] = ['audio', 'video', 'text', 'live'];
export const readStatuses: ReadStatus[] = ['inbox', 'reading', 'read'];
