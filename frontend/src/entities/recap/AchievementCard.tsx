import type { Achievement } from '../achievement/types';
import type { CardVariant } from './cardVariants';
import { RecapCardHeader } from './RecapCardHeader';
import { RecapCardShell } from './RecapCardShell';

import styles from './RecapCard.module.css';

type AchievementCardProps = {
  achievement: Achievement;
  variant: CardVariant;
  isActive: boolean;
};

export function AchievementCard({
  achievement,
  variant,
  isActive,
}: AchievementCardProps) {
  return (
    <RecapCardShell
      variant={variant}
      isActive={isActive}
    >
      <RecapCardHeader title="Достижение" />

      <strong className={styles.value} aria-hidden="true">
        ★
      </strong>

      <div>
        <p className={styles.text}>{achievement.name}</p>
        <p className={styles.text}>{achievement.description}</p>
      </div>
    </RecapCardShell>
  );
}
