import styles from '../section.module.css';

export default function KnowledgePage() {
  return (
    <section className={styles.section}>
      <h1 className={styles.section__title}>Knowledge</h1>
      <p className={styles.section__subtitle}>
        Capture notes, ideas, and references in one place.
      </p>
      <div className={styles.section__card}>
        <div className={styles['section__card-title']}>Notes</div>
        <p className={styles['section__card-body']}>
          The notes list and editor will show up here.
        </p>
      </div>
    </section>
  );
}
