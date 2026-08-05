import type { ProfilesResponse } from '../../entities/profile/types';
import { mockProfiles } from '../../mocks/mockProfiles';
import { env } from '../config/env.ts';

import { baseApi } from './baseApi.ts';

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

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
