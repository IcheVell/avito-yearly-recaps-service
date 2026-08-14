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
  return (
    <RecapCardShell
      variant={variant}
      isActive={isActive}
      className={styles.roleCard}
    >
      <RecapCardHeader title="Твоя роль года" />

      <div className={styles.roleHighlight}>
        <p className={styles.roleTitle}>В этом году ты</p>

        <FitText
          className={`${styles.value} ${styles.roleName}`}
          maxFontSize={56}
          minFontSize={30}
        >
          {role.name}
        </FitText>

        <p className={styles.roleWhy}>{truncateText(role.why, 90)}</p>
      </div>

      <p className={`${styles.text} ${styles.roleSubtitle}`}>
        {truncateText(role.subtitle)}
      </p>
    </RecapCardShell>
  );
}
