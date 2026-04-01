import { supabase } from './supabase';

// ── Current user ──────────────────────────────────────────────────────────────

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW SCHEMA — items table (formerly documents, migration 20260329000000)
// Use these types and helpers for all new features.
// ─────────────────────────────────────────────────────────────────────────────

export type DocumentRow = {
  id: string;
  cuid: string;
  type: string;
  subtype: string | null;
  is_template: boolean;
  title: string | null;
  status: string | null;
  access: string;
  area: string | null;
  workbench: boolean;
  resources: string[];
  dependencies: string[];
  blocked: boolean;
  slug: string | null;
  published: boolean;
  tier: string | null;
  growth: string | null;
  rating: number | null;
  medium: string | null;
  format: string | null;
  asset_type: string | null;
  for_sale: boolean;
  sold: boolean;
  exhibited: boolean;
  price: number | null;
  deal_value: number | null;
  lag_target: number | null;
  lag_actual: number | null;
  attendees: number | null;
  total_sent: number | null;
  total_comments: number | null;
  total_responses: number | null;
  chapter_count: number | null;
  series_position: number | null;
  episode: number | null;
  season: number | null;
  date_delivered: string | null;
  contacted_last: string | null;
  next_follow_up: string | null;
  frequency: string[];
  stack: string[];
  modules: string[];
  be_and_feel: string[];
  chains: string[];
  platforms: string[];
  author: string | null;
  bookmark: string | null;
  certificate_link: string | null;
  collection: string | null;
  contact_status: string | null;
  contact_type: string | null;
  course: string | null;
  cover_alt_text: string | null;
  cover_link: string | null;
  currency: string | null;
  currency_primary: string | null;
  currency_secondary: string | null;
  date: string | null;
  deal_status: string | null;
  delivery: string | null;
  description: string | null;
  dimensions: string | null;
  duration_target: string | null;
  genre: string | null;
  institution: string | null;
  instructor: string | null;
  isbn: string | null;
  issue: string | null;
  lag_measure: string | null;
  lag_unit: string | null;
  manuscript: string | null;
  month: string | null;
  month_expenses_chf: string | null;
  month_profit_chf: string | null;
  month_revenue_chf: string | null;
  mood: string | null;
  outcome: string | null;
  platform: string | null;
  principle: string | null;
  problem: string | null;
  project: string | null;
  recording_link: string | null;
  repo: string | null;
  score_overall: string | null;
  series: string | null;
  solution: string | null;
  source: string | null;
  subtitle: string | null;
  target: string | null;
  theme: string | null;
  unit: string | null;
  url: string | null;
  week: string | null;
  year: string | null;
  start_date: string | null;
  end_date: string | null;
  date_created: string | null;
  date_modified: string | null;
  date_trashed: string | null;
  tags: string[];
  content: string | null;
  frontmatter: Record<string, unknown> | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
};

export type HabitLogRow = {
  id: string;
  habit_id: string | null;
  date: string;
  value: number | null;
  note: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
};

export type FinanceEntryRow = {
  id: string;
  finance_id: string | null;
  entry_type: string;
  date: string;
  counterparty: string | null;
  category: string | null;
  currency: string | null;
  amount: number | null;
  amount_chf: number | null;
  cumulative: number | null;
  note: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
};

export type ItemHistoryRow = {
  id: string;
  item_id: string;
  snapshot: string;
  snapshot_format: 'raw_markdown';
  created_by: 'auto' | 'manual' | 'restore_guard';
  change_summary: string | null;
  source_updated_at: string | null;
  is_trashed: boolean;
  trashed_at: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
};

export type NewDocument = Omit<DocumentRow, 'id' | 'created_at' | 'updated_at' | 'owner' | 'is_template'> & {
  id?: string;
  is_template?: boolean;
};

export type DocumentPatch = Partial<
  Pick<
    DocumentRow,
    | 'title' | 'status' | 'subtype' | 'content' | 'frontmatter'
    | 'area' | 'workbench' | 'resources' | 'dependencies' | 'blocked'
    | 'slug' | 'published' | 'tier' | 'growth' | 'rating'
    | 'medium' | 'format' | 'asset_type'
    | 'for_sale' | 'sold' | 'exhibited'
    | 'price' | 'deal_value' | 'lag_target' | 'lag_actual' | 'attendees'
    | 'total_sent' | 'total_comments' | 'total_responses'
    | 'chapter_count' | 'series_position' | 'episode' | 'season'
    | 'date_delivered' | 'contacted_last' | 'next_follow_up'
    | 'frequency' | 'stack' | 'modules' | 'be_and_feel' | 'chains' | 'platforms'
    | 'author' | 'bookmark' | 'certificate_link' | 'collection'
    | 'contact_status' | 'contact_type' | 'course'
    | 'cover_alt_text' | 'cover_link'
    | 'currency' | 'currency_primary' | 'currency_secondary'
    | 'date' | 'deal_status' | 'delivery' | 'description' | 'dimensions'
    | 'duration_target' | 'genre' | 'institution' | 'instructor' | 'isbn'
    | 'issue' | 'lag_measure' | 'lag_unit' | 'manuscript' | 'month'
    | 'month_expenses_chf' | 'month_profit_chf' | 'month_revenue_chf'
    | 'mood' | 'outcome' | 'platform' | 'principle' | 'problem' | 'project'
    | 'recording_link' | 'repo' | 'score_overall' | 'series'
    | 'solution' | 'source' | 'subtitle' | 'target' | 'theme'
    | 'unit' | 'url' | 'week' | 'year'
    | 'start_date' | 'end_date' | 'date_created' | 'date_modified' | 'date_trashed'
    | 'tags' | 'access' | 'is_template'
  >
> & { updated_at?: string };

export async function createDocument(doc: NewDocument): Promise<string> {
  const owner = await getCurrentUserId();
  const now = new Date().toISOString();
  const row = {
    ...doc,
    owner,
    created_at: now,
    updated_at: now,
    resources:    doc.resources    ?? [],
    dependencies: doc.dependencies ?? [],
    tags:         doc.tags         ?? [],
    blocked:      doc.blocked      ?? false,
    published:    doc.published    ?? false,
    workbench:    doc.workbench    ?? false,
    access:       doc.access       ?? 'private',
    is_template:  doc.is_template  ?? false,
    frequency:    doc.frequency    ?? [],
    stack:        doc.stack        ?? [],
    modules:      doc.modules      ?? [],
    be_and_feel:  doc.be_and_feel  ?? [],
    chains:       doc.chains       ?? [],
    platforms:    doc.platforms    ?? [],
    for_sale:     doc.for_sale     ?? false,
    sold:         doc.sold         ?? false,
    exhibited:    doc.exhibited    ?? false,
  };
  const { data, error } = await supabase.from('items').insert(row).select('id').single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateDocument(id: string, patch: DocumentPatch): Promise<void> {
  if (Object.keys(patch).length === 0) return;
  const { error } = await supabase.from('items').update({
    ...patch,
    updated_at: patch.updated_at ?? new Date().toISOString(),
  }).eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY SCHEMA — kept so existing code compiles without changes.
// These types and helpers reference old column names that no longer exist
// in the database. Features using them will fail at runtime until rebuilt
// in phases 2–6. Do not use for new code.
// ─────────────────────────────────────────────────────────────────────────────

export type ItemRow = {
  id: string;
  type: string;
  status?: string | null;
  date_trashed?: string | null;
  parent_id: string | null;
  title: string | null;
  content: string | null;
  tags: string | null;
  is_pinned: boolean;
  item_status: string;
  priority: string | null;
  due_date: string | null;
  start_date: string | null;
  end_date?: string | null;
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

export type ItemDocument = ItemRow;

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

export type ContentType = 'audio' | 'video' | 'text' | 'live';
export type ReadStatus  = 'inbox' | 'reading' | 'read';
export type ItemStatus  = 'backlog' | 'active' | 'someday' | 'archived';

export const contentTypes: ContentType[] = ['audio', 'video', 'text', 'live'];
export const readStatuses: ReadStatus[]  = ['inbox', 'reading', 'read'];

export function bool(v: boolean | number | null | undefined): boolean {
  return Boolean(v);
}

export function parseTags(v: string | null | undefined): string[] {
  if (!v) return [];
  try { return JSON.parse(v) as string[]; } catch { return []; }
}

export function serializeTags(tags: string[] | null | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  return JSON.stringify(tags);
}

export type NewItem = {
  id: string;
  type: string;
  status?: string | null;
  date_trashed?: string | null;
  parent_id?: string | null;
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  is_pinned?: boolean;
  item_status: string;
  priority?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
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
    ...item,
    tags: serializeTags(item.tags),
    is_pinned: item.is_pinned ?? false,
    completed: item.completed ?? false,
    is_next: item.is_next ?? false,
    is_someday: item.is_someday ?? false,
    is_waiting: item.is_waiting ?? false,
    processed: item.processed ?? false,
    is_trashed: false,
    trashed_at: null,
    owner,
    has_todos: item.content ? item.content.includes('- [ ]') : false,
  };
  const { error } = await supabase.from('items').insert(row);
  if (error) throw error;
}

export type ItemPatch = {
  status?: string | null;
  date_trashed?: string | null;
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  is_pinned?: boolean;
  item_status?: string;
  priority?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
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
  const update: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(patch)) {
    update[key] = key === 'tags' ? serializeTags(val as string[] | null) : (val ?? null);
  }
  if ('content' in patch && patch.content !== undefined) {
    update.has_todos = patch.content ? patch.content.includes('- [ ]') : false;
  }
  const { error } = await supabase.from('items').update(update).eq('id', id);
  if (error) throw error;
}
