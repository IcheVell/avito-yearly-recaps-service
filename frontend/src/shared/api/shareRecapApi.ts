import type {
  CreateShareRecapResponse,
  ShareRecap,
} from '../../entities/recap/types';

import { baseApi } from './baseApi';
import {
  normalizeCreateShareRecapResponse,
  normalizeShareRecapResponse,
} from './normalizeShareRecap';

export const shareRecapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createShareRecap: builder.mutation<CreateShareRecapResponse, number>({
      query: (userId) => ({
        url: `/users/${userId}/recap/share`,
        method: 'POST',
      }),
      transformResponse: normalizeCreateShareRecapResponse,
    }),
    getShareRecap: builder.query<ShareRecap, string>({
      query: (token) => `/share/${encodeURIComponent(token)}`,
      transformResponse: normalizeShareRecapResponse,
    }),
  }),
});

export const { useCreateShareRecapMutation, useGetShareRecapQuery } =
  shareRecapApi;
