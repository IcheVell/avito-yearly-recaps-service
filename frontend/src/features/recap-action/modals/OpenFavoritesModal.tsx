import type { OpenFavoritesAction } from '../../../entities/recap/types';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { StubButton } from '../ActionModalShared';
import styles from '../ActionModals.module.css';
import { type ActionModalProps, DEMO_NOTE } from '../actionModalUtils';

export function OpenFavoritesModal({
  action,
  onClose,
}: ActionModalProps<OpenFavoritesAction>) {
  return (
    <Modal
      title="Вернуться к сохранённым"
      onClose={onClose}
      footer={<StubButton label="Открыть избранное" />}
    >
      <p className={styles.reason}>{action.reason}</p>

      {action.target.categoryName ? (
        <p className={styles.categoryFocus}>
          Категория интереса: {action.target.categoryName}
        </p>
      ) : null}
      <p className={styles.stubNote}>{DEMO_NOTE}</p>
    </Modal>
  );
}
