import type { CreateListingAction } from '../../../entities/recap/types';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { StubButton } from '../ActionModalShared';
import styles from '../ActionModals.module.css';
import { type ActionModalProps, DEMO_NOTE } from '../actionModalUtils';

export function CreateListingModal({
  action,
  onClose,
}: ActionModalProps<CreateListingAction>) {
  return (
    <Modal
      title="Создать объявление"
      onClose={onClose}
      footer={
        <>
          <StubButton label="Предпросмотр" className={styles.ghostButton} />
          <StubButton label="Опубликовать" className={styles.secondaryButton} />
        </>
      }
    >
      <p className={styles.reason}>{action.reason}</p>

      <form
        className={styles.createForm}
        onSubmit={(event) => event.preventDefault()}
      >
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Название</span>
          <input
            className={styles.fieldInput}
            type="text"
            placeholder="Например, Велосипед в отличном состоянии"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Категория</span>
          <select className={styles.fieldSelect} defaultValue="">
            <option value="" disabled>
              Выберите категорию
            </option>
            <option value="electronics">Электроника</option>
            <option value="home">Для дома</option>
            <option value="hobby">Хобби и отдых</option>
            <option value="fashion">Одежда и обувь</option>
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Цена, ₽</span>
          <input
            className={styles.fieldInput}
            type="number"
            min={0}
            placeholder="0"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Описание</span>
          <textarea
            className={styles.fieldTextarea}
            placeholder="Коротко расскажи о товаре, состоянии и городе"
          />
        </label>
      </form>
      <p className={styles.stubNote}>{DEMO_NOTE}</p>
    </Modal>
  );
}
