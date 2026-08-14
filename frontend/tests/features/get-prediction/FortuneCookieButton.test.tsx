import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Prediction } from '../../../src/entities/prediction/types';
import { FortuneCookieButton } from '../../../src/features/get-prediction/FortuneCookieButton';
import { baseApi } from '../../../src/shared/api/baseApi';

vi.mock('../../../src/shared/config/env.ts', () => ({
  env: {
    apiBaseUrl: 'http://localhost/api',
    useMocks: false,
  },
}));

const prediction: Prediction = {
  userId: 42,
  year: 2027,
  title: 'Твоё предсказание на 2027',
  text: 'Тебя ждёт неожиданно удачная находка.',
  type: 'fortune',
};

function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderCookie() {
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <FortuneCookieButton userId={42} nextYear={2027} />
    </Provider>,
  );
}

function getCookieButton() {
  return screen.getByRole('button', { name: 'Предсказание на 2027 год' });
}

describe('печенье с предсказанием', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('открывает экран и отправляет GET-запрос во время разлома', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(pendingRequest);
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderCookie();

    await user.click(getCookieButton());

    expect(
      screen.getByRole('dialog', { name: 'Предсказание на 2027 год' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Печенье раскрывает предсказание',
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.method).toBe('GET');
    expect(request.url).toBe('http://localhost/api/users/42/prediction');

    await act(async () => {
      resolveRequest?.(createJsonResponse(prediction));
    });
    expect(
      await screen.findByRole('button', { name: 'Открыть предсказание' }),
    ).toBeInTheDocument();
  });

  it('показывает текст только после нажатия на бумажку', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createJsonResponse(prediction)),
    );

    const user = userEvent.setup();
    renderCookie();
    await user.click(getCookieButton());

    const paper = await screen.findByRole('button', {
      name: 'Открыть предсказание',
    });
    expect(paper).toHaveAttribute('aria-expanded', 'false');

    await user.click(paper);

    expect(
      screen.getByRole('button', { name: prediction.title }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(prediction.text)).toBeInTheDocument();
  });

  it('закрывает экран по Escape и восстанавливает прокрутку', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
      ),
    );
    document.body.style.overflow = 'auto';

    const user = userEvent.setup();
    renderCookie();
    await user.click(getCookieButton());
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('auto');

    await act(async () => {
      resolveRequest?.(createJsonResponse(prediction));
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('показывает ошибку и позволяет повторить запрос', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse(
          { error: { code: 'USER_NOT_FOUND', message: 'user not found' } },
          404,
        ),
      )
      .mockResolvedValueOnce(createJsonResponse(prediction));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderCookie();
    await user.click(getCookieButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'user not found',
    );
    await user.click(
      screen.getByRole('button', { name: 'Попробовать ещё раз' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Открыть предсказание' }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
