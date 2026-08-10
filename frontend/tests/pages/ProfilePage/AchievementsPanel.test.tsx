import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AchievementsPanel } from '../../../src/pages/ProfilePage/AchievementsPanel';

describe('AchievementsPanel', () => {
  it('показывает пустые состояния для пустых списков достижений', () => {
    render(
      <AchievementsPanel
        achievements={{ earned: [], locked: [] }}
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
});
