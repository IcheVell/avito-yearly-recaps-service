import { describe, expect, it } from 'vitest';

import { getApiErrorMessage } from '../../../src/shared/api/apiError';

describe('getApiErrorMessage', () => {
  it('показывает общее сообщение для неизвестной ошибки', () => {
    expect(getApiErrorMessage(new Error('Неизвестная ошибка'))).toBe(
      'Произошла неизвестная ошибка.',
    );
  });

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

  it('обрабатывает обычную ошибку 404', () => {
    expect(
      getApiErrorMessage({
        status: 404,
        data: null,
      }),
    ).toBe('Пользователь или итоги не найдены.');
  });

  it.each([500, 502, 503, 504, 505, 511])(
    'показывает сообщение о недоступности при ошибке %s',
    (status) => {
      expect(
        getApiErrorMessage({
          status,
          data: null,
        }),
      ).toBe('Сервис временно недоступен.');
    },
  );
});
