export type Achievement = {
  code: string;
  name: string;
  description: string;
  imageUrl: string | null;
};

export type EarnedAchievement = Achievement & {
  earnedAt: string;
};

export type AchievementsResponse = {
  earned: EarnedAchievement[];
  locked: Achievement[];
};
