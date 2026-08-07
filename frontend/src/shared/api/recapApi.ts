import { env } from '../config/env.ts';
import { wait } from '../lib/wait';
import type {  GenerateRecapRequest, Recap} from '../../entities/recap/types';

import { baseApi } from './baseApi';
import {
  getMockRecap,
  getMockRecapById,
} from '../../mocks/mockRecap';

export const recapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateRecap: builder.mutation<Recap, GenerateRecapRequest>({
      async queryFn(request, _api, _extraOptions, fetchWithBQ) {
        if (env.useMocks) {
          await wait(1_200);

          return {
            data: getMockRecap(request.userId),
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

      invalidatesTags: ['Recap'],
    }),

    getRecap: builder.query<Recap, number>({
      async queryFn(recapId, _api, _extraOptions, fetchWithBQ) {
        if (env.useMocks) {
          await wait(400);
          return { data: getMockRecapById(recapId) };
        }

        const result = await fetchWithBQ(`/recaps/${recapId}`);

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data as Recap };
      },

      providesTags: (_result, _error, recapId) => [
        { type: 'Recap', id: recapId },
      ],
    }),
  }),
});

export const {
  useGenerateRecapMutation,
  useGetRecapQuery,
} = recapApi;
