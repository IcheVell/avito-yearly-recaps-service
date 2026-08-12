import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AchievementsPanel } from '../../../src/pages/ProfilePage/AchievementsPanel';

describe('AchievementsPanel', () => {
  it('показывает пустые состояния для пустых списков достижений', () => {
    render(
      <AchievementsPanel
        achievements={{
          earned: [],
          locked: [],
          achievements_progress: [],
        }}
        isLoading={false}
        errorMessage={null}
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.getByText('У выбранного профиля пока нет достижений.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Все доступные достижения уже получены.'),
    ).toBeInTheDocument();
  });

  it('показывает неполученное достижение и заглушку изображения', () => {
    render(
      <AchievementsPanel
        achievements={{
          earned: [],
          locked: [
            {
              code: 'locked-achievement',
              name: 'Будущая победа',
              description: 'Это достижение ещё предстоит получить.',
              imageUrl: null,
            },
          ],
          achievements_progress: [],
        }}
        isLoading={false}
        errorMessage={null}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Будущая победа')).toBeInTheDocument();
    expect(screen.getByText('Ещё не получено')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Изображение достижения пока недоступно',
      }),
    ).toBeInTheDocument();
  });

  it('связывает прогресс с достижением по code', () => {
    render(
      <AchievementsPanel
        achievements={{
          earned: [],
          locked: [
            {
              code: 'first',
              name: 'Первое достижение',
              description: 'Первое описание',
              imageUrl: null,
            },
            {
              code: 'second',
              name: 'Второе достижение',
              description: 'Второе описание',
              imageUrl: null,
            },
          ],
          achievements_progress: [
            {
              code: 'second',
              type: 'all',
              is_complete: false,
              progress: 64.4,
              children: [],
            },
            {
              code: 'first',
              type: 'condition',
              is_complete: false,
              progress: 25,
              condition: {
                metric: 'favorites_count',
                operator: '>=',
                current: '1',
                target: '4',
              },
            },
          ],
        }}
        isLoading={false}
        errorMessage={null}
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('progressbar', {
        name: 'Прогресс достижения «Первое достижение»',
      }),
    ).toHaveAttribute('aria-valuenow', '25');
    expect(
      screen.getByRole('progressbar', {
        name: 'Прогресс достижения «Второе достижение»',
      }),
    ).toHaveAttribute('aria-valuenow', '64');
  });
});
