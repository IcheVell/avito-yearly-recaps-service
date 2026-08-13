import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Prediction } from '../../../src/entities/prediction/types';
import { GetPredictionButton } from '../../../src/features/get-prediction/GetPredictionButton';
import { PredictionModal } from '../../../src/features/get-prediction/PredictionModal';
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

function renderWithApi(component: React.ReactNode) {
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(<Provider store={store}>{component}</Provider>);
}

function PredictionHarness() {
  const [openPrediction, setOpenPrediction] = useState<Prediction | null>(null);

  return (
    <>
      <GetPredictionButton
        userId={42}
        nextYear={2027}
        onReceived={setOpenPrediction}
      />
      {openPrediction && (
        <PredictionModal
          prediction={openPrediction}
          onClose={() => setOpenPrediction(null)}
        />
      )}
    </>
  );
}

function getPredictionButton() {
  return screen.getByRole('button', { name: /предсказание на 2027 год/i });
}

describe('получение предсказания', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('отправляет GET-запрос для выбранного пользователя', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse(prediction));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderWithApi(
      <GetPredictionButton userId={42} nextYear={2027} onReceived={vi.fn()} />,
    );

    await user.click(getPredictionButton());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.method).toBe('GET');
    expect(request.url).toBe('http://localhost/api/users/42/prediction');
  });

  it('блокирует кнопку во время запроса', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingRequest));

    const user = userEvent.setup();
    renderWithApi(
      <GetPredictionButton userId={42} nextYear={2027} onReceived={vi.fn()} />,
    );

    const button = getPredictionButton();
    await user.click(button);
    expect(button).toBeDisabled();

    await act(async () => {
      resolveRequest?.(createJsonResponse(prediction));
    });
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('открывает и закрывает модалку с ответом backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createJsonResponse(prediction)),
    );

    const user = userEvent.setup();
    renderWithApi(<PredictionHarness />);

    await user.click(getPredictionButton());

    expect(
      await screen.findByRole('dialog', { name: prediction.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(prediction.text)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Закрыть окно' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('показывает ошибку API', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          createJsonResponse(
            { error: { code: 'USER_NOT_FOUND', message: 'user not found' } },
            404,
          ),
        ),
    );

    const user = userEvent.setup();
    renderWithApi(
      <GetPredictionButton userId={42} nextYear={2027} onReceived={vi.fn()} />,
    );

    await user.click(getPredictionButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'user not found',
    );
  });
});
