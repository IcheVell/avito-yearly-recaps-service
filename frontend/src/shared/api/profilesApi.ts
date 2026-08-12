import type { ProfilesResponse } from '../../entities/profile/types';

import { baseApi } from './baseApi.ts';

export const profilesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfiles: builder.query<ProfilesResponse, void>({
      query: () => '/profiles',
      providesTags: ['Profiles'],
    }),
  }),
});

export const { useGetProfilesQuery } = profilesApi;
