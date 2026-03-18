import styles from './StrategyEmptyState.module.css';

type Props = {
  onGuidedSetup: () => void;
  onManualStart: () => void;
};

export function StrategyEmptyState({ onGuidedSetup, onManualStart }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.heading}>Welcome to Plans</h2>
        <p className={styles.body}>
          Set up your planning system with a guided walkthrough, or start from scratch.
        </p>

        <button type="button" className={styles.primaryBtn} onClick={onGuidedSetup}>
          <span className={styles.btnTitle}>Guided Setup</span>
          <span className={styles.btnSub}>Walk through each step</span>
        </button>

        <button type="button" className={styles.secondaryBtn} onClick={onManualStart}>
          <span className={styles.btnTitle}>Start Manual</span>
          <span className={styles.btnSub}>Create documents yourself</span>
        </button>
      </div>
    </div>
  );
}
