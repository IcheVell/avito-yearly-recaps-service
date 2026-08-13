import type {
  CategorySearches,
  CategoryViews,
  ListingViewCount,
  OwnListing,
  StatsCategory,
  StatsFavorite,
  StatsListing,
  StatsReview,
  YearMetrics,
} from '../../entities/stats/types';

import {
  isRecord,
  parseArray,
  parseIntegerArray,
  readInteger,
  readNullableNumber,
  readNullableString,
  readString,
} from './runtimeDto';

function parseCategory(value: unknown): StatsCategory | null {
  if (!isRecord(value)) return null;
  const id = readInteger(value, 'id');
  const name = readString(value, 'name');
  return id === null || !name ? null : { id, name };
}

function parseListing(value: unknown): StatsListing | null {
  if (!isRecord(value)) return null;
  const id = readInteger(value, 'id');
  const name = readString(value, 'name');
  const city = readString(value, 'city');
  const viewsCount = readInteger(value, 'viewsCount');
  if (id === null || !name || city === null || viewsCount === null) return null;
  return {
    id,
    name,
    city,
    imageUrl: readNullableString(value, 'imageUrl'),
    viewsCount,
  };
}

function parseReview(value: unknown): StatsReview | null {
  if (!isRecord(value)) return null;
  const id = readInteger(value, 'id');
  const rating = readInteger(value, 'rating');
  const text = readString(value, 'text');
  return id === null || rating === null || text === null
    ? null
    : { id, rating, text };
}

function parseCategoryViews(value: unknown): CategoryViews | null {
  if (!isRecord(value)) return null;
  const categoryId = readInteger(value, 'categoryId');
  const categoryName = readString(value, 'categoryName');
  const views = readInteger(value, 'views');
  return categoryId === null || !categoryName || views === null
    ? null
    : { categoryId, categoryName, views };
}

function parseCategorySearches(value: unknown): CategorySearches | null {
  if (!isRecord(value)) return null;
  const categoryId = readInteger(value, 'categoryId');
  const categoryName = readString(value, 'categoryName');
  const searches = readInteger(value, 'searches');
  return categoryId === null || !categoryName || searches === null
    ? null
    : { categoryId, categoryName, searches };
}

function parseFavorite(value: unknown): StatsFavorite | null {
  if (!isRecord(value)) return null;
  const listingId = readInteger(value, 'listingId');
  const categoryId = readInteger(value, 'categoryId');
  return listingId === null || categoryId === null
    ? null
    : { listingId, categoryId };
}

function parseListingViewCount(value: unknown): ListingViewCount | null {
  if (!isRecord(value)) return null;
  const listingId = readInteger(value, 'listingId');
  const categoryId = readInteger(value, 'categoryId');
  const views = readInteger(value, 'views');
  return listingId === null || categoryId === null || views === null
    ? null
    : { listingId, categoryId, views };
}

function parseOwnListing(value: unknown): OwnListing | null {
  if (!isRecord(value)) return null;
  const id = readInteger(value, 'id');
  const categoryId = readInteger(value, 'categoryId');
  const status = readString(value, 'status');
  const updatedAt = readString(value, 'updatedAt');
  const viewsCount = readInteger(value, 'viewsCount');
  return id === null ||
    categoryId === null ||
    !status ||
    !updatedAt ||
    viewsCount === null
    ? null
    : { id, categoryId, status, updatedAt, viewsCount };
}

function parseNullable<T>(
  value: unknown,
  parser: (item: unknown) => T | null,
): T | null {
  return value === null ? null : parser(value);
}

export function normalizeStatsResponse(value: unknown): YearMetrics {
  const dto = isRecord(value) ? value : {};

  return {
    userId: readInteger(dto, 'userId') ?? 0,
    registrationDate: readString(dto, 'registrationDate') ?? '',
    viewsCount: readInteger(dto, 'viewsCount') ?? 0,
    searchesCount: readInteger(dto, 'searchesCount') ?? 0,
    favoritesCount: readInteger(dto, 'favoritesCount') ?? 0,
    messagesPeopleCount: readInteger(dto, 'messagesPeopleCount') ?? 0,
    listingsCreatedCount: readInteger(dto, 'listingsCreatedCount') ?? 0,
    buysCount: readInteger(dto, 'buysCount') ?? 0,
    sellsCount: readInteger(dto, 'sellsCount') ?? 0,
    spentAmount: readNullableNumber(dto, 'spentAmount'),
    earnedAmount: readNullableNumber(dto, 'earnedAmount'),
    maxStreakDays: readInteger(dto, 'maxStreakDays') ?? 0,
    activeDays: readInteger(dto, 'activeDays') ?? 0,
    yearsOnAvito: readInteger(dto, 'yearsOnAvito') ?? 0,
    priceMin: readNullableNumber(dto, 'priceMin'),
    priceMax: readNullableNumber(dto, 'priceMax'),
    sellerRating: readNullableNumber(dto, 'sellerRating'),
    favoriteBuyCategory: parseNullable(dto.favoriteBuyCategory, parseCategory),
    favoriteSellCategory: parseNullable(
      dto.favoriteSellCategory,
      parseCategory,
    ),
    mostViewedListing: parseNullable(dto.mostViewedListing, parseListing),
    bestReviewReceived: parseNullable(dto.bestReviewReceived, parseReview),
    bestReviewLeft: parseNullable(dto.bestReviewLeft, parseReview),
    viewsByCategory: parseArray(dto.viewsByCategory, parseCategoryViews),
    searchesByCategory: parseArray(
      dto.searchesByCategory,
      parseCategorySearches,
    ),
    favorites: parseArray(dto.favorites, parseFavorite),
    listingViewCounts: parseArray(dto.listingViewCounts, parseListingViewCount),
    messagedListingIds: parseIntegerArray(dto.messagedListingIds),
    ownListings: parseArray(dto.ownListings, parseOwnListing),
  };
}
