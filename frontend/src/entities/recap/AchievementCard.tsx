import { SafeImage } from '../../shared/ui/SafeImage/SafeImage';
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
      className={styles.achievementCard}
    >
      <RecapCardHeader title="Достижение" />

      <div className={styles.achievementVisual}>
        <SafeImage
          className={styles.achievementImage}
          src={achievement.imageUrl}
          alt=""
          loading="lazy"
          fallback={
            <strong
              className={`${styles.value} ${styles.achievementFallback}`}
              aria-hidden="true"
            >
              ★
            </strong>
          }
        />
      </div>

      <div className={styles.achievementCopy}>
        <p className={`${styles.text} ${styles.achievementName}`}>
          {achievement.name}
        </p>
        <p className={styles.text}>{achievement.description}</p>
      </div>
    </RecapCardShell>
  );
}
