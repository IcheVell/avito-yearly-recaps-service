import type { ProfilesResponse } from '../../entities/profile/types';

import { baseApi } from './baseApi.ts';
import { normalizeProfilesResponse } from './normalizeProfiles';

export const profilesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfiles: builder.query<ProfilesResponse, void>({
      query: () => '/profiles',
      transformResponse: normalizeProfilesResponse,
      providesTags: ['Profiles'],
    }),
  }),
});

export const { useGetProfilesQuery } = profilesApi;
