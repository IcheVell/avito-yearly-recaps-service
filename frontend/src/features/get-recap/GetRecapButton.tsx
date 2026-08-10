import { useCallback, useRef, useState } from 'react';

import type { Recap } from '../../entities/recap/types';
import { AsyncActionButton } from '../../shared/ui/AsyncActionButton/AsyncActionButton';
import { Toast } from '../../shared/ui/Toast/Toast';

import { useGetRecap } from './model/useGetRecap';

type GetRecapButtonProps = {
  userId: number;
  onReceived: (recap: Recap) => void;
};

type ErrorNotification = {
  id: number;
  message: string;
};

export function GetRecapButton({ userId, onReceived }: GetRecapButtonProps) {
  const notificationSequence = useRef(0);
  const [notification, setNotification] = useState<ErrorNotification | null>(
    null,
  );

  const showError = useCallback((message: string) => {
    notificationSequence.current += 1;
    setNotification({
      id: notificationSequence.current,
      message,
    });
  }, []);

  const { getRecap, isGetting } = useGetRecap({
    userId,
    onReceived,
    onError: showError,
  });

  return (
    <>
      <AsyncActionButton
        label="Посмотреть итоги года"
        loadingLabel="Загружаем итоги…"
        isLoading={isGetting}
        errorMessage={null}
        onClick={getRecap}
        variant="secondary"
      />

      {notification && (
        <Toast
          key={notification.id}
          message={notification.message}
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
