import styles from '../section.module.css';

export default function ExecutionPage() {
  return (
    <section className={styles.section}>
      <h1 className={styles.section__title}>Execution</h1>
      <p className={styles.section__subtitle}>
        Focus on the tasks and habits that move the needle.
      </p>
      <div className={styles.section__card}>
        <div className={styles['section__card-title']}>Tasks</div>
        <p className={styles['section__card-body']}>
          Task lists, habits, and timers will live here.
        </p>
      </div>
    </section>
  );
}
