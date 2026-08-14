import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

import { mockBaseQuery } from '../../mocks/mockBaseQuery';
import { env } from '../config/env.ts';

const httpBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
});

const appBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = (args, api, extraOptions) =>
  env.useMocks
    ? mockBaseQuery(args, api, extraOptions)
    : httpBaseQuery(args, api, extraOptions);

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: appBaseQuery,

  tagTypes: ['Profiles', 'Recap', 'Achievements', 'Stats', 'Prediction'],
  endpoints: () => ({}),
});
