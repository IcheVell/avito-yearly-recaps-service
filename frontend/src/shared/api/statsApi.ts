import type { YearMetrics } from '../../entities/stats/types';

import { baseApi } from './baseApi';

export const statsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStats: builder.query<YearMetrics, number>({
      query: (userId) => `/users/${userId}/stats`,
      providesTags: (_result, _error, userId) => [
        { type: 'Stats', id: userId },
      ],
    }),
  }),
});

export const { useGetStatsQuery } = statsApi;
