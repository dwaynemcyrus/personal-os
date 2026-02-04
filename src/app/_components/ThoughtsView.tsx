import styles from '../section.module.css';

export function ThoughtsView() {
  return (
    <section className={styles.section}>
      <h1 className={styles.section__title}>Thoughts</h1>
      <p className={styles.section__subtitle}>
        Capture notes, ideas, and references in one place.
      </p>
    </section>
  );
}
