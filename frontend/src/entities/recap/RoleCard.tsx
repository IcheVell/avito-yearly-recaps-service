import type { CardVariant } from './cardVariants';
import type { RecapRole } from './types';
import logoSrc from '../../assets/logo.svg.webp';

import styles from './RecapCard.module.css';

type RoleCardProps = {
  role: RecapRole;
  variant: CardVariant;
};


export function RoleCard({ role, variant }: RoleCardProps) {
  return (
    <article className={`${styles.card} ${styles[variant]}`}>
      <header className={styles.header}>
        <img
          src={logoSrc}
          alt="Avito"
          className={styles.logoImage}
        />

        <h2 className={styles.title}>Твоя роль года</h2>
      </header>

      <strong
        className={`${styles.value} ${styles.highlightValue}`}
      >
        {role.activitySharePercent}%
      </strong>

      <div>
        <p className={styles.text}>{role.title}</p>
        <p className={styles.text}>{role.subtitle}</p>
        <p className={styles.text}>{role.why}</p>
      </div>
    </article>
  );
}
