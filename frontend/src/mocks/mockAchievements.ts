import type {
  Achievement,
  AchievementsResponse,
  EarnedAchievement,
} from '../entities/achievement/types';

const achievementCatalog: Achievement[] = [
  {
    code: 'streak_survivor',
    name: 'Несгибаемый',
    description: 'Длинная серия заходов',
    imageUrl: '',
  },
  {
    code: 'two_faced_market',
    name: 'Две стороны рынка',
    description: 'И покупал, и продавал',
    imageUrl: '',
  },
  {
    code: 'shortlist_hoarder',
    name: 'Коллекционер',
    description: 'Много в избранном',
    imageUrl: '',
  },
  {
    code: 'wallet_whisperer',
    name: 'Шепот кошелька',
    description: 'Много потратил как покупатель',
    imageUrl: '',
  },
  {
    code: 'trust_badge',
    name: 'Знак доверия',
    description: 'Высокий рейтинг',
    imageUrl: '',
  },
  {
    code: 'diplomat',
    name: 'Дипломат',
    description: 'Много собеседников',
    imageUrl: '',
  },
  {
    code: 'plot_twist',
    name: 'Неожиданный поворот',
    description: 'Вернулся после паузы',
    imageUrl: '',
  },
];

const earnedCodesByUserId: Record<number, string[]> = {
  1: ['shortlist_hoarder', 'diplomat'],
  2: ['wallet_whisperer', 'trust_badge'],
  3: ['streak_survivor', 'plot_twist'],
};

export function getMockAchievements(
  userId: number,
): AchievementsResponse {
  const earnedCodes = new Set(
    earnedCodesByUserId[userId] ?? [],
  );

  const earned: EarnedAchievement[] = achievementCatalog
    .filter((achievement) => earnedCodes.has(achievement.code))
    .map((achievement, index) => ({
      ...achievement,
      earnedAt: new Date(
        Date.UTC(2025, 11, 20 - index),
      ).toISOString(),
    }));

  const locked = achievementCatalog.filter(
    (achievement) => !earnedCodes.has(achievement.code),
  );

  return { earned, locked };
}
