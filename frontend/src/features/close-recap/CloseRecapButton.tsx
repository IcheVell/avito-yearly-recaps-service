import styles from './CloseRecapButton.module.css';

type CloseRecapButtonProps = {
  onClose: () => void;
};

export function CloseRecapButton({ onClose }: CloseRecapButtonProps) {
  return (
    <button
      className={styles.button}
      type="button"
      onClick={onClose}
      aria-label="Закрыть итоги года"
    >
      <span className={styles.icon} aria-hidden="true">
        ×
      </span>
      <span className={styles.label}>Закрыть</span>
    </button>
  );
}
