import type { Profile, ProfilesResponse } from '../../entities/profile/types';

import {
  isRecord,
  parseArray,
  readInteger,
  readNullableString,
  readString,
} from './runtimeDto';

function parseProfile(value: unknown): Profile | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readInteger(value, 'id');
  const username = readString(value, 'username');
  if (id === null || id <= 0 || !username) {
    return null;
  }

  return {
    id,
    username,
    imageUrl: readNullableString(value, 'imageUrl'),
  };
}

export function normalizeProfilesResponse(value: unknown): ProfilesResponse {
  if (!isRecord(value)) {
    return { currentYear: 0, items: [] };
  }

  return {
    currentYear: readInteger(value, 'currentYear') ?? 0,
    items: parseArray(value.items, parseProfile),
  };
}
