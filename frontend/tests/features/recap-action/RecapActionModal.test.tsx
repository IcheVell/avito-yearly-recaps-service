import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { RecapAction } from '../../../src/entities/recap/types';
import { RecapActionModal } from '../../../src/features/recap-action/RecapActionModal';

const target = {
  listingIds: [],
  categoryId: 0,
  listings: [],
};

const cases: Array<{
  action: RecapAction;
  title: string;
}> = [
  {
    action: {
      type: 'boost_listings',
      label: 'Обновить',
      reason: 'Причина',
      target,
    },
    title: 'Обновить объявления',
  },
  {
    action: {
      type: 'create_listing',
      label: 'Создать',
      reason: 'Причина',
      target,
    },
    title: 'Создать объявление',
  },
  {
    action: {
      type: 'listing_abandoned',
      label: 'Написать',
      reason: 'Причина',
      target,
    },
    title: 'Написать продавцу',
  },
  {
    action: {
      type: 'compare_top',
      label: 'Сравнить',
      reason: 'Причина',
      target,
    },
    title: 'Сравнить топ-3',
  },
  {
    action: {
      type: 'open_favorites',
      label: 'Открыть',
      reason: 'Причина',
      target,
    },
    title: 'Вернуться к сохранённым',
  },
  {
    action: {
      type: 'continue_search',
      label: 'Продолжить',
      reason: 'Причина',
      target,
    },
    title: 'Продолжить поиск',
  },
];

describe('RecapActionModal', () => {
  it.each(cases)('открывает модалку «$title»', ({ action, title }) => {
    render(<RecapActionModal action={action} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: title })).toBeInTheDocument();
  });
});
