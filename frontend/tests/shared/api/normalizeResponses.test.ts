import { describe, expect, it } from 'vitest';

import { normalizeProfilesResponse } from '../../../src/shared/api/normalizeProfiles';
import { normalizePredictionResponse } from '../../../src/shared/api/normalizePrediction';
import { normalizeRecapResponse } from '../../../src/shared/api/normalizeRecap';
import { normalizeStatsResponse } from '../../../src/shared/api/normalizeStats';

describe('soft API response normalization', () => {
  it('normalizes profiles and drops invalid array items', () => {
    expect(
      normalizeProfilesResponse({
        currentYear: 2026,
        items: [
          { id: 1, username: 'Alina', imageUrl: '/avatar.png' },
          { id: '2', username: 'Broken' },
          null,
        ],
      }),
    ).toEqual({
      currentYear: 2026,
      items: [{ id: 1, username: 'Alina', imageUrl: '/avatar.png' }],
    });

    expect(normalizeProfilesResponse('broken')).toEqual({
      currentYear: 0,
      items: [],
    });
  });

  it('fills scalar stats defaults and drops malformed nested items', () => {
    const stats = normalizeStatsResponse({
      userId: 42,
      registrationDate: '2020-01-01T00:00:00Z',
      viewsCount: 100,
      spentAmount: null,
      sellerRating: '4.9',
      favoriteBuyCategory: { id: 1, name: 'Электроника' },
      viewsByCategory: [
        { categoryId: 1, categoryName: 'Электроника', views: 10 },
        { categoryId: 'broken', categoryName: 'Одежда', views: 5 },
      ],
      messagedListingIds: [1, '2', 3],
      ownListings: 'not-an-array',
    });

    expect(stats).toMatchObject({
      userId: 42,
      registrationDate: '2020-01-01T00:00:00Z',
      viewsCount: 100,
      searchesCount: 0,
      spentAmount: null,
      sellerRating: null,
      favoriteBuyCategory: { id: 1, name: 'Электроника' },
      viewsByCategory: [
        { categoryId: 1, categoryName: 'Электроника', views: 10 },
      ],
      messagedListingIds: [1, 3],
      ownListings: [],
    });
  });

  it('keeps a recap render-safe when nested structures are malformed', () => {
    const recap = normalizeRecapResponse({
      id: 7,
      userId: 42,
      year: 2026,
      createdAt: '2026-12-31T00:00:00Z',
      role: { code: 'buyer', title: 'Покупатель' },
      metrics: [
        {
          type: 'views_count',
          title: 'Просмотры',
          text: 'Много просмотров',
          highlights: ['100', 200],
          payload: null,
        },
        { type: 5 },
      ],
      achievements: [
        {
          code: 'diplomat',
          name: 'Дипломат',
          description: 'Описание',
          imageUrl: null,
        },
        { code: 'broken' },
      ],
      action: {
        type: 'unknown_action',
        target: {
          listingIds: [10, '11'],
          categoryId: 'broken',
          listings: [{ id: 10, price: null }, { name: 'broken' }],
        },
      },
      debug: { generatorVersion: 1 },
    });

    expect(recap.role).toEqual({
      code: 'buyer',
      name: '',
      title: 'Покупатель',
      subtitle: '',
      why: '',
      activitySharePercent: 0,
    });
    expect(recap.metrics).toEqual([
      {
        type: 'views_count',
        title: 'Просмотры',
        text: 'Много просмотров',
        highlights: ['100'],
        payload: {},
      },
    ]);
    expect(recap.achievements).toHaveLength(1);
    expect(recap.action).toEqual({
      type: 'continue_search',
      label: '',
      reason: '',
      target: {
        listingIds: [10],
        categoryId: 0,
        listings: [
          {
            id: 10,
            name: null,
            imageUrl: null,
            price: null,
            city: null,
            status: null,
            categoryId: null,
            categoryName: null,
            viewsCount: null,
            updatedAt: null,
          },
        ],
      },
    });
    expect(recap.debug).toBeUndefined();
  });

  it('returns a complete safe recap shape for an invalid root', () => {
    expect(normalizeRecapResponse(null)).toMatchObject({
      id: 0,
      userId: 0,
      year: 0,
      createdAt: '',
      metrics: [],
      achievements: [],
      action: {
        type: 'continue_search',
        target: { listingIds: [], categoryId: 0, listings: [] },
      },
    });
  });

  it('normalizes a prediction into a render-safe shape', () => {
    expect(
      normalizePredictionResponse({
        userId: 42,
        year: 2027,
        title: 'Твоё предсказание на 2027',
        text: 'Тебя ждёт удачная находка.',
        type: 'fortune',
      }),
    ).toEqual({
      userId: 42,
      year: 2027,
      title: 'Твоё предсказание на 2027',
      text: 'Тебя ждёт удачная находка.',
      type: 'fortune',
    });

    expect(normalizePredictionResponse(null)).toEqual({
      userId: 0,
      year: 0,
      title: '',
      text: '',
      type: 'fortune',
    });
  });
});
