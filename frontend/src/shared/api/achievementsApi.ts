import type { AchievementsResponse } from '../../entities/achievement/types';

import { baseApi } from './baseApi';
import { normalizeAchievementsResponse } from './normalizeAchievements';

export const achievementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAchievements: builder.query<AchievementsResponse, number>({
      query: (userId) => `/users/${userId}/achievements`,
      transformResponse: normalizeAchievementsResponse,
      providesTags: (_result, _error, userId) => [
        { type: 'Achievements', id: userId },
      ],
    }),
  }),
});

export const { useGetAchievementsQuery } = achievementsApi;
