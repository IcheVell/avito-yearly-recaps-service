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
          achievementsProgress: [],
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
          achievementsProgress: [],
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
          achievementsProgress: [
            {
              code: 'second',
              type: 'all',
              isComplete: false,
              progress: 50,
              children: [
                {
                  code: 'second',
                  type: 'condition',
                  isComplete: true,
                  progress: 100,
                  condition: {
                    metric: 'seller_rating',
                    operator: '>=',
                    current: '4.9',
                    target: '4.8',
                  },
                },
                {
                  code: 'second',
                  type: 'condition',
                  isComplete: false,
                  progress: 50,
                  condition: {
                    metric: 'sells_count',
                    operator: '>=',
                    current: '1',
                    target: '2',
                  },
                },
              ],
            },
            {
              code: 'first',
              type: 'condition',
              isComplete: false,
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
    ).toHaveAttribute('aria-valuenow', '50');

    expect(screen.getByText('Условие достижения')).toBeInTheDocument();
    expect(screen.getByText('Избранное')).toBeInTheDocument();
    expect(
      screen.getByText('Сейчас 1 · нужно не меньше 4'),
    ).toBeInTheDocument();

    expect(screen.getByText('Нужно выполнить все условия')).toBeInTheDocument();
    expect(screen.getByText('Рейтинг продавца')).toBeInTheDocument();
    expect(screen.getByText('Продажи')).toBeInTheDocument();
    expect(screen.getByText('Выполнено · 100%')).toBeInTheDocument();
    expect(screen.getByText('В процессе · 50%')).toBeInTheDocument();

    expect(screen.getByText('Первое достижение').closest('li')).toHaveAttribute(
      'tabindex',
      '0',
    );
  });
});
