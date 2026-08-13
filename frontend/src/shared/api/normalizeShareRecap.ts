import type {
  CreateShareRecapResponse,
  ShareRecap,
  ShareRecapAchievement,
  ShareRecapMetric,
  ShareRecapRole,
} from '../../entities/recap/types';

import { toRootRelativeUrl } from '../lib/toRootRelativeUrl';
import {
  isRecord,
  parseArray,
  parseStringArray,
  readInteger,
  readNullableString,
  readString,
} from './runtimeDto';

function parseRole(value: unknown): ShareRecapRole {
  const dto = isRecord(value) ? value : {};
  return {
    code: readString(dto, 'code') ?? '',
    name: readString(dto, 'name') ?? '',
    title: readString(dto, 'title') ?? '',
  };
}

function parseMetric(value: unknown): ShareRecapMetric | null {
  if (!isRecord(value)) return null;
  const type = readString(value, 'type');
  const title = readString(value, 'title');
  const text = readString(value, 'text');
  if (!type || title === null || text === null) return null;
  return {
    type,
    title,
    text,
    highlights: parseStringArray(value.highlights),
  };
}

function parseAchievement(value: unknown): ShareRecapAchievement | null {
  if (!isRecord(value)) return null;
  const code = readString(value, 'code');
  const name = readString(value, 'name');
  if (!code || !name) return null;
  return {
    code,
    name,
    imageUrl: toRootRelativeUrl(readNullableString(value, 'imageUrl')),
  };
}

export function normalizeShareRecapResponse(value: unknown): ShareRecap {
  const dto = isRecord(value) ? value : {};
  return {
    year: readInteger(dto, 'year') ?? 0,
    role: parseRole(dto.role),
    metrics: parseArray(dto.metrics, parseMetric),
    achievements: parseArray(dto.achievements, parseAchievement),
  };
}

export function normalizeCreateShareRecapResponse(
  value: unknown,
): CreateShareRecapResponse {
  const dto = isRecord(value) ? value : {};
  return {
    shareUrl: readString(dto, 'shareUrl') ?? '',
  };
}
