import { useState } from 'react';

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
  const [failedImageUrl, setFailedImageUrl] = useState<
    string | null
  >(null);

  const canShowImage =
    achievement.imageUrl.length > 0 &&
    failedImageUrl !== achievement.imageUrl;

  return (
    <RecapCardShell
      variant={variant}
      isActive={isActive}
      className={styles.achievementCard}
    >
      <RecapCardHeader title="Достижение" />

      <div className={styles.achievementVisual}>
        {canShowImage ? (
          <img
            className={styles.achievementImage}
            src={achievement.imageUrl}
            alt=""
            loading="lazy"
            onError={() => setFailedImageUrl(achievement.imageUrl)}
          />
        ) : (
          <strong
            className={`${styles.value} ${styles.achievementFallback}`}
            aria-hidden="true"
          >
            ★
          </strong>
        )}
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
