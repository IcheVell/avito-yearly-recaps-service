import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Recap } from '../../../src/entities/recap/types';
import { GetRecapButton } from '../../../src/features/get-recap/GetRecapButton';
import { baseApi } from '../../../src/shared/api/baseApi';
import { RecapOverlay } from '../../../src/widgets/RecapOverlay/RecapOverlay';

vi.mock('../../../src/shared/config/env.ts', () => ({
  env: {
    apiBaseUrl: 'http://localhost/api',
    useMocks: false,
  },
}));

const recap: Recap = {
  id: 7,
  userId: 42,
  year: 2025,
  createdAt: '2026-01-10T12:00:00Z',
  role: {
    code: 'seller',
    name: 'Продавец',
    title: 'Продавец года',
    subtitle: 'Ты отлично продавал',
    why: 'Много успешных объявлений',
    activitySharePercent: 67,
  },
  metrics: [],
  achievements: [],
  action: {
    type: 'create_listing',
    label: 'Создать объявление',
    reason: 'Продолжить продажи',
    target: { listingIds: [], categoryId: 0, listings: [] },
  },
};

const recapNotFoundResponse = {
  error: {
    code: 'RECAP_NOT_FOUND',
    message: 'Итоги пользователя ещё не сгенерированы.',
    details: {
      field: 'userId',
    },
  },
};

function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createTestStore() {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
}

function renderWithApi(component: React.ReactNode) {
  const store = createTestStore();

  return render(<Provider store={store}>{component}</Provider>);
}

function RecapHarness({ userId }: { userId: number }) {
  const [openRecap, setOpenRecap] = useState<Recap | null>(null);

  return (
    <>
      <GetRecapButton userId={userId} onReceived={setOpenRecap} />

      {openRecap && (
        <RecapOverlay recap={openRecap} onClose={() => setOpenRecap(null)} />
      )}
    </>
  );
}

function getRecapButton() {
  return screen.getByRole('button', {
    name: /посмотреть итоги года/i,
  });
}

describe('получение итогов', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('отправляет GET-запрос по правильному маршруту с userId', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse(recap));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderWithApi(<GetRecapButton userId={42} onReceived={vi.fn()} />);

    await user.click(getRecapButton());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const request = fetchMock.mock.calls[0][0] as Request;

    expect(request.method).toBe('GET');
    expect(request.url).toBe('http://localhost/api/users/42/recap');
  });

  it('блокирует кнопку, пока запрос выполняется', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(pendingRequest);
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderWithApi(<GetRecapButton userId={42} onReceived={vi.fn()} />);

    const button = getRecapButton();
    await user.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    await act(async () => {
      resolveRequest?.(createJsonResponse(recap));
    });

    await waitFor(() => {
      expect(button).toBeEnabled();
    });
  });

  it('открывает карточки после успешного ответа', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createJsonResponse(recap)),
    );

    const user = userEvent.setup();
    renderWithApi(<RecapHarness userId={42} />);

    await user.click(getRecapButton());

    expect(
      await screen.findByRole('dialog', {
        name: 'Итоги 2025 года',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Продавец')).toBeInTheDocument();
  });

  it('показывает специальную плашку при RECAP_NOT_FOUND', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(createJsonResponse(recapNotFoundResponse, 404)),
        ),
    );

    const user = userEvent.setup();
    renderWithApi(<GetRecapButton userId={42} onReceived={vi.fn()} />);

    await user.click(getRecapButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Итоги года ещё не сгенерированы',
    );
  });

  it('скрывает плашку по таймеру', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createJsonResponse(recapNotFoundResponse, 404)),
    );

    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    renderWithApi(<GetRecapButton userId={42} onReceived={vi.fn()} />);

    await user.click(getRecapButton());
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_180);
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('закрывает плашку вручную', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createJsonResponse(recapNotFoundResponse, 404)),
    );

    const user = userEvent.setup();
    renderWithApi(<GetRecapButton userId={42} onReceived={vi.fn()} />);

    await user.click(getRecapButton());
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: /закрыть уведомление/i,
      }),
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('снова показывает плашку после повторного запроса', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(createJsonResponse(recapNotFoundResponse, 404)),
      );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderWithApi(<GetRecapButton userId={42} onReceived={vi.fn()} />);

    const button = getRecapButton();
    await user.click(button);
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: /закрыть уведомление/i,
      }),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(button);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Итоги года ещё не сгенерированы',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
