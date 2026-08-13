import { useEffect, useState } from 'react';

import styles from './Toast.module.css';

type ToastProps = {
  message: string;
  onDismiss: () => void;
  duration?: number;
  variant?: 'error' | 'success';
};

const EXIT_DURATION = 180;

export function Toast({
  message,
  onDismiss,
  duration = 4_000,
  variant = 'error',
}: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => {
      setIsLeaving(true);
    }, duration);
    const dismissTimer = window.setTimeout(onDismiss, duration + EXIT_DURATION);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [duration, onDismiss]);

  return (
    <div
      className={`${styles.toast} ${styles[variant]} ${isLeaving ? styles.toastLeaving : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Закрыть уведомление"
      >
        ×
      </button>
    </div>
  );
}
