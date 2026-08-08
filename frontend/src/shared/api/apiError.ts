import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

type BackendErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: {
      field?: string;
    };
  };
};

function isFetchBaseQueryError(
  error: unknown,
): error is FetchBaseQueryError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error
  );
}

export function getApiErrorMessage(error: unknown): string {
  if (!isFetchBaseQueryError(error)) {
    return 'Произошла неизвестная ошибка.';
  }

  if (typeof error.data === 'object' && error.data !== null) {
    const body = error.data as BackendErrorBody;

    if (body.error?.code === 'RECAP_NOT_FOUND') {
      return 'Итоги года ещё не сгенерированы. Сначала создайте их.';
    }

    if (body.error?.message) {
      return body.error.message;
    }
  }

  switch (error.status) {
    case 400:
      return 'Запрос содержит неверные данные.';
    case 404:
      return 'Пользователь или итоги не найдены.';
    case 409:
      return 'Возник конфликт состояния. Попробуйте ещё раз.';
    case 500:
      return 'Сервис временно недоступен.';
    case 'FETCH_ERROR':
      return 'Не удалось связаться с сервером.';
    default:
      return 'Не удалось выполнить запрос.';
  }
}
