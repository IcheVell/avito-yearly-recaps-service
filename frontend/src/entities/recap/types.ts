export type RecapRole = {
  code: string; //напомнить алине сделать универсальную роль!!!
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

export type Achievement = {
  code: string;
  name: string;
  description: string;
};

type RecapActionBase = {
  label: string;
  reason: string;
};

export type BoostListingsAction = RecapActionBase & {
  type: 'boost_listings';
  target: {
    listingIds: number[];
    categoryId?: number;
  };
};

export type ViewFavoritesAction = RecapActionBase & {
  type: 'view_favorites';
  target: {
    listingIds?: number[];
    categoryId?: number;
  };
};

export type OpenRecommendationsAction = RecapActionBase & {
  type: 'open_recommendations';
  target: {
    categoryId: number;
  };
};

export type RecapAction =
  | BoostListingsAction
  | ViewFavoritesAction
  | OpenRecommendationsAction;

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
  year: number;
};
