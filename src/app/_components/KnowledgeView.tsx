import { NoteList } from '@/features/notes/NoteList/NoteList';
import styles from '../section.module.css';

export function KnowledgeView() {
  return (
    <section className={styles.section}>
      <h1 className={styles.section__title}>Knowledge</h1>
      <p className={styles.section__subtitle}>
        Capture notes, ideas, and references in one place.
      </p>
      <NoteList />
    </section>
  );
}
