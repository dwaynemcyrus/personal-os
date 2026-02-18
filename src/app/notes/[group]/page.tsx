import { NotesList } from '@/features/notes/NotesList/NotesList';
import type { NoteGroup } from '@/features/notes/hooks/useGroupedNotes';

type Props = {
  params: Promise<{ group: string }>;
};

export default async function NotesGroupPage({ params }: Props) {
  const { group } = await params;
  return <NotesList group={group as NoteGroup} />;
}
