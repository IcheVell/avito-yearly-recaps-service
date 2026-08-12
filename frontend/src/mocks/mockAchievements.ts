import type {
  Achievement,
  AchievementsResponse,
  EarnedAchievement,
} from '../entities/achievement/types';
import { mockProfiles } from './mockProfiles';

export const mockAchievementCatalog: Achievement[] = [
  {
    code: 'streak_survivor',
    name: 'Несгибаемый',
    description: 'Длинная серия заходов',
    imageUrl: '/mock-achievements/streak_survivor.png',
  },
  {
    code: 'two_faced_market',
    name: 'Две стороны рынка',
    description: 'И покупал, и продавал',
    imageUrl: '/mock-achievements/two_faced_market.png',
  },
  {
    code: 'shortlist_hoarder',
    name: 'Коллекционер',
    description: 'Много в избранном',
    imageUrl: '/mock-achievements/shortlist_boarder.png',
  },
  {
    code: 'wallet_whisperer',
    name: 'Шепот кошелька',
    description: 'Много потратил как покупатель',
    imageUrl: '/mock-achievements/wallet_whisperer.png',
  },
  {
    code: 'trust_badge',
    name: 'Знак доверия',
    description: 'Высокий рейтинг',
    imageUrl: '/mock-achievements/trust_badge.png',
  },
  {
    code: 'diplomat',
    name: 'Дипломат',
    description: 'Много собеседников',
    imageUrl: '/mock-achievements/diplomat.png',
  },
  {
    code: 'plot_twist',
    name: 'Неожиданный поворот',
    description: 'Вернулся после паузы',
    imageUrl: '/mock-achievements/plot_twist.png',
  },
];

const earnedCodesByUserId: Record<number, string[]> = {
  1: ['shortlist_hoarder', 'diplomat'],
  2: ['wallet_whisperer', 'trust_badge'],
  3: ['streak_survivor', 'plot_twist'],
  4: ['two_faced_market', 'trust_badge', 'diplomat'],
  5: ['shortlist_hoarder', 'wallet_whisperer', 'plot_twist'],
  6: ['streak_survivor', 'shortlist_hoarder', 'diplomat'],
  7: [
    'streak_survivor',
    'two_faced_market',
    'shortlist_hoarder',
    'wallet_whisperer',
    'trust_badge',
    'diplomat',
    'plot_twist',
  ],
  8: ['two_faced_market', 'wallet_whisperer'],
  9: ['plot_twist', 'diplomat', 'streak_survivor', 'trust_badge'],
};

const allAchievementsUserId = 7;

function getMockEarnedAt(userId: number, index: number): string {
  if (userId === allAchievementsUserId) {
    return new Date(
      Date.UTC(mockProfiles.currentYear, 6 - index, 13 - index),
    ).toISOString();
  }

  return new Date(
    Date.UTC(mockProfiles.currentYear - 1, 11, 20 - index),
  ).toISOString();
}

export function getMockAchievements(userId: number): AchievementsResponse {
  const earnedCodes = new Set(earnedCodesByUserId[userId] ?? []);

  const earned: EarnedAchievement[] = mockAchievementCatalog
    .filter((achievement) => earnedCodes.has(achievement.code))
    .map((achievement, index) => ({
      ...achievement,
      earnedAt: getMockEarnedAt(userId, index),
    }));

  const locked = mockAchievementCatalog.filter(
    (achievement) => !earnedCodes.has(achievement.code),
  );

  const achievements_progress = mockAchievementCatalog.map(
    (achievement, index) => {
      const isComplete = earnedCodes.has(achievement.code);
      const progress = isComplete
        ? 100
        : Math.min(95, 10 + ((userId * 17 + index * 13) % 85));

      return {
        code: achievement.code,
        type: 'condition' as const,
        is_complete: isComplete,
        progress,
        condition: {
          metric: 'mock_activity',
          operator: '>=',
          current: String(progress),
          target: '100',
        },
      };
    },
  );

  return { earned, locked, achievements_progress };
}
