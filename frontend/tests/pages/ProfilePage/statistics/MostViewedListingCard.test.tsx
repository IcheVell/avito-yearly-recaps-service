import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MostViewedListingCard } from '../../../../src/pages/ProfilePage/statistics/MostViewedListingCard';

describe('MostViewedListingCard', () => {
  it('показывает отсутствие данных, если mostViewedListing равен null', () => {
    render(<MostViewedListingCard listing={null} />);

    expect(
      screen.getByRole('heading', {
        name: 'Популярное объявление',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Недостаточно данных.')).toBeInTheDocument();
  });
});
