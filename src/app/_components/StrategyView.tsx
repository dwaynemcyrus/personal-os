import styles from '../section.module.css';

export function StrategyView() {
  return (
    <section className={styles.section}>
      <h1 className={styles.section__title}>Strategy</h1>
      <p className={styles.section__subtitle}>
        Define your projects and goals before you execute.
      </p>
      <div className={styles.section__card}>
        <div className={styles['section__card-title']}>Projects</div>
        <p className={styles['section__card-body']}>
          Project planning and prioritization will land here.
        </p>
      </div>
    </section>
  );
}
