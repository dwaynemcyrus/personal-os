import { NoteDetailPage } from '@/features/notes/NoteDetailPage/NoteDetailPage';
import type { NoteGroup } from '@/features/notes/hooks/useGroupedNotes';

type Props = {
  params: Promise<{ group: string; noteId: string }>;
};

export default async function NoteDetailRoute({ params }: Props) {
  const { group, noteId } = await params;
  return <NoteDetailPage noteId={noteId} group={group as NoteGroup} />;
}
