import Link from 'next/link';
import styles from './page.module.css';

export default function OfflinePage() {
  return (
    <section className={styles.offline}>
      <div className={styles.card}>
        <div className={styles.title}>Offline</div>
        <p className={styles.body}>
          You&apos;re offline. Some pages may not load yet, but your data will
          continue to save locally and sync when you&apos;re back online.
        </p>
        <Link className={styles.link} href="/thoughts">
          Go to Thoughts
        </Link>
      </div>
    </section>
  );
}
