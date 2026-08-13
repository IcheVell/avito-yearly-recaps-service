import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';

import type { ShareRecap } from '../entities/recap/types';
import { wait } from '../shared/lib/wait';
import { getMockAchievements } from './mockAchievements';
import { mockProfiles } from './mockProfiles';
import { generateMockRecap, getMockRecap, toShareRecap } from './mockRecap';
import { getMockStats } from './mockStats';

const mockShareStore = new Map<string, ShareRecap>();

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

function findShareToken(url: string): {
  matched: boolean;
  token: string | null;
} {
  const match = /^\/share\/([^/]+)$/.exec(url);
  if (!match) {
    return { matched: false, token: null };
  }

  const token = match[1]?.trim() ?? '';
  return {
    matched: true,
    token: token.length > 0 ? token : null,
  };
}

function getMockShare(token: string): ShareRecap | undefined {
  const storedShare = mockShareStore.get(token);
  if (storedShare) {
    return storedShare;
  }

  const match = /^mock-share-(\d+)$/.exec(token);
  if (!match) {
    return undefined;
  }

  const userId = Number(match[1]);
  const recap = getMockRecap(userId);
  if (!recap) {
    return undefined;
  }

  const share = toShareRecap(recap);
  mockShareStore.set(token, share);
  return share;
}

function delayFor(url: string, method: string): number {
  if (url === '/profiles') {
    return 500;
  }
  if (url === '/recaps/generate' && method === 'POST') {
    return 1_200;
  }
  if (url.endsWith('/recap/share') && method === 'POST') {
    return 500;
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

  const recapShareRoute = findUserId(url, 'recap/share');
  if (recapShareRoute.matched && method === 'POST') {
    if (recapShareRoute.userId === null) {
      return error(
        400,
        'VALIDATION_ERROR',
        'userId must be a positive integer',
        {
          field: 'userId',
        },
      );
    }
    if (!userExists(recapShareRoute.userId)) {
      return error(404, 'USER_NOT_FOUND', 'user not found');
    }

    const recap = getMockRecap(recapShareRoute.userId);
    if (!recap) {
      return error(404, 'RECAP_NOT_FOUND', 'recap not found');
    }

    const token = `mock-share-${recapShareRoute.userId}`;
    mockShareStore.set(token, toShareRecap(recap));
    return { data: { shareUrl: `/share/${token}` } };
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

  const shareRoute = findShareToken(url);
  if (shareRoute.matched && method === 'GET') {
    if (shareRoute.token === null) {
      return error(400, 'VALIDATION_ERROR', 'token is required', {
        field: 'token',
      });
    }

    const share = getMockShare(shareRoute.token);
    return share
      ? { data: share }
      : error(404, 'SHARE_NOT_FOUND', 'share not found');
  }

  return error(404, 'NOT_FOUND', 'mock route not found');
}

export const mockBaseQuery: MockBaseQuery = async (args) => {
  const { url, method } = parseRequest(args);
  await wait(delayFor(url, method));
  return resolveMockRequest(args);
};
