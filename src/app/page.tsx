import styles from './page.module.css';

export default function HomePage() {
  return (
    <section className={styles.home}>
      <div className={styles['home__header']}>
        <p className={styles['home__eyebrow']}>Sunday, February 1</p>
        <h1 className={styles['home__title']}>Start with one clear win.</h1>
        <p className={styles['home__subtitle']}>
          Your focus list and timer will live here once Phase 4 lands.
        </p>
      </div>

      <div className={styles['home__card']}>
        <div className={styles['home__card-title']}>Next up</div>
        <p className={styles['home__card-body']}>
          Add tasks or habits from the command center to see them here.
        </p>
      </div>

      <div className={styles['home__pill-row']}>
        <span className={styles['home__pill']}>Focus</span>
        <span className={styles['home__pill']}>Plan</span>
        <span className={styles['home__pill']}>Reflect</span>
      </div>
    </section>
  );
}
