import { describe, expect, it } from 'vitest';

import { normalizeAchievementsResponse } from '../../../src/shared/api/normalizeAchievements';

describe('normalizeAchievementsResponse', () => {
  it('проверяет DTO и переводит snake_case в UI-модель', () => {
    expect(
      normalizeAchievementsResponse({
        earned: [
          {
            code: 'earned',
            name: 'Получено',
            description: 'Описание',
            earnedAt: '2026-01-01T00:00:00Z',
            imageUrl: '/earned.png',
          },
        ],
        locked: [
          {
            code: 'locked',
            name: 'Закрыто',
            description: 'Описание',
            imageUrl: null,
          },
        ],
        achievements_progress: [
          {
            code: 'locked',
            type: 'all',
            is_complete: false,
            progress: 50,
            children: [
              {
                code: 'locked',
                type: 'condition',
                is_complete: true,
                progress: 100,
                condition: {
                  metric: 'sells_count',
                  operator: '>=',
                  current: '2',
                  target: '2',
                },
              },
            ],
          },
        ],
      }),
    ).toEqual({
      earned: [
        {
          code: 'earned',
          name: 'Получено',
          description: 'Описание',
          earnedAt: '2026-01-01T00:00:00Z',
          imageUrl: '/earned.png',
        },
      ],
      locked: [
        {
          code: 'locked',
          name: 'Закрыто',
          description: 'Описание',
          imageUrl: null,
        },
      ],
      achievementsProgress: [
        {
          code: 'locked',
          type: 'all',
          isComplete: false,
          progress: 50,
          condition: undefined,
          children: [
            {
              code: 'locked',
              type: 'condition',
              isComplete: true,
              progress: 100,
              condition: {
                metric: 'sells_count',
                operator: '>=',
                current: '2',
                target: '2',
              },
              children: undefined,
            },
          ],
        },
      ],
    });
  });

  it('безопасно отбрасывает невалидные элементы', () => {
    expect(
      normalizeAchievementsResponse({
        earned: [null, { code: 'broken' }],
        locked: 'not-an-array',
        achievements_progress: [{ code: 'broken', progress: '50' }],
      }),
    ).toEqual({
      earned: [],
      locked: [],
      achievementsProgress: [],
    });
  });
});
