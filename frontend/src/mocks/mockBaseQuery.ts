import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';

import { wait } from '../shared/lib/wait';
import { getMockAchievements } from './mockAchievements';
import { mockProfiles } from './mockProfiles';
import { generateMockRecap, getMockRecap } from './mockRecap';
import { getMockStats } from './mockStats';

type MockBaseQuery = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
>;

type GenerateRecapBody = {
  userId?: unknown;
};

type MockQueryResult =
  | { data: unknown; error?: undefined }
  | { data?: undefined; error: FetchBaseQueryError };

function error(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>,
): { error: FetchBaseQueryError } {
  return {
    error: {
      status,
      data: {
        error: {
          code,
          message,
          ...(details ? { details } : {}),
        },
      },
    },
  };
}

function parseRequest(args: string | FetchArgs): {
  url: string;
  method: string;
  body: unknown;
} {
  if (typeof args === 'string') {
    return { url: args, method: 'GET', body: undefined };
  }

  return {
    url: args.url,
    method: String(args.method ?? 'GET').toUpperCase(),
    body: args.body,
  };
}

function findUserId(
  url: string,
  suffix: string,
): { matched: boolean; userId: number | null } {
  const match = new RegExp(`^/users/([^/]+)/${suffix}$`).exec(url);
  if (!match) {
    return { matched: false, userId: null };
  }

  const rawUserId = match[1];
  const userId = Number(rawUserId);
  return {
    matched: true,
    userId:
      /^\d+$/.test(rawUserId) &&
      Number.isInteger(userId) &&
      userId > 0 &&
      Number.isSafeInteger(userId)
        ? userId
        : null,
  };
}

function userExists(userId: number): boolean {
  return mockProfiles.items.some((profile) => profile.id === userId);
}

function delayFor(url: string, method: string): number {
  if (url === '/profiles') {
    return 500;
  }
  if (url === '/recaps/generate' && method === 'POST') {
    return 1_200;
  }
  return 400;
}

export function resolveMockRequest(args: string | FetchArgs): MockQueryResult {
  const { url, method, body } = parseRequest(args);

  if (url === '/profiles' && method === 'GET') {
    return { data: mockProfiles };
  }

  const statsRoute = findUserId(url, 'stats');
  if (statsRoute.matched && method === 'GET') {
    if (statsRoute.userId === null) {
      return error(
        400,
        'VALIDATION_ERROR',
        'userId must be a positive integer',
        {
          field: 'userId',
        },
      );
    }
    return userExists(statsRoute.userId)
      ? { data: getMockStats(statsRoute.userId) }
      : error(404, 'USER_NOT_FOUND', 'user not found');
  }

  const achievementsRoute = findUserId(url, 'achievements');
  if (achievementsRoute.matched && method === 'GET') {
    if (achievementsRoute.userId === null) {
      return error(
        400,
        'VALIDATION_ERROR',
        'userId must be a positive integer',
        {
          field: 'userId',
        },
      );
    }
    return userExists(achievementsRoute.userId)
      ? { data: getMockAchievements(achievementsRoute.userId) }
      : error(404, 'USER_NOT_FOUND', 'user not found');
  }

  const recapRoute = findUserId(url, 'recap');
  if (recapRoute.matched && method === 'GET') {
    if (recapRoute.userId === null) {
      return error(
        400,
        'VALIDATION_ERROR',
        'userId must be a positive integer',
        {
          field: 'userId',
        },
      );
    }
    const recap = getMockRecap(recapRoute.userId);
    return recap
      ? { data: recap }
      : error(404, 'RECAP_NOT_FOUND', 'recap not found');
  }

  const predictionRoute = findUserId(url, 'prediction');
  if (predictionRoute.matched && method === 'GET') {
    if (predictionRoute.userId === null) {
      return error(
        400,
        'VALIDATION_ERROR',
        'userId must be a positive integer',
        { field: 'userId' },
      );
    }
    if (!userExists(predictionRoute.userId)) {
      return error(404, 'USER_NOT_FOUND', 'user not found');
    }

    const predictionYear = mockProfiles.currentYear + 1;
    return {
      data: {
        userId: predictionRoute.userId,
        year: predictionYear,
        title: `Твоё предсказание на ${predictionYear}`,
        text: 'В следующем году тебя ждёт неожиданно удачная находка. Главное — не пролистать её мимо.',
        type: 'fortune',
      },
    };
  }

  if (url === '/recaps/generate' && method === 'POST') {
    const userId =
      typeof body === 'object' && body !== null
        ? (body as GenerateRecapBody).userId
        : undefined;

    if (
      typeof userId !== 'number' ||
      !Number.isInteger(userId) ||
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      return error(
        400,
        'VALIDATION_ERROR',
        'userId must be a positive integer',
        { field: 'userId' },
      );
    }
    if (!userExists(userId)) {
      return error(404, 'USER_NOT_FOUND', 'user not found');
    }

    return { data: generateMockRecap(userId) };
  }

  return error(404, 'NOT_FOUND', 'mock route not found');
}

export const mockBaseQuery: MockBaseQuery = async (args) => {
  const { url, method } = parseRequest(args);
  await wait(delayFor(url, method));
  return resolveMockRequest(args);
};
