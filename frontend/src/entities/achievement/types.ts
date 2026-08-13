export type Achievement = {
  code: string;
  name: string;
  description: string;
  imageUrl: string | null;
};

export type EarnedAchievement = Achievement & {
  earnedAt: string;
};

export type AchievementProgressCondition = {
  metric: string;
  operator: string;
  current: string;
  target: string;
};

export type AchievementProgress = {
  code: string;
  type: 'condition' | 'all' | 'any';
  isComplete: boolean;
  progress: number;
  condition?: AchievementProgressCondition;
  children?: AchievementProgress[];
};

export type AchievementsResponse = {
  earned: EarnedAchievement[];
  locked: Achievement[];
  achievementsProgress: AchievementProgress[];
};
