import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { env } from '../config/env.ts';

export const baseApi = createApi({
    reducerPath: 'api',
     baseQuery: fetchBaseQuery({
    baseUrl: env.apiBaseUrl,
  }),

    tagTypes: ['Profiles', 'Recap'],
     endpoints: () => ({}),
});