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

export type RecapActionTarget = {
  listingIds: number[];
  categoryId: number;
  categoryName?: string;
  listings: ActionListingPreview[];
};

type RecapActionBase = {
  label: string;
  reason: string;
  target: RecapActionTarget;
};

export type BoostListingsAction = RecapActionBase & {
  type: 'boost_listings';
};

export type CreateListingAction = RecapActionBase & {
  type: 'create_listing';
};

export type ListingAbandonedAction = RecapActionBase & {
  type: 'listing_abandoned';
};

export type CompareTopAction = RecapActionBase & {
  type: 'compare_top';
};

export type OpenFavoritesAction = RecapActionBase & {
  type: 'open_favorites';
};

export type ContinueSearchAction = RecapActionBase & {
  type: 'continue_search';
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
