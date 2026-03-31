import { supabase } from './supabase';
import { getCurrentUserId, type ItemHistoryRow } from './db';
import { nowIso } from './time';

const AUTO_HISTORY_INTERVAL_MS = 10 * 60 * 1000;
const AUTO_HISTORY_LIMIT = 50;

type CreateItemHistoryInput = {
  itemId: string;
  snapshot: string;
  createdBy: ItemHistoryRow['created_by'];
  changeSummary?: string | null;
  sourceUpdatedAt?: string | null;
};

async function getLatestHistoryRow(itemId: string): Promise<ItemHistoryRow | null> {
  const { data, error } = await supabase
    .from('item_history')
    .select('*')
    .eq('item_id', itemId)
    .eq('is_trashed', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as ItemHistoryRow | null) ?? null;
}

async function getLatestAutoHistoryRow(itemId: string): Promise<ItemHistoryRow | null> {
  const { data, error } = await supabase
    .from('item_history')
    .select('*')
    .eq('item_id', itemId)
    .eq('created_by', 'auto')
    .eq('is_trashed', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as ItemHistoryRow | null) ?? null;
}

async function pruneAutoHistory(itemId: string): Promise<void> {
  const { data, error } = await supabase
    .from('item_history')
    .select('id')
    .eq('item_id', itemId)
    .eq('created_by', 'auto')
    .eq('is_trashed', false)
    .order('created_at', { ascending: false })
    .range(AUTO_HISTORY_LIMIT, AUTO_HISTORY_LIMIT + 500);

  if (error) throw error;

  const ids = (data ?? []).map((row) => row.id as string);
  if (ids.length === 0) return;

  const { error: deleteError } = await supabase
    .from('item_history')
    .delete()
    .in('id', ids);

  if (deleteError) throw deleteError;
}

export async function listItemHistory(itemId: string): Promise<ItemHistoryRow[]> {
  const { data, error } = await supabase
    .from('item_history')
    .select('*')
    .eq('item_id', itemId)
    .eq('is_trashed', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ItemHistoryRow[];
}

export async function createItemHistorySnapshot({
  itemId,
  snapshot,
  createdBy,
  changeSummary = null,
  sourceUpdatedAt = null,
}: CreateItemHistoryInput): Promise<{ created: boolean; row: ItemHistoryRow | null }> {
  const latest = await getLatestHistoryRow(itemId);
  if (latest?.snapshot === snapshot) {
    return { created: false, row: latest };
  }

  const owner = await getCurrentUserId();
  if (!owner) throw new Error('Not authenticated.');

  const timestamp = nowIso();
  const row = {
    item_id: itemId,
    snapshot,
    snapshot_format: 'raw_markdown' as const,
    created_by: createdBy,
    change_summary: changeSummary,
    source_updated_at: sourceUpdatedAt,
    owner,
    created_at: timestamp,
    updated_at: timestamp,
  };

  const { data, error } = await supabase
    .from('item_history')
    .insert(row)
    .select('*')
    .single();

  if (error) throw error;

  if (createdBy === 'auto') {
    await pruneAutoHistory(itemId);
  }

  return { created: true, row: data as ItemHistoryRow };
}

export async function maybeCreateAutoItemHistorySnapshot(
  itemId: string,
  snapshot: string,
  sourceUpdatedAt: string | null
): Promise<boolean> {
  const latestAuto = await getLatestAutoHistoryRow(itemId);
  if (latestAuto) {
    const elapsedMs = Date.now() - new Date(latestAuto.created_at).getTime();
    if (elapsedMs < AUTO_HISTORY_INTERVAL_MS) {
      return false;
    }
  }

  const { created } = await createItemHistorySnapshot({
    itemId,
    snapshot,
    createdBy: 'auto',
    changeSummary: 'Auto-save',
    sourceUpdatedAt,
  });

  return created;
}
