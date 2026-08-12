import type {
  Achievement,
  AchievementProgress,
  AchievementProgressCondition,
  AchievementsResponse,
  EarnedAchievement,
} from '../../entities/achievement/types';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: UnknownRecord, key: string): string | null {
  return typeof record[key] === 'string' ? record[key] : null;
}

function readImageUrl(record: UnknownRecord): string | null {
  const imageUrl = record.imageUrl;
  return typeof imageUrl === 'string' ? imageUrl : null;
}

function parseAchievement(value: unknown): Achievement | null {
  if (!isRecord(value)) {
    return null;
  }

  const code = readString(value, 'code');
  const name = readString(value, 'name');
  const description = readString(value, 'description');

  if (!code || !name || !description) {
    return null;
  }

  return {
    code,
    name,
    description,
    imageUrl: readImageUrl(value),
  };
}

function parseEarnedAchievement(value: unknown): EarnedAchievement | null {
  const achievement = parseAchievement(value);
  if (!achievement || !isRecord(value)) {
    return null;
  }

  const earnedAt = readString(value, 'earnedAt');
  if (!earnedAt) {
    return null;
  }

  return { ...achievement, earnedAt };
}

function parseCondition(
  value: unknown,
): AchievementProgressCondition | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const metric = readString(value, 'metric');
  const operator = readString(value, 'operator');
  const current = readString(value, 'current');
  const target = readString(value, 'target');

  if (!metric || !operator || current === null || target === null) {
    return undefined;
  }

  return { metric, operator, current, target };
}

function parseProgress(value: unknown): AchievementProgress | null {
  if (!isRecord(value)) {
    return null;
  }

  const code = readString(value, 'code');
  const type = readString(value, 'type');
  const isComplete = value.is_complete;
  const progress = value.progress;

  if (
    !code ||
    (type !== 'condition' && type !== 'all' && type !== 'any') ||
    typeof isComplete !== 'boolean' ||
    typeof progress !== 'number' ||
    !Number.isFinite(progress)
  ) {
    return null;
  }

  const children = Array.isArray(value.children)
    ? value.children
        .map(parseProgress)
        .filter((child): child is AchievementProgress => child !== null)
    : undefined;

  return {
    code,
    type,
    isComplete,
    progress,
    condition: parseCondition(value.condition),
    children,
  };
}

function parseArray<T>(
  value: unknown,
  parser: (item: unknown) => T | null,
): T[] {
  return Array.isArray(value)
    ? value.map(parser).filter((item): item is T => item !== null)
    : [];
}

export function normalizeAchievementsResponse(
  value: unknown,
): AchievementsResponse {
  if (!isRecord(value)) {
    return {
      earned: [],
      locked: [],
      achievementsProgress: [],
    };
  }

  return {
    earned: parseArray(value.earned, parseEarnedAchievement),
    locked: parseArray(value.locked, parseAchievement),
    achievementsProgress: parseArray(
      value.achievements_progress,
      parseProgress,
    ),
  };
}
