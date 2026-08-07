import type { CardVariant } from './cardVariants';
import { RecapCardHeader } from './RecapCardHeader';
import { RecapCardShell } from './RecapCardShell';
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
    >
      <div className={styles.actionTop}>
        <RecapCardHeader title="Что попробовать дальше" />

        <p className={styles.text}>{action.reason}</p>
      </div>

      <button
        className={styles.actionButton}
        type="button"
        tabIndex={isActive ? 0 : -1}
        onClick={() => onAction?.(action)}
      >
        {action.label}
      </button>
    </RecapCardShell>
  );
}
