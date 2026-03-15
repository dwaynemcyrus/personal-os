import {
  column,
  Schema,
  Table,
  PowerSyncDatabase,
  type AbstractPowerSyncDatabase,
  type PowerSyncBackendConnector,
} from '@powersync/web';
import { supabase } from './supabase';

// ── Schema ────────────────────────────────────────────────────────────────────

const items = new Table({
  type: column.text,
  parent_id: column.text,
  title: column.text,
  content: column.text,
  tags: column.text,           // JSON array
  is_pinned: column.integer,
  item_status: column.text,
  priority: column.text,
  due_date: column.text,
  start_date: column.text,
  completed: column.integer,
  is_next: column.integer,
  is_someday: column.integer,
  is_waiting: column.integer,
  waiting_note: column.text,
  waiting_started_at: column.text,
  depends_on: column.text,     // JSON array
  filename: column.text,
  inbox_at: column.text,
  subtype: column.text,
  url: column.text,
  content_type: column.text,
  read_status: column.text,
  period_start: column.text,
  period_end: column.text,
  progress: column.integer,
  frequency: column.text,
  target: column.integer,
  active: column.integer,
  streak: column.integer,
  last_completed_at: column.text,
  body: column.text,
  capture_source: column.text,
  processed: column.integer,
  processed_at: column.text,
  result_type: column.text,
  result_id: column.text,
  description: column.text,
  category: column.text,
  sort_order: column.integer,
  created_at: column.text,
  updated_at: column.text,
  is_trashed: column.integer,
  trashed_at: column.text,
  owner: column.text,
});

const item_links = new Table({
  source_id: column.text,
  target_id: column.text,
  target_title: column.text,
  header: column.text,
  alias: column.text,
  position: column.integer,
  created_at: column.text,
  updated_at: column.text,
  is_trashed: column.integer,
  trashed_at: column.text,
  owner: column.text,
});

const item_versions = new Table({
  item_id: column.text,
  content: column.text,
  properties: column.text,     // JSON object
  version_number: column.integer,
  created_by: column.text,
  change_summary: column.text,
  created_at: column.text,
  updated_at: column.text,
  is_trashed: column.integer,
  trashed_at: column.text,
  owner: column.text,
});

const time_entries = new Table({
  item_id: column.text,
  session_id: column.text,
  entry_type: column.text,
  label: column.text,
  label_normalized: column.text,
  started_at: column.text,
  stopped_at: column.text,
  duration_seconds: column.integer,
  created_at: column.text,
  updated_at: column.text,
  is_trashed: column.integer,
  trashed_at: column.text,
  owner: column.text,
});

const tags = new Table({
  name: column.text,
  created_at: column.text,
  updated_at: column.text,
  is_trashed: column.integer,
  trashed_at: column.text,
  owner: column.text,
});

export const AppSchema = new Schema({
  items,
  item_links,
  item_versions,
  time_entries,
  tags,
});

// ── Connector ─────────────────────────────────────────────────────────────────

class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return {
      endpoint: import.meta.env.VITE_POWERSYNC_URL as string,
      token: session.access_token,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        const { table, op: operation, id, opData } = op;

        if (operation === 'PUT') {
          const { error } = await supabase.from(table).upsert({ id, ...opData });
          if (error) throw error;
        } else if (operation === 'PATCH') {
          const { error } = await supabase.from(table).update(opData ?? {}).eq('id', id);
          if (error) throw error;
        } else if (operation === 'DELETE') {
          const { error } = await supabase.from(table).delete().eq('id', id);
          if (error) throw error;
        }
      }
      await transaction.complete();
    } catch (error) {
      console.error('[PowerSync] Upload error:', error);
    }
  }
}

export const connector = new SupabaseConnector();

// ── Database singleton ────────────────────────────────────────────────────────

export const psDb = new PowerSyncDatabase({
  schema: AppSchema,
  database: { dbFilename: 'personalos.db' },
});

