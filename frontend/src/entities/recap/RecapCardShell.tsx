import type { PropsWithChildren } from 'react';

import type { CardVariant } from './cardVariants';
import { RecapCardEffect } from './RecapCardEffect';

import styles from './RecapCard.module.css';

type RecapCardShellProps = PropsWithChildren<{
  variant: CardVariant;
  isActive: boolean;
  className?: string;
}>;

export function RecapCardShell({
  variant,
  isActive,
  className,
  children,
}: RecapCardShellProps) {
  const cardClassName = [
    styles.card,
    styles[variant],
    isActive ? styles.cardActive : styles.cardInactive,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClassName}>
      <div className={styles.winterDecor} aria-hidden="true">
        <span
          className={`${styles.fallingSnowflake} ${styles.snow1}`}
        >
          ❄
        </span>
        <span
          className={`${styles.fallingSnowflake} ${styles.snow2}`}
        >
          ❄
        </span>
        <span
          className={`${styles.fallingSnowflake} ${styles.snow3}`}
        >
          ❄
        </span>
        <span
          className={`${styles.fallingSnowflake} ${styles.snow4}`}
        >
          ❄
        </span>
        <span
          className={`${styles.fallingSnowflake} ${styles.snow5}`}
        >
          ❄
        </span>
        <span
          className={`${styles.fallingSnowflake} ${styles.snow6}`}
        >
          ❄
        </span>
        <span
          className={`${styles.fallingSnowflake} ${styles.snow7}`}
        >
          ❄
        </span>
        <span
          className={`${styles.fallingSnowflake} ${styles.snow8}`}
        >
          ❄
        </span>
        <span
          className={`${styles.fallingSnowflake} ${styles.snow9}`}
        >
          ❄
        </span>
        <span
          className={`${styles.fallingSnowflake} ${styles.snow10}`}
        >
          ❄
        </span>
      </div>

      {children}
    </article>
  );
}
