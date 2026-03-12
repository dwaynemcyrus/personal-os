import { useNavigationActions } from '@/components/providers';
import { NoteEditor } from '../NoteEditor/NoteEditor';

type NoteDetailPageProps = {
  noteId: string;
};

export function NoteDetailPage({ noteId }: NoteDetailPageProps) {
  const { goBack } = useNavigationActions();
  return <NoteEditor noteId={noteId} onClose={goBack} />;
}
