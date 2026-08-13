import type { Achievement } from '../../entities/achievement/types';
import type {
  ActionListingPreview,
  Recap,
  RecapAction,
  RecapActionTarget,
  RecapDebug,
  RecapMetric,
  RecapRole,
} from '../../entities/recap/types';

import {
  isRecord,
  parseArray,
  parseIntegerArray,
  parseStringArray,
  readInteger,
  readNullableNumber,
  readNullableString,
  readString,
} from './runtimeDto';

const actionTypes = [
  'boost_listings',
  'create_listing',
  'listing_abandoned',
  'compare_top',
  'open_favorites',
  'continue_search',
] as const;

type ActionType = (typeof actionTypes)[number];

function isActionType(value: string | null): value is ActionType {
  return value !== null && actionTypes.some((type) => type === value);
}

function parseAchievement(value: unknown): Achievement | null {
  if (!isRecord(value)) return null;
  const code = readString(value, 'code');
  const name = readString(value, 'name');
  const description = readString(value, 'description');
  if (!code || !name || !description) return null;
  return {
    code,
    name,
    description,
    imageUrl: readNullableString(value, 'imageUrl'),
  };
}

function parseRole(value: unknown): RecapRole {
  const dto = isRecord(value) ? value : {};
  return {
    code: readString(dto, 'code') ?? '',
    name: readString(dto, 'name') ?? '',
    title: readString(dto, 'title') ?? '',
    subtitle: readString(dto, 'subtitle') ?? '',
    why: readString(dto, 'why') ?? '',
    activitySharePercent: readInteger(dto, 'activitySharePercent') ?? 0,
  };
}

function parseMetric(value: unknown): RecapMetric | null {
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
    payload: isRecord(value.payload) ? value.payload : {},
  };
}

function parseActionListing(value: unknown): ActionListingPreview | null {
  if (!isRecord(value)) return null;
  const id = readInteger(value, 'id');
  if (id === null) return null;
  return {
    id,
    name: readNullableString(value, 'name'),
    imageUrl: readNullableString(value, 'imageUrl'),
    price: readNullableNumber(value, 'price'),
    city: readNullableString(value, 'city'),
    status: readNullableString(value, 'status'),
    categoryId: readNullableNumber(value, 'categoryId'),
    categoryName: readNullableString(value, 'categoryName'),
    viewsCount: readNullableNumber(value, 'viewsCount'),
    updatedAt: readNullableString(value, 'updatedAt'),
  };
}

function parseActionTarget(value: unknown): RecapActionTarget {
  const dto = isRecord(value) ? value : {};
  const categoryName = readString(dto, 'categoryName');
  return {
    listingIds: parseIntegerArray(dto.listingIds),
    categoryId: readInteger(dto, 'categoryId') ?? 0,
    ...(categoryName === null ? {} : { categoryName }),
    listings: parseArray(dto.listings, parseActionListing),
  };
}

function parseAction(value: unknown): RecapAction {
  const dto = isRecord(value) ? value : {};
  const rawType = readString(dto, 'type');
  const type: ActionType = isActionType(rawType) ? rawType : 'continue_search';
  return {
    type,
    label: readString(dto, 'label') ?? '',
    reason: readString(dto, 'reason') ?? '',
    target: parseActionTarget(dto.target),
  };
}

function parseDebug(value: unknown): RecapDebug | undefined {
  if (!isRecord(value)) return undefined;
  const generatorVersion = readString(value, 'generatorVersion');
  const seedProfile = readString(value, 'seedProfile');
  return generatorVersion === null || seedProfile === null
    ? undefined
    : { generatorVersion, seedProfile };
}

export function normalizeRecapResponse(value: unknown): Recap {
  const dto = isRecord(value) ? value : {};
  const debug = parseDebug(dto.debug);
  return {
    id: readInteger(dto, 'id') ?? 0,
    userId: readInteger(dto, 'userId') ?? 0,
    year: readInteger(dto, 'year') ?? 0,
    createdAt: readString(dto, 'createdAt') ?? '',
    role: parseRole(dto.role),
    metrics: parseArray(dto.metrics, parseMetric),
    achievements: parseArray(dto.achievements, parseAchievement),
    action: parseAction(dto.action),
    ...(debug ? { debug } : {}),
  };
}
