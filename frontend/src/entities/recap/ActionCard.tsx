import type { CardVariant } from './cardVariants';
import type { RecapAction } from './types';

import styles from './RecapCard.module.css';

type ActionCardProps = {
  action: RecapAction;
  variant: CardVariant;
  onAction?: (action: RecapAction) => void;
};


export function ActionCard({
  action,
  variant,
  onAction,
}: ActionCardProps) {
  return (
    <article className={`${styles.card} ${styles[variant]}`}>
      <header className={styles.header}>
        <span className={styles.logo}>
          <span className={styles.logoDots} aria-hidden="true">
            ● ● ●
          </span>
          Avito
        </span>

        <h2 className={styles.title}>Что попробовать дальше</h2>
      </header>

      <span className={styles.badge}>{action.label}</span>

      <p className={styles.text}>{action.reason}</p>

      <button
        className={styles.actionButton}
        type="button"
        onClick={() => onAction?.(action)}
      >
        {action.label}
      </button>
    </article>
  );
}
