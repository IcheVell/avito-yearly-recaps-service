import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';

import type { AchievementsResponse } from '../../../src/entities/achievement/types';
import type { ProfilesResponse } from '../../../src/entities/profile/types';
import type { YearMetrics } from '../../../src/entities/stats/types';
import { ProfilePage } from '../../../src/pages/ProfilePage/ProfilePage';
import { baseApi } from '../../../src/shared/api/baseApi';

export const profiles: ProfilesResponse = {
  currentYear: 2025,
  items: [
    { id: 1, username: 'Альфа', imageUrl: '' },
    { id: 2, username: 'Бета', imageUrl: '' },
  ],
};

export function createStats(
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

export function createAchievements(
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

export function createJsonResponse(
  data: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function createDeferredResponse() {
  let resolve: ((response: Response) => void) | undefined;
  const promise = new Promise<Response>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return {
    promise,
    resolve: (response: Response) => resolve?.(response),
  };
}

export function renderProfilePage() {
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

export function getRequest(input: RequestInfo | URL): Request {
  return input as Request;
}

export function getPath(request: Request): string {
  return new URL(request.url).pathname;
}
