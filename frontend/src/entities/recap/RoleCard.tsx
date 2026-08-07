import { useId } from 'react';

import type { CardVariant } from './cardVariants';
import { RecapCardHeader } from './RecapCardHeader';
import { RecapCardShell } from './RecapCardShell';
import type { RecapRole } from './types';

import styles from './RecapCard.module.css';

type RoleCardProps = {
  role: RecapRole;
  variant: CardVariant;
  isActive: boolean;
};

export function RoleCard({
  role,
  variant,
  isActive,
}: RoleCardProps) {
  const tooltipId = useId();
  const isLongRoleName = role.name.length > 14;

  return (
    <RecapCardShell
      variant={variant}
      isActive={isActive}
      className={styles.roleCard}
    >
      <RecapCardHeader
        title="Роль"
        className={styles.roleHeader}
      />

      <p className={styles.roleTitle}>В этом году ты</p>

      <div className={styles.roleHighlight}>
        <strong
          className={`${styles.value} ${styles.roleName} ${
            isLongRoleName ? styles.roleNameLong : ''
          }`}
          tabIndex={isActive ? 0 : -1}
          aria-describedby={tooltipId}
        >
          {role.name}
        </strong>

        <span
          id={tooltipId}
          className={styles.roleTooltip}
          role="tooltip"
        >
          {role.why}
        </span>
      </div>

      <p className={`${styles.text} ${styles.roleSubtitle}`}>
        {role.subtitle}
      </p>
    </RecapCardShell>
  );
}
