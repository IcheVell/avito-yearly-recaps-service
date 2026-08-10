import type { YearMetrics } from '../../entities/stats/types';
import { getMockStats } from '../../mocks/mockStats';
import { env } from '../config/env';
import { wait } from '../lib/wait';

import { baseApi } from './baseApi';

export const statsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStats: builder.query<YearMetrics, number>({
      async queryFn(userId, _api, _extraOptions, fetchWithBQ) {
        if (env.useMocks) {
          await wait(400);
          return { data: getMockStats(userId) };
        }

        const result = await fetchWithBQ(`/users/${userId}/stats`);

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data as YearMetrics };
      },

      providesTags: (_result, _error, userId) => [
        { type: 'Stats', id: userId },
      ],
    }),
  }),
});

export const { useGetStatsQuery } = statsApi;
