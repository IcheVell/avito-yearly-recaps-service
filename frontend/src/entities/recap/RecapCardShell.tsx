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
      <RecapCardEffect />
      {children}
    </article>
  );
}
