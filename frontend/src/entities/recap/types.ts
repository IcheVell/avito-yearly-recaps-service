import type { Achievement } from '../achievement/types';

export type RecapRole = {
  code: string;
  name: string;
  title: string;
  subtitle: string;
  why: string;
  activitySharePercent: number;
};

export type MetricPayload = Record<string, unknown>;

export type RecapMetric = {
  type: string;
  title: string;
  text: string;
  highlights: string[];
  payload: MetricPayload;
};

type RecapActionBase = {
  label: string;
  reason: string;
};

export type ActionListingPreview = {
  id: number;
  name?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  city?: string | null;
  status?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  viewsCount?: number | null;
  updatedAt?: string | null;
};

export type BoostListingsAction = RecapActionBase & {
  type: 'boost_listings';
  target: {
    listingIds: number[];
    categoryId?: number;
    categoryName?: string;
    listings?: ActionListingPreview[];
  };
};

export type CreateListingAction = RecapActionBase & {
  type: 'create_listing';
  target: Record<string, never>;
};

export type ListingAbandonedAction = RecapActionBase & {
  type: 'listing_abandoned';
  target: {
    listingIds: number[];
    categoryId: number;
    categoryName?: string;
    listings?: ActionListingPreview[];
  };
};

export type CompareTopAction = RecapActionBase & {
  type: 'compare_top';
  target: {
    listingIds: number[];
    categoryId: number;
    categoryName?: string;
    listings?: ActionListingPreview[];
  };
};

export type OpenFavoritesAction = RecapActionBase & {
  type: 'open_favorites';
  target: {
    listingIds?: number[];
    categoryId?: number;
    categoryName?: string;
    listings?: ActionListingPreview[];
  };
};

export type ContinueSearchAction = RecapActionBase & {
  type: 'continue_search';
  target: {
    listingIds?: number[];
    categoryId?: number;
    categoryName?: string;
  };
};

export type RecapAction =
  | BoostListingsAction
  | CreateListingAction
  | ListingAbandonedAction
  | CompareTopAction
  | OpenFavoritesAction
  | ContinueSearchAction;

export type RecapDebug = {
  generatorVersion: string;
  seedProfile: string;
};

export type Recap = {
  id: number;
  userId: number;
  year: number;
  createdAt: string;
  role: RecapRole;
  metrics: RecapMetric[];
  achievements: Achievement[];
  action: RecapAction;
  debug?: RecapDebug;
};

export type GenerateRecapRequest = {
  userId: number;
};
