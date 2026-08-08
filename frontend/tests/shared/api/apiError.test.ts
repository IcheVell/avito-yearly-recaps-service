import { describe, expect, it } from 'vitest';

import { getApiErrorMessage } from '../../../src/shared/api/apiError';

describe('getApiErrorMessage', () => {
  it('показывает специальное сообщение, если итоги ещё не созданы', () => {
    const message = getApiErrorMessage({
      status: 404,
      data: {
        error: {
          code: 'RECAP_NOT_FOUND',
          message: 'Сообщение сервера',
        },
      },
    });

    expect(message).toContain('ещё не сгенерированы');
  });

  it('использует сообщение бэкенда для остальных ошибок', () => {
    const message = getApiErrorMessage({
      status: 400,
      data: {
        error: {
          code: 'INVALID_REQUEST',
          message: 'Не указан пользователь',
        },
      },
    });

    expect(message).toBe('Не указан пользователь');
  });

  it('объясняет сетевую ошибку', () => {
    expect(
      getApiErrorMessage({
        status: 'FETCH_ERROR',
        error: 'Failed to fetch',
      }),
    ).toBe('Не удалось связаться с сервером.');
  });
});
