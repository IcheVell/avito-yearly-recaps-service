import { useId } from 'react';

import { FitText } from '../../shared/ui/FitText/FitText';

import type { CardVariant } from './cardVariants';
import { RecapCardHeader } from './RecapCardHeader';
import { RecapCardShell } from './RecapCardShell';
import { truncateText } from './truncateText';
import type { RecapRole } from './types';

import styles from './RecapCard.module.css';

type RoleCardProps = {
  role: RecapRole;
  variant: CardVariant;
  isActive: boolean;
};

export function RoleCard({ role, variant, isActive }: RoleCardProps) {
  const tooltipId = useId();

  return (
    <RecapCardShell
      variant={variant}
      isActive={isActive}
      className={styles.roleCard}
    >
      <RecapCardHeader title="Роль" />

      <div className={styles.roleHighlight}>
        <p className={styles.roleTitle}>В этом году ты</p>

        <div className={styles.roleNameWrap}>
          <FitText
            className={`${styles.value} ${styles.roleName}`}
            maxFontSize={76}
            minFontSize={30}
            tabIndex={isActive ? 0 : -1}
            aria-describedby={tooltipId}
          >
            {role.name}
          </FitText>

          <span id={tooltipId} className={styles.roleTooltip} role="tooltip">
            {role.why}
          </span>
        </div>
      </div>

      <p className={`${styles.text} ${styles.roleSubtitle}`}>
        {truncateText(role.subtitle)}
      </p>
    </RecapCardShell>
  );
}
