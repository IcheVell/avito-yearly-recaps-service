import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ShareRecap } from '../../../src/entities/recap/types';
import { ShareRecapPage } from '../../../src/pages/ShareRecapPage/ShareRecapPage';
import { baseApi } from '../../../src/shared/api/baseApi';

vi.mock('../../../src/shared/config/env.ts', () => ({
  env: {
    apiBaseUrl: 'http://localhost/api',
    useMocks: false,
  },
}));

const shareRecap: ShareRecap = {
  year: 2026,
  role: {
    code: 'seller',
    name: 'Продавец',
    title: 'В этом году ты был на волне продаж!',
  },
  metrics: [
    {
      type: 'favorites_count',
      title: 'Избранное',
      text: 'Коллекция избранного за год — 3 объявлений.',
      highlights: ['3 объявлений'],
    },
  ],
  achievements: [
    {
      code: 'both_sides',
      name: 'Две стороны рынка',
      imageUrl: 'static/achievements/two_faced_market.png',
    },
  ],
};

function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function renderPage(token: string) {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <ShareRecapPage token={token} />
    </Provider>,
  );
}

describe('страница share recap', () => {
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
    vi.unstubAllGlobals();
  });

  it('загружает публичные итоги по токену и показывает карточку', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse(shareRecap));
    vi.stubGlobal('fetch', fetchMock);

    renderPage('abc123');

    expect(await screen.findByText('Итоги за')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('Твоя роль:')).toBeInTheDocument();
    expect(screen.getByText('Продавец')).toBeInTheDocument();
    expect(
      screen.getByText('В этом году ты был на волне продаж!'),
    ).toBeInTheDocument();
    expect(screen.getByText('Избранное')).toBeInTheDocument();
    expect(screen.getByText('3 объявлений')).toBeInTheDocument();
    expect(screen.getByText('Две стороны рынка')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Две стороны рынка' }),
    ).toHaveAttribute('src', '/static/achievements/two_faced_market.png');
    expect(
      screen.getByRole('link', { name: 'Получить свои итоги года' }),
    ).toHaveAttribute('href', `${window.location.origin}/`);

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.method).toBe('GET');
    expect(request.url).toBe('http://localhost/api/share/abc123');
  });

  it('показывает ошибку, если ссылка не найдена', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(
          {
            error: {
              code: 'SHARE_NOT_FOUND',
              message: 'share not found',
            },
          },
          404,
        ),
      ),
    );

    renderPage('missing');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Эти итоги больше недоступны.',
    );
  });
});
