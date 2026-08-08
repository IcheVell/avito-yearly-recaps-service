import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AchievementsResponse } from '../../../src/entities/achievement/types';
import type { ProfilesResponse } from '../../../src/entities/profile/types';
import type { YearMetrics } from '../../../src/entities/stats/types';
import { ProfilePage } from '../../../src/pages/ProfilePage/ProfilePage';
import { baseApi } from '../../../src/shared/api/baseApi';

vi.mock('../../../src/shared/config/env.ts', () => ({
  env: {
    apiBaseUrl: 'http://localhost/api',
    useMocks: false,
  },
}));

const profiles: ProfilesResponse = {
  currentYear: 2025,
  items: [
    { id: 1, username: 'Альфа', imageUrl: '' },
    { id: 2, username: 'Бета', imageUrl: '' },
  ],
};

function createStats(
  userId: number,
  listingName: string,
): YearMetrics {
  return {
    userId,
    registrationDate: '2020-01-01T00:00:00Z',
    viewsCount: userId * 100,
    searchesCount: userId * 10,
    favoritesCount: userId,
    messagesPeopleCount: userId,
    listingsCreatedCount: userId,
    buysCount: userId,
    sellsCount: userId,
    spentAmount: userId * 1_000,
    earnedAmount: userId * 2_000,
    maxStreakDays: userId,
    activeDays: userId,
    yearsOnAvito: userId,
    priceMin: userId * 100,
    priceMax: userId * 1_000,
    sellerRating: 5,
    favoriteBuyCategory: null,
    favoriteSellCategory: null,
    mostViewedListing: {
      id: userId,
      name: listingName,
      city: 'Москва',
      imageUrl: '',
      viewsCount: userId * 100,
    },
    bestReviewReceived: null,
    bestReviewLeft: null,
    viewsByCategory: [],
    searchesByCategory: [],
    favorites: [],
    listingViewCounts: [],
    messagedListingIds: [],
    ownListings: [],
  };
}

function createAchievements(
  userId: number,
  achievementName: string,
): AchievementsResponse {
  return {
    earned: [
      {
        code: `earned-${userId}`,
        name: achievementName,
        description: `Достижение профиля ${userId}`,
        imageUrl: '',
        earnedAt: '2025-06-01T00:00:00Z',
      },
    ],
    locked: [],
  };
}

function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createDeferredResponse() {
  let resolve: ((response: Response) => void) | undefined;
  const promise = new Promise<Response>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return {
    promise,
    resolve: (response: Response) => resolve?.(response),
  };
}

function renderProfilePage() {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <ProfilePage />
    </Provider>,
  );
}

function getRequest(input: RequestInfo | URL): Request {
  return input as Request;
}

function getPath(request: Request): string {
  return new URL(request.url).pathname;
}

describe('смена профиля', () => {
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

  it('загружает статистику и достижения выбранного профиля', async () => {
    const requestedPaths: string[] = [];
    const fetchMock = vi.fn().mockImplementation(
      (input: RequestInfo | URL) => {
        const path = getPath(getRequest(input));
        requestedPaths.push(path);

        if (path === '/api/profiles') {
          return Promise.resolve(createJsonResponse(profiles));
        }
        if (path === '/api/users/1/stats') {
          return Promise.resolve(
            createJsonResponse(createStats(1, 'Объявление Альфы')),
          );
        }
        if (path === '/api/users/2/stats') {
          return Promise.resolve(
            createJsonResponse(createStats(2, 'Объявление Беты')),
          );
        }
        if (path === '/api/users/2/achievements') {
          return Promise.resolve(
            createJsonResponse(
              createAchievements(2, 'Достижение Беты'),
            ),
          );
        }

        throw new Error(`Неожиданный запрос: ${path}`);
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderProfilePage();

    await screen.findByText('Объявление Альфы');
    await user.click(
      screen.getByRole('button', { name: 'Бета' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Бета' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Объявление Беты'),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('tab', { name: 'Достижения' }),
    );

    expect(
      await screen.findByText('Достижение Беты'),
    ).toBeInTheDocument();
    expect(requestedPaths).toContain('/api/users/2/stats');
    expect(requestedPaths).toContain('/api/users/2/achievements');
  });

  it('использует новый ID для получения и генерации итогов', async () => {
    const requests: Request[] = [];
    const fetchMock = vi.fn().mockImplementation(
      (input: RequestInfo | URL) => {
        const request = getRequest(input);
        const path = getPath(request);
        requests.push(request);

        if (path === '/api/profiles') {
          return Promise.resolve(createJsonResponse(profiles));
        }
        if (path.endsWith('/stats')) {
          const userId = path.includes('/users/2/') ? 2 : 1;
          return Promise.resolve(
            createJsonResponse(
              createStats(userId, `Объявление ${userId}`),
            ),
          );
        }
        if (path === '/api/users/2/recap') {
          return Promise.resolve(
            createJsonResponse(
              {
                error: {
                  code: 'RECAP_NOT_FOUND',
                  message: 'Итоги ещё не созданы',
                },
              },
              404,
            ),
          );
        }
        if (path === '/api/recaps/generate') {
          return Promise.resolve(
            createJsonResponse(
              {
                error: {
                  code: 'GENERATION_FAILED',
                  message: 'Генерация недоступна',
                },
              },
              500,
            ),
          );
        }

        throw new Error(`Неожиданный запрос: ${path}`);
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderProfilePage();

    await screen.findByText('Объявление 1');
    await user.click(
      screen.getByRole('button', { name: 'Бета' }),
    );
    await screen.findByText('Объявление 2');

    await user.click(
      screen.getByRole('button', {
        name: /посмотреть итоги года/i,
      }),
    );
    await waitFor(() => {
      expect(
        requests.some(
          (request) =>
            request.method === 'GET' &&
            getPath(request) === '/api/users/2/recap',
        ),
      ).toBe(true);
    });

    await user.click(
      screen.getByRole('button', {
        name: /сгенерировать итоги за 2025 год/i,
      }),
    );

    const generateRequest = await waitFor(() => {
      const request = requests.find(
        (item) =>
          item.method === 'POST' &&
          getPath(item) === '/api/recaps/generate',
      );
      expect(request).toBeDefined();
      return request as Request;
    });

    await expect(generateRequest.json()).resolves.toEqual({
      userId: 2,
    });
  });

  it('скрывает данные прошлого профиля во время загрузки новых', async () => {
    const betaStats = createDeferredResponse();
    const fetchMock = vi.fn().mockImplementation(
      (input: RequestInfo | URL) => {
        const path = getPath(getRequest(input));

        if (path === '/api/profiles') {
          return Promise.resolve(createJsonResponse(profiles));
        }
        if (path === '/api/users/1/stats') {
          return Promise.resolve(
            createJsonResponse(createStats(1, 'Старые данные')),
          );
        }
        if (path === '/api/users/2/stats') {
          return betaStats.promise;
        }

        throw new Error(`Неожиданный запрос: ${path}`);
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderProfilePage();

    expect(await screen.findByText('Старые данные')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Бета' }),
    );

    await waitFor(() => {
      expect(screen.queryByText('Старые данные')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('status')).toBeInTheDocument();

    await act(async () => {
      betaStats.resolve(
        createJsonResponse(createStats(2, 'Новые данные')),
      );
    });

    expect(await screen.findByText('Новые данные')).toBeInTheDocument();
  });

  it('не заменяет новые данные запоздавшим ответом прошлого профиля', async () => {
    const alphaStats = createDeferredResponse();
    const fetchMock = vi.fn().mockImplementation(
      (input: RequestInfo | URL) => {
        const path = getPath(getRequest(input));

        if (path === '/api/profiles') {
          return Promise.resolve(createJsonResponse(profiles));
        }
        if (path === '/api/users/1/stats') {
          return alphaStats.promise;
        }
        if (path === '/api/users/2/stats') {
          return Promise.resolve(
            createJsonResponse(createStats(2, 'Актуальные данные')),
          );
        }

        throw new Error(`Неожиданный запрос: ${path}`);
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderProfilePage();

    await user.click(
      await screen.findByRole('button', { name: 'Бета' }),
    );
    expect(
      await screen.findByText('Актуальные данные'),
    ).toBeInTheDocument();

    await act(async () => {
      alphaStats.resolve(
        createJsonResponse(createStats(1, 'Запоздавшие данные')),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Актуальные данные')).toBeInTheDocument();
      expect(
        screen.queryByText('Запоздавшие данные'),
      ).not.toBeInTheDocument();
    });
  });
});
