import type { AchievementsResponse } from '../../entities/achievement/types';
import { getMockAchievements } from '../../mocks/mockAchievements';
import { env } from '../config/env';
import { wait } from '../lib/wait';

import { baseApi } from './baseApi';

export const achievementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAchievements: builder.query<AchievementsResponse, number>({
      async queryFn(userId, _api, _extraOptions, fetchWithBQ) {
        if (env.useMocks) {
          await wait(400);
          return { data: getMockAchievements(userId) };
        }

        const result = await fetchWithBQ(`/users/${userId}/achievements`);

        if (result.error) {
          return { error: result.error };
        }

        return {
          data: result.data as AchievementsResponse,
        };
      },

      providesTags: (_result, _error, userId) => [
        { type: 'Achievements', id: userId },
      ],
    }),
  }),
});

export const { useGetAchievementsQuery } = achievementsApi;
