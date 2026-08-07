import type { ProfilesResponse } from '../../entities/profile/types';
import { mockProfiles } from '../../mocks/mockProfiles';
import { env } from '../config/env.ts';
import { wait } from '../lib/wait';

import { baseApi } from './baseApi.ts';

export const profilesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfiles: builder.query<ProfilesResponse, void>({
      async queryFn(_argument, _api, _extraOptions, fetchWithBQ) {
        if (env.useMocks) {
          await wait(500);
          return { data: mockProfiles };
        }

        const result = await fetchWithBQ('/profiles');

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data as ProfilesResponse };
      },

      providesTags: ['Profiles'],
    }),
  }),
});

export const { useGetProfilesQuery } = profilesApi;
