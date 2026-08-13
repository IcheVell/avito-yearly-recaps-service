import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Recap } from '../../../src/entities/recap/types';
import { baseApi } from '../../../src/shared/api/baseApi';
import { RecapOverlay } from '../../../src/widgets/RecapOverlay/RecapOverlay';

const recap: Recap = {
  id: 7,
  userId: 42,
  year: 2025,
  createdAt: '2026-01-10T12:00:00Z',
  role: {
    code: 'seller',
    name: 'Продавец',
    title: 'Продавец года',
    subtitle: 'Ты отлично продавал',
    why: 'Много успешных объявлений',
    activitySharePercent: 67,
  },
  metrics: [
    {
      type: 'sales',
      title: 'Продажи',
      text: 'За год продано 10 товаров',
      highlights: ['10 товаров'],
      payload: {},
    },
  ],
  achievements: [
    {
      code: 'first-sale',
      name: 'Первая продажа',
      description: 'Первый проданный товар',
      imageUrl: null,
    },
  ],
  action: {
    type: 'create_listing',
    label: 'Создать объявление',
    reason: 'Продолжить продажи',
    target: { listingIds: [], categoryId: 0, listings: [] },
  },
};

function renderWithStore(component: ReactNode) {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(<Provider store={store}>{component}</Provider>);
}

function renderOverlay(onClose = vi.fn()) {
  return renderWithStore(<RecapOverlay recap={recap} onClose={onClose} />);
}

function getPreviousButton() {
  return screen.getByRole('button', {
    name: 'Предыдущая карточка',
  });
}

function getNextButton() {
  return screen.getByRole('button', {
    name: 'Следующая карточка',
  });
}

function OverlayHarness() {
  const [isOpen, setIsOpen] = useState(true);

  return isOpen ? (
    <RecapOverlay recap={recap} onClose={() => setIsOpen(false)} />
  ) : (
    <p>Итоги закрыты</p>
  );
}

describe('навигация по итогам', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete HTMLElement.prototype.scrollTo;
    document.body.style.overflow = '';
  });

  it('открывает первую карточку и не переходит левее неё', async () => {
    const user = userEvent.setup();
    renderOverlay();

    const firstProgressItem = screen.getByRole('button', {
      name: 'Перейти к карточке 1',
    });

    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    expect(firstProgressItem).toHaveAttribute('aria-current', 'step');
    expect(getPreviousButton()).toBeDisabled();
    expect(getNextButton()).toBeEnabled();

    await user.click(getPreviousButton());

    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    expect(firstProgressItem).toHaveAttribute('aria-current', 'step');
  });

  it('переходит вперёд и не выходит за последнюю карточку', async () => {
    const user = userEvent.setup();
    renderOverlay();

    await user.click(getNextButton());
    expect(screen.getByText('2 / 5')).toBeInTheDocument();

    await user.click(getNextButton());
    await user.click(getNextButton());
    await user.click(getNextButton());

    expect(screen.getByText('5 / 5')).toBeInTheDocument();
    expect(getNextButton()).toBeDisabled();
    expect(getPreviousButton()).toBeEnabled();
    expect(
      screen.getByRole('button', {
        name: 'Перейти к карточке 5',
      }),
    ).toHaveAttribute('aria-current', 'step');

    await user.click(getNextButton());

    expect(screen.getByText('5 / 5')).toBeInTheDocument();
  });

  it('переключает карточки стрелками клавиатуры', async () => {
    const user = userEvent.setup();
    renderOverlay();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('2 / 5')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('1 / 5')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('переходит к карточке по индикатору прогресса', async () => {
    const user = userEvent.setup();
    renderOverlay();

    const fourthProgressItem = screen.getByRole('button', {
      name: 'Перейти к карточке 4',
    });
    await user.click(fourthProgressItem);

    expect(screen.getByText('4 / 5')).toBeInTheDocument();
    expect(fourthProgressItem).toHaveAttribute('aria-current', 'step');
    expect(
      screen.getByRole('button', {
        name: 'Перейти к карточке 1',
      }),
    ).not.toHaveAttribute('aria-current');
  });

  it('закрывается по Escape и восстанавливает прокрутку body', async () => {
    document.body.style.overflow = 'auto';
    const user = userEvent.setup();
    renderWithStore(<OverlayHarness />);

    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');

    expect(screen.getByText('Итоги закрыты')).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Итоги 2025 года' }),
    ).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('auto');
  });
});
