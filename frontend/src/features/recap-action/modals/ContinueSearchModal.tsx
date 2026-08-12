import type { ContinueSearchAction } from '../../../entities/recap/types';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { StubButton } from '../ActionModalShared';
import styles from '../ActionModals.module.css';
import { type ActionModalProps, DEMO_NOTE } from '../actionModalUtils';

export function ContinueSearchModal({
  action,
  onClose,
}: ActionModalProps<ContinueSearchAction>) {
  return (
    <Modal
      title="Продолжить поиск"
      onClose={onClose}
      footer={<StubButton label="Продолжить" />}
    >
      <p className={styles.reason}>{action.reason}</p>
      <p className={styles.emptyState}>
        Можно продолжить поиск
        {action.target.categoryName
          ? ` в категории «${action.target.categoryName}»`
          : ''}
        .
      </p>
      <div className={styles.linkRow}>
        <StubButton label="Перейти" className={styles.ghostButton} />
      </div>
      <p className={styles.stubNote}>{DEMO_NOTE}</p>
    </Modal>
  );
}
