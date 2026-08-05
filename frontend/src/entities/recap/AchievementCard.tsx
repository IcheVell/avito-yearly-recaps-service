import type { CardVariant } from './cardVariants';
import type { Achievement } from './types';

import styles from './RecapCard.module.css';

type AchievementCardProps = {
  achievement: Achievement;
  variant: CardVariant;
};


export function AchievementCard({
  achievement,
  variant,
}: AchievementCardProps) {
  return (
    <article className={`${styles.card} ${styles[variant]}`}>
      <header className={styles.header}>
        <span className={styles.logo}>
          <span className={styles.logoDots} aria-hidden="true">
            ● ● ●
          </span>
          Avito
        </span>

        <h2 className={styles.title}>Достижение</h2>
      </header>

      <strong className={styles.value} aria-hidden="true">
        ★
      </strong>

      <div>
        <p className={styles.text}>{achievement.name}</p>
        <p className={styles.text}>{achievement.description}</p>
      </div>
    </article>
  );
}
