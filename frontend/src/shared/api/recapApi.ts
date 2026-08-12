import type { GenerateRecapRequest, Recap } from '../../entities/recap/types';

import { baseApi } from './baseApi';

export const recapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateRecap: builder.mutation<Recap, GenerateRecapRequest>({
      query: (request) => ({
        url: '/recaps/generate',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: (_result, error, { userId }) =>
        error
          ? []
          : [
              { type: 'Recap', id: userId },
              { type: 'Achievements', id: userId },
            ],
    }),

    getRecap: builder.query<Recap, number>({
      query: (userId) => `/users/${userId}/recap`,
      providesTags: (_result, _error, userId) => [
        { type: 'Recap', id: userId },
      ],
    }),
  }),
});

export const {
  useGenerateRecapMutation,
  useGetRecapQuery,
  useLazyGetRecapQuery,
} = recapApi;
