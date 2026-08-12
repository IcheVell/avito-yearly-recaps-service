import type { CardVariant } from './cardVariants';
import { RecapCardHeader } from './RecapCardHeader';
import { RecapCardShell } from './RecapCardShell';
import { truncateText } from './truncateText';
import type { RecapAction } from './types';

import styles from './RecapCard.module.css';

type ActionCardProps = {
  action: RecapAction;
  variant: CardVariant;
  isActive: boolean;
  onAction?: (action: RecapAction) => void;
};

export function ActionCard({
  action,
  variant,
  isActive,
  onAction,
}: ActionCardProps) {
  return (
    <RecapCardShell
      variant={variant}
      isActive={isActive}
      className={styles.actionCard}
    >
      <RecapCardHeader title="Что попробовать дальше" />

      <div className={styles.actionBody}>
        <p className={styles.actionEyebrow}>Попробуй в новом году</p>
        <p className={`${styles.text} ${styles.actionReason}`}>
          {truncateText(action.reason)}
        </p>
      </div>

      <button
        className={styles.actionButton}
        type="button"
        tabIndex={isActive ? 0 : -1}
        onClick={() => onAction?.(action)}
      >
        <span>{action.label}</span>
      </button>
    </RecapCardShell>
  );
}
