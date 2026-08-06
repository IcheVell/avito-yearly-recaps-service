import type { CardVariant } from './cardVariants';

import styles from './RecapCard.module.css';

type IntroCardProps = {
  year: number;
  variant: CardVariant;
  isActive: boolean;
};

export function IntroCard({
  year,
  variant,
  isActive,
}: IntroCardProps) {
  return (
    <article
      className={`${styles.card} ${styles.introCard} ${
        styles[variant]
      } ${
        isActive ? styles.cardActive : styles.cardInactive
      }`}
    >
      <div className={styles.introDecor} aria-hidden="true">
        <span className={styles.snowflakeTop}>❄</span>
        <span className={styles.snowflakeBottom}>❄</span>
        <span className={styles.glowTop} />
        <span className={styles.glowMiddle} />
        <span className={styles.glowBottom} />
      </div>

      <div className={styles.introMain}>
        <p className={styles.introKicker}>Твой</p>
        <strong className={`${styles.value} ${styles.introYear}`}>
          {year}
        </strong>
        <p className={styles.introTitle}>
          год на <span>Avito</span>
        </p>
      </div>

      <p className={styles.introThanks}>
        Спасибо, что был с нами
      </p>
    </article>
  );
}
