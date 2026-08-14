import { useCallback, useRef, useState } from 'react';

import { Toast } from '../../shared/ui/Toast/Toast';

import styles from './ShareRecapButton.module.css';
import { useShareRecap } from './model/useShareRecap';

type ShareRecapButtonProps = {
  userId: number;
};

type Notification = {
  id: number;
  message: string;
  variant: 'error' | 'success';
};

export function ShareRecapButton({ userId }: ShareRecapButtonProps) {
  const notificationSequence = useRef(0);
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = useCallback(
    (message: string, variant: Notification['variant']) => {
      notificationSequence.current += 1;
      setNotification({
        id: notificationSequence.current,
        message,
        variant,
      });
    },
    [],
  );

  const handleCopied = useCallback(
    (message: string) => showNotification(message, 'success'),
    [showNotification],
  );
  const handleError = useCallback(
    (message: string) => showNotification(message, 'error'),
    [showNotification],
  );

  const { shareRecap, isSharing } = useShareRecap({
    userId,
    onCopied: handleCopied,
    onError: handleError,
  });

  return (
    <>
      <button
        className={styles.button}
        type="button"
        aria-label="Поделиться итогами"
        disabled={isSharing}
        aria-busy={isSharing}
        onClick={() => {
          void shareRecap();
        }}
      >
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 16V3m0 0L7 8m5-5 5 5M5 13v7h14v-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.label}>
          {isSharing ? 'Создаём…' : 'Поделиться'}
        </span>
      </button>

      {notification && (
        <Toast
          key={notification.id}
          message={notification.message}
          variant={notification.variant}
          onDismiss={() => {
            setNotification((current) =>
              current?.id === notification.id ? null : current,
            );
          }}
        />
      )}
    </>
  );
}
