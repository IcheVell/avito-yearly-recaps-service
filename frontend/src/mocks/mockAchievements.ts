import type {
  Achievement,
  EarnedAchievement,
} from '../entities/achievement/types';
import { mockProfiles } from './mockProfiles';

type MockProgressConditionDto = {
  metric: string;
  operator: string;
  current: string;
  target: string;
};

export type MockAchievementProgressDto = {
  code: string;
  type: 'condition' | 'all' | 'any';
  is_complete: boolean;
  progress: number;
  condition?: MockProgressConditionDto;
  children?: MockAchievementProgressDto[];
};

export type MockAchievementsResponseDto = {
  earned: EarnedAchievement[];
  locked: Achievement[];
  achievements_progress: MockAchievementProgressDto[];
};

type ConditionRule = {
  metric: string;
  operator: '>=';
  target: number;
};

type AchievementRule =
  | { type: 'condition'; condition: ConditionRule }
  | { type: 'all'; conditions: ConditionRule[] };

export const mockAchievementCatalog: Achievement[] = [
  {
    code: 'streak_survivor',
    name: 'Несгибаемый',
    description:
      'Были дни, когда Avito тебя не отпускал — серия без пропусков.',
    imageUrl: '/mock-achievements/streak_survivor.png',
  },
  {
    code: 'two_faced_market',
    name: 'Две стороны рынка',
    description:
      'За год ты успел и купить, и продать — побывал по обе стороны сделки.',
    imageUrl: '/mock-achievements/two_faced_market.png',
  },
  {
    code: 'shortlist_boarder',
    name: 'Коллекционер',
    description:
      'Избранное разрослось: ты собирал варианты, прежде чем выбрать.',
    imageUrl: '/mock-achievements/shortlist_boarder.png',
  },
  {
    code: 'wallet_whisperer',
    name: 'Шёпот кошелька',
    description:
      'Покупки года сложились в заметную сумму — любопытство явно не дремало.',
    imageUrl: '/mock-achievements/wallet_whisperer.png',
  },
  {
    code: 'trust_badge',
    name: 'Знак доверия',
    description:
      'Высокий рейтинг продавца: с тобой имеют дело охотно и спокойно.',
    imageUrl: '/mock-achievements/trust_badge.png',
  },
  {
    code: 'diplomat',
    name: 'Дипломат',
    description: 'Кажется ты перепутал Avito с мессенджером.',
    imageUrl: '/mock-achievements/diplomat.png',
  },
  {
    code: 'plot_twist',
    name: 'Неожиданный поворот',
    description:
      'После паузы ты вернулся на площадку — сюжет года сделал виток.',
    imageUrl: '/mock-achievements/plot_twist.png',
  },
];

const achievementRules: Record<string, AchievementRule> = {
  streak_survivor: {
    type: 'condition',
    condition: { metric: 'max_streak_days', operator: '>=', target: 7 },
  },
  two_faced_market: {
    type: 'all',
    conditions: [
      { metric: 'buys_count', operator: '>=', target: 1 },
      { metric: 'sells_count', operator: '>=', target: 1 },
    ],
  },
  shortlist_boarder: {
    type: 'condition',
    condition: { metric: 'favorites_count', operator: '>=', target: 5 },
  },
  wallet_whisperer: {
    type: 'condition',
    condition: { metric: 'spent_amount', operator: '>=', target: 100_000 },
  },
  trust_badge: {
    type: 'all',
    conditions: [
      { metric: 'seller_rating', operator: '>=', target: 4.8 },
      { metric: 'sells_count', operator: '>=', target: 2 },
    ],
  },
  diplomat: {
    type: 'condition',
    condition: { metric: 'conversations_count', operator: '>=', target: 4 },
  },
  plot_twist: {
    type: 'condition',
    condition: {
      metric: 'max_inactive_gap_days',
      operator: '>=',
      target: 90,
    },
  },
};

const earnedCodesByUserId: Record<number, string[]> = {
  1: ['shortlist_boarder', 'diplomat'],
  2: ['wallet_whisperer', 'trust_badge'],
  3: ['streak_survivor', 'plot_twist'],
  4: ['two_faced_market', 'trust_badge', 'diplomat'],
  5: ['shortlist_boarder', 'wallet_whisperer', 'plot_twist'],
  6: ['streak_survivor', 'shortlist_boarder', 'diplomat'],
  7: [
    'streak_survivor',
    'two_faced_market',
    'shortlist_boarder',
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

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function conditionProgress(
  code: string,
  condition: ConditionRule,
  isComplete: boolean,
  seed: number,
): MockAchievementProgressDto {
  const partialPercent = 15 + (seed % 75);
  const current = isComplete
    ? condition.target
    : Number(((condition.target * partialPercent) / 100).toFixed(1));

  return {
    code,
    type: 'condition',
    is_complete: isComplete,
    progress: isComplete ? 100 : (current / condition.target) * 100,
    condition: {
      metric: condition.metric,
      operator: condition.operator,
      current: formatNumber(current),
      target: formatNumber(condition.target),
    },
  };
}

function achievementProgress(
  code: string,
  isComplete: boolean,
  seed: number,
): MockAchievementProgressDto {
  const rule = achievementRules[code];

  if (rule.type === 'condition') {
    return conditionProgress(code, rule.condition, isComplete, seed);
  }

  const children = rule.conditions.map((condition, index) =>
    conditionProgress(
      code,
      condition,
      isComplete || index === 0,
      seed + index * 19,
    ),
  );
  const completedChildren = children.filter(
    (child) => child.is_complete,
  ).length;

  return {
    code,
    type: 'all',
    is_complete: isComplete,
    progress: (completedChildren / children.length) * 100,
    children,
  };
}

export function getMockAchievements(
  userId: number,
): MockAchievementsResponseDto {
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
    (achievement, index) =>
      achievementProgress(
        achievement.code,
        earnedCodes.has(achievement.code),
        userId * 17 + index * 13,
      ),
  );

  return { earned, locked, achievements_progress };
}
