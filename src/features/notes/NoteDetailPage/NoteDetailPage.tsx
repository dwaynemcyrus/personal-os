import { useNavigationActions } from '@/components/providers';
import { NoteEditor } from '../NoteEditor/NoteEditor';
import styles from './NoteDetailPage.module.css';

type NoteDetailPageProps = {
  noteId: string;
};

export function NoteDetailPage({ noteId }: NoteDetailPageProps) {
  const { goBack } = useNavigationActions();

  return (
    <div className={styles.page}>
      <div className={styles.sheet}>
        <NoteEditor noteId={noteId} onClose={goBack} />
      </div>
    </div>
  );
}
