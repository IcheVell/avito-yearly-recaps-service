import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/shared/config/env', () => ({
  env: { apiBaseUrl: '/api', useMocks: true },
}));

import type { Recap, ShareRecap } from '../../../src/entities/recap/types';
import { resolveMockRequest } from '../../../src/mocks/mockBaseQuery';
import type { MockAchievementsResponseDto } from '../../../src/mocks/mockAchievements';
import { achievementsApi } from '../../../src/shared/api/achievementsApi';
import { baseApi } from '../../../src/shared/api/baseApi';
import { normalizeAchievementsResponse } from '../../../src/shared/api/normalizeAchievements';
import { profilesApi } from '../../../src/shared/api/profilesApi';
import { predictionApi } from '../../../src/shared/api/predictionApi';
import { recapApi } from '../../../src/shared/api/recapApi';
import { statsApi } from '../../../src/shared/api/statsApi';

function readData<T>(result: ReturnType<typeof resolveMockRequest>): T {
  if ('error' in result && result.error) {
    throw new Error(`Unexpected mock error: ${result.error.status}`);
  }

  return result.data as T;
}

describe('mockBaseQuery contract', () => {
  it('runs all responses through RTK Query API-boundary transforms', async () => {
    const store = configureStore({
      reducer: { [baseApi.reducerPath]: baseApi.reducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });

    const [profiles, stats, achievements, recap, prediction] =
      await Promise.all([
        store.dispatch(profilesApi.endpoints.getProfiles.initiate()),
        store.dispatch(statsApi.endpoints.getStats.initiate(1)),
        store.dispatch(achievementsApi.endpoints.getAchievements.initiate(1)),
        store.dispatch(recapApi.endpoints.getRecap.initiate(1)),
        store.dispatch(predictionApi.endpoints.getPrediction.initiate(1)),
      ]);

    expect(profiles.data?.items).toHaveLength(9);
    expect(stats.data).toMatchObject({ userId: 1, viewsCount: 467 });
    expect(achievements.data?.achievementsProgress).toHaveLength(7);
    expect(achievements.data?.achievementsProgress[0]).toHaveProperty(
      'isComplete',
    );
    expect(achievements.data).not.toHaveProperty('achievements_progress');
    expect(recap.data?.action.target.listings[0]).toHaveProperty('price', null);
    expect(prediction.data).toMatchObject({
      userId: 1,
      year: 2027,
      type: 'fortune',
    });
    store.dispatch(baseApi.util.resetApiState());
  });

  it('returns achievements in the backend DTO and normalizes them at API boundary', () => {
    const dto = readData<MockAchievementsResponseDto>(
      resolveMockRequest('/users/1/achievements'),
    );

    expect(dto).toHaveProperty('achievements_progress');
    expect(dto).not.toHaveProperty('achievementsProgress');
    expect(dto.earned.map(({ code }) => code)).toContain('shortlist_boarder');
    expect(dto.earned.map(({ code }) => code)).not.toContain(
      'shortlist_hoarder',
    );

    const allProgress = dto.achievements_progress.find(
      ({ code }) => code === 'trust_badge',
    );
    expect(allProgress).toMatchObject({
      code: 'trust_badge',
      type: 'all',
      is_complete: false,
      progress: 50,
    });
    expect(
      allProgress?.children?.map(({ condition }) => condition?.metric),
    ).toEqual(['seller_rating', 'sells_count']);

    const normalized = normalizeAchievementsResponse(dto);
    expect(normalized.achievementsProgress).toHaveLength(7);
    expect(normalized.achievementsProgress[0]).toHaveProperty('isComplete');
    expect(normalized.achievementsProgress[0]).not.toHaveProperty(
      'is_complete',
    );
  });

  it('returns complete achievements and their conditions with 100 percent', () => {
    const dto = readData<MockAchievementsResponseDto>(
      resolveMockRequest('/users/7/achievements'),
    );

    expect(dto.earned).toHaveLength(7);
    for (const progress of dto.achievements_progress) {
      expect(progress.is_complete).toBe(true);
      expect(progress.progress).toBe(100);
      for (const child of progress.children ?? []) {
        expect(child.is_complete).toBe(true);
        expect(child.progress).toBe(100);
      }
    }
  });

  it('keeps recap target fields required by the backend response', () => {
    const recap = readData<Recap>(resolveMockRequest('/users/1/recap'));

    expect(recap.action.target).toMatchObject({
      listingIds: [11],
      categoryId: 3,
    });
    expect(recap.action.target.listings[0]).toHaveProperty('price', null);
  });

  it('uses backend-compatible validation and not-found errors', () => {
    expect(resolveMockRequest('/users/0/stats')).toEqual({
      error: {
        status: 400,
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userId must be a positive integer',
            details: { field: 'userId' },
          },
        },
      },
    });

    expect(resolveMockRequest('/users/999/achievements')).toMatchObject({
      error: {
        status: 404,
        data: { error: { code: 'USER_NOT_FOUND' } },
      },
    });
  });

  it('creates and returns a share recap by token', () => {
    expect(
      resolveMockRequest({
        url: '/users/1/recap/share',
        method: 'POST',
      }),
    ).toEqual({
      data: { shareUrl: '/share/mock-share-1' },
    });

    const share = readData<ShareRecap>(
      resolveMockRequest('/share/mock-share-1'),
    );

    expect(share.year).toBeGreaterThan(0);
    expect(share.role.name).toBeTruthy();
    expect(share).not.toHaveProperty('action');
    expect(share).not.toHaveProperty('userId');
  });

  it('restores a deterministic mock share after an application reload', () => {
    const share = readData<ShareRecap>(
      resolveMockRequest('/share/mock-share-2'),
    );

    expect(share.year).toBeGreaterThan(0);
    expect(share.role.name).toBeTruthy();
    expect(share).not.toHaveProperty('action');
    expect(share).not.toHaveProperty('userId');
  });
});
