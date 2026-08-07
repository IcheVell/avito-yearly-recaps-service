import { env } from '../config/env.ts';
import { wait } from '../lib/wait';
import type { GenerateRecapRequest, Recap } from '../../entities/recap/types';

import { baseApi } from './baseApi';
import {
  generateMockRecap,
  getMockRecap,
} from '../../mocks/mockRecap';

export const recapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateRecap: builder.mutation<Recap, GenerateRecapRequest>({
      async queryFn(request, _api, _extraOptions, fetchWithBQ) {
        if (env.useMocks) {
          await wait(1_200);

          return {
            data: generateMockRecap(request.userId),
          };
        }

        const result = await fetchWithBQ({
          url: '/recaps/generate',
          method: 'POST',
          body: request,
        });

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data as Recap };
      },

      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'Recap', id: userId },
      ],
    }),

    getRecap: builder.query<Recap, number>({
      async queryFn(userId, _api, _extraOptions, fetchWithBQ) {
        if (env.useMocks) {
          await wait(400);
          const recap = getMockRecap(userId);

          if (!recap) {
            return {
              error: {
                status: 404,
                data: {
                  error: {
                    code: 'NOT_FOUND',
                    message: 'Итоги пользователя ещё не сгенерированы.',
                    details: {
                      field: 'userId',
                    },
                  },
                },
              },
            };
          }

          return { data: recap };
        }

        const result = await fetchWithBQ(`/users/${userId}/recap`);

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data as Recap };
      },

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
