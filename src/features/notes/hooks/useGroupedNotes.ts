import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DocumentRow } from '@/lib/db';

export type NoteGroup = 'all' | 'todo' | 'today' | 'locked' | 'pinned' | 'trash';
export type NoteListSort = 'date_modified' | 'date_created' | 'growth';

const NOTE_LIST_COLS = 'id, type, subtype, title, status, growth, updated_at, created_at, date_created, date_modified, date_trashed, tags, content';
const GROWTH_ORDER: Record<string, number> = {
  seedling: 1,
  budding: 2,
  flowering: 3,
  evergreen: 4,
};

export function isNotesListDocument(document: Pick<DocumentRow, 'type' | 'subtype'>): boolean {
  if (document.type === 'creation' || document.type === 'transmission') {
    return true;
  }
  return document.type === 'journal' && document.subtype === 'scratch';
}

function isTodayDocument(document: Pick<DocumentRow, 'updated_at' | 'created_at'>): boolean {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();
  return document.updated_at >= todayIso || document.created_at >= todayIso;
}

function isTodoDocument(document: Pick<DocumentRow, 'content'>): boolean {
  return (document.content ?? '').includes('- [ ]');
}

export function matchesNoteGroup(
  document: Pick<DocumentRow, 'updated_at' | 'created_at' | 'date_trashed' | 'content'>,
  group: NoteGroup,
): boolean {
  const isTrashed = Boolean(document.date_trashed);

  if (group === 'locked') return false;
  if (group === 'trash') return isTrashed;
  if (isTrashed) return false;
  if (group === 'pinned') return false;
  if (group === 'today') return isTodayDocument(document);
  if (group === 'todo') return isTodoDocument(document);
  return true;
}

function getSortTimestamp(document: DocumentRow, sort: NoteListSort): string {
  if (sort === 'date_created') {
    return document.date_created ?? document.created_at ?? '';
  }
  return document.updated_at ?? document.date_modified ?? '';
}

function compareDocuments(a: DocumentRow, b: DocumentRow, sort: NoteListSort): number {
  if (sort === 'growth') {
    const growthDelta = (GROWTH_ORDER[b.growth ?? ''] ?? 0) - (GROWTH_ORDER[a.growth ?? ''] ?? 0);
    if (growthDelta !== 0) return growthDelta;
  }

  return getSortTimestamp(b, sort).localeCompare(getSortTimestamp(a, sort));
}

export function useGroupedNotes(group: NoteGroup, sort: NoteListSort = 'date_modified'): {
  notes: DocumentRow[];
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['notes', 'list', group, sort],
    queryFn: async (): Promise<DocumentRow[]> => {
      if (group === 'locked') return [];

      const { data, error } = await supabase
        .from('items')
        .select(NOTE_LIST_COLS)
        .in('type', ['creation', 'transmission', 'journal'])
        .order('updated_at', { ascending: false });
      if (error) throw error;

      const notes = ((data ?? []) as unknown as DocumentRow[]).filter(isNotesListDocument);

      return notes
        .filter((note) => matchesNoteGroup(note, group))
        .sort((a, b) => compareDocuments(a, b, sort));
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return { notes: data ?? [], isLoading };
}
