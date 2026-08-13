import type { Prediction } from '../../entities/prediction/types';

import { baseApi } from './baseApi';
import { normalizePredictionResponse } from './normalizePrediction';

export const predictionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPrediction: builder.query<Prediction, number>({
      query: (userId) => `/users/${userId}/prediction`,
      transformResponse: normalizePredictionResponse,
      providesTags: (_result, _error, userId) => [
        { type: 'Prediction', id: userId },
      ],
    }),
  }),
});

export const { useLazyGetPredictionQuery } = predictionApi;
