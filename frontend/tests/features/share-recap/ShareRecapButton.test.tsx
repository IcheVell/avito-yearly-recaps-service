import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ShareRecapButton } from '../../../src/features/share-recap/ShareRecapButton';
import { baseApi } from '../../../src/shared/api/baseApi';

vi.mock('../../../src/shared/config/env.ts', () => ({
  env: {
    apiBaseUrl: 'http://localhost/api',
    useMocks: false,
  },
}));

function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function renderButton(userId = 42) {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <ShareRecapButton userId={userId} />
    </Provider>,
  );
}

describe('кнопка поделиться итогами', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('создаёт ссылку, копирует её и показывает уведомление', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        createJsonResponse({ shareUrl: '/share/abc123' }, 201),
      );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderButton();

    await user.click(
      screen.getByRole('button', { name: 'Поделиться итогами' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ссылка скопирована',
    );

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.method).toBe('POST');
    expect(request.url).toBe('http://localhost/api/users/42/recap/share');
  });

  it('показывает ошибку, если recap ещё не создан', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(
          {
            error: {
              code: 'RECAP_NOT_FOUND',
              message: 'recap not found',
            },
          },
          404,
        ),
      ),
    );

    const user = userEvent.setup();
    renderButton();

    await user.click(
      screen.getByRole('button', { name: 'Поделиться итогами' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Итоги года ещё не сгенерированы',
    );
  });

  it('копирует ссылку через fallback, если Clipboard API недоступен', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse({ shareUrl: '/share/fallback-token' }, 201),
      ),
    );

    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
      },
    });
    renderButton();

    await user.click(
      screen.getByRole('button', { name: 'Поделиться итогами' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ссылка скопирована',
    );
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea[aria-hidden="true"]')).toBeNull();
  });
});
