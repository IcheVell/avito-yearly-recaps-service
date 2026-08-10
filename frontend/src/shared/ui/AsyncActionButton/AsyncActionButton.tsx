import styles from './AsyncActionButton.module.css';

type AsyncActionButtonProps = {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
  errorMessage: string | null;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

export function AsyncActionButton({
  label,
  loadingLabel,
  isLoading,
  errorMessage,
  onClick,
  variant = 'primary',
}: AsyncActionButtonProps) {
  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.button} ${styles[variant]}`}
        type="button"
        onClick={onClick}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading && <span className={styles.spinner} aria-hidden="true" />}

        {isLoading ? loadingLabel : label}
      </button>

      {errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
