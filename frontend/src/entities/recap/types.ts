export type RecapRole = {
  code: string; //напомнить алине сделать универсальную роль!!!
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

export type RecapActionTarget = {
  listingIds?: number[];
  categoryId?: number;
};

export type RecapAction = {
  type: string;
  label: string;
  reason: string;
  target: RecapActionTarget;
};

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