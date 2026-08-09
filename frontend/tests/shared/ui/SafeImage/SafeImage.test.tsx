import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SafeImage } from '../../../../src/shared/ui/SafeImage/SafeImage';

describe('SafeImage', () => {
  it('показывает заглушку, если imageUrl равен null', () => {
    render(
      <SafeImage
        src={null}
        alt="Изображение объявления"
        fallback={<span>Изображение недоступно</span>}
      />,
    );

    expect(screen.getByText('Изображение недоступно')).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'Изображение объявления' }),
    ).not.toBeInTheDocument();
  });
});
