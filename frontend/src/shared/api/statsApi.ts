import type { YearMetrics } from '../../entities/stats/types';

import { baseApi } from './baseApi';
import { normalizeStatsResponse } from './normalizeStats';

export const statsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStats: builder.query<YearMetrics, number>({
      query: (userId) => `/users/${userId}/stats`,
      transformResponse: normalizeStatsResponse,
      providesTags: (_result, _error, userId) => [
        { type: 'Stats', id: userId },
      ],
    }),
  }),
});

export const { useGetStatsQuery } = statsApi;
