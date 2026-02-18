'use client';

import { useRouter } from 'next/navigation';
import { NoteEditor } from '../NoteEditor/NoteEditor';
import styles from './NoteDetailPage.module.css';

type NoteDetailPageProps = {
  noteId: string;
  group: string;
};

export function NoteDetailPage({ noteId, group }: NoteDetailPageProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <div className={styles.page}>
      <NoteEditor noteId={noteId} onClose={handleClose} />
    </div>
  );
}
