import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Recap } from '../../../src/entities/recap/types';
import { GenerateRecapButton } from '../../../src/features/generate-recap/GenerateRecapButton';
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
    target: {},
  },
};

const generationErrorResponse = {
  error: {
    code: 'GENERATION_FAILED',
    message: 'Не удалось сгенерировать итоги.',
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

function renderWithApi(component: ReactNode) {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(<Provider store={store}>{component}</Provider>);
}

function RecapHarness({ userId }: { userId: number }) {
  const [openRecap, setOpenRecap] = useState<Recap | null>(null);

  return (
    <>
      <GenerateRecapButton
        userId={userId}
        year={2025}
        onGenerated={setOpenRecap}
      />

      {openRecap && (
        <RecapOverlay
          recap={openRecap}
          onClose={() => setOpenRecap(null)}
        />
      )}
    </>
  );
}

function getGenerateButton() {
  return screen.getByRole('button', {
    name: /сгенерировать итоги за 2025 год/i,
  });
}

describe('генерация итогов', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('отправляет POST-запрос с userId', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(recap),
    );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderWithApi(
      <GenerateRecapButton
        userId={42}
        year={2025}
        onGenerated={vi.fn()}
      />,
    );

    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const request = fetchMock.mock.calls[0][0] as Request;

    expect(request.method).toBe('POST');
    expect(request.url).toBe(
      'http://localhost/api/recaps/generate',
    );
    await expect(request.json()).resolves.toEqual({ userId: 42 });
  });

  it('блокирует кнопку во время генерации', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(pendingRequest),
    );

    const user = userEvent.setup();
    renderWithApi(
      <GenerateRecapButton
        userId={42}
        year={2025}
        onGenerated={vi.fn()}
      />,
    );

    const button = getGenerateButton();
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

  it('сразу открывает карточки после успешной генерации', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createJsonResponse(recap)),
    );

    const user = userEvent.setup();
    renderWithApi(<RecapHarness userId={42} />);

    await user.click(getGenerateButton());

    expect(
      await screen.findByRole('dialog', {
        name: 'Итоги 2025 года',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Продавец')).toBeInTheDocument();
  });

  it('показывает ошибку генерации пользователю', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(generationErrorResponse, 500),
      ),
    );

    const user = userEvent.setup();
    renderWithApi(
      <GenerateRecapButton
        userId={42}
        year={2025}
        onGenerated={vi.fn()}
      />,
    );

    await user.click(getGenerateButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось сгенерировать итоги.',
    );
  });

  it('повторяет запрос и открывает карточки после ошибки', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve(
          createJsonResponse(generationErrorResponse, 500),
        ),
      )
      .mockImplementationOnce(() =>
        Promise.resolve(createJsonResponse(recap)),
      );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderWithApi(<RecapHarness userId={42} />);

    await user.click(getGenerateButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось сгенерировать итоги.',
    );

    await user.click(getGenerateButton());

    expect(
      await screen.findByRole('dialog', {
        name: 'Итоги 2025 года',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
