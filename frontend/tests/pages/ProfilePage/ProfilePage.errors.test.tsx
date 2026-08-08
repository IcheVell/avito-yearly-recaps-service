import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAchievements,
  createJsonResponse,
  createStats,
  getPath,
  getRequest,
  profiles,
  renderProfilePage,
} from './testUtils';

vi.mock('../../../src/shared/config/env.ts', () => ({
  env: {
    apiBaseUrl: 'http://localhost/api',
    useMocks: false,
  },
}));

const serverError = {
  error: {
    code: 'SERVICE_UNAVAILABLE',
  },
};

describe('ошибки загрузки страницы профиля', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('повторно загружает список профилей после ошибки', async () => {
    let profilesAttempts = 0;
    const fetchMock = vi.fn().mockImplementation(
      (input: RequestInfo | URL) => {
        const path = getPath(getRequest(input));

        if (path === '/api/profiles') {
          profilesAttempts += 1;

          return Promise.resolve(
            profilesAttempts === 1
              ? createJsonResponse(serverError, 503)
              : createJsonResponse(profiles),
          );
        }
        if (path === '/api/users/1/stats') {
          return Promise.resolve(
            createJsonResponse(
              createStats(1, 'Статистика после повтора'),
            ),
          );
        }

        throw new Error(`Неожиданный запрос: ${path}`);
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderProfilePage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Сервис временно недоступен.',
    );

    await user.click(
      screen.getByRole('button', { name: 'Попробовать снова' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Альфа' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Статистика после повтора'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(profilesAttempts).toBe(2);
  });

  it('повторно загружает статистику после ошибки', async () => {
    let statsAttempts = 0;
    const fetchMock = vi.fn().mockImplementation(
      (input: RequestInfo | URL) => {
        const path = getPath(getRequest(input));

        if (path === '/api/profiles') {
          return Promise.resolve(createJsonResponse(profiles));
        }
        if (path === '/api/users/1/stats') {
          statsAttempts += 1;

          return Promise.resolve(
            statsAttempts === 1
              ? createJsonResponse(serverError, 503)
              : createJsonResponse(
                  createStats(1, 'Статистика восстановлена'),
                ),
          );
        }

        throw new Error(`Неожиданный запрос: ${path}`);
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderProfilePage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Сервис временно недоступен.',
    );

    await user.click(
      screen.getByRole('button', { name: 'Попробовать снова' }),
    );

    expect(
      await screen.findByText('Статистика восстановлена'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(statsAttempts).toBe(2);
  });

  it('повторно загружает достижения после ошибки', async () => {
    let achievementsAttempts = 0;
    const fetchMock = vi.fn().mockImplementation(
      (input: RequestInfo | URL) => {
        const path = getPath(getRequest(input));

        if (path === '/api/profiles') {
          return Promise.resolve(createJsonResponse(profiles));
        }
        if (path === '/api/users/1/stats') {
          return Promise.resolve(
            createJsonResponse(createStats(1, 'Статистика Альфы')),
          );
        }
        if (path === '/api/users/1/achievements') {
          achievementsAttempts += 1;

          return Promise.resolve(
            achievementsAttempts === 1
              ? createJsonResponse(serverError, 503)
              : createJsonResponse(
                  createAchievements(
                    1,
                    'Достижение после повтора',
                  ),
                ),
          );
        }

        throw new Error(`Неожиданный запрос: ${path}`);
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderProfilePage();

    await screen.findByText('Статистика Альфы');
    await user.click(
      screen.getByRole('tab', { name: 'Достижения' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Сервис временно недоступен.',
    );

    await user.click(
      screen.getByRole('button', { name: 'Попробовать снова' }),
    );

    expect(
      await screen.findByText('Достижение после повтора'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(achievementsAttempts).toBe(2);
  });
});
