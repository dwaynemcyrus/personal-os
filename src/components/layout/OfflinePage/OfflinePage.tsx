import styles from './OfflinePage.module.css';

export function OfflinePage() {
  return (
    <section className={styles.offline}>
      <div className={styles.card}>
        <div className={styles.title}>Offline</div>
        <p className={styles.body}>
          You&apos;re offline. Your data continues to save locally and will
          sync when you&apos;re back online.
        </p>
      </div>
    </section>
  );
}
