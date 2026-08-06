import type { CardVariant } from './cardVariants';
import type { Achievement } from './types';
import logoSrc from '../../assets/logo.svg.webp';

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
    <article
      className={`${styles.card} ${styles[variant]} ${
        isActive ? styles.cardActive : styles.cardInactive
      }`}
    >
      <header className={styles.header}>
        <img
          src={logoSrc}
          alt="Avito"
          className={styles.logoImage}
        />

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
