import { describe, expect, it } from 'vitest';

import type { Recap } from '../../../../src/entities/recap/types';
import { createRecapSlides } from '../../../../src/widgets/RecapOverlay/model/recapSlides';

const recapWithoutOptionalSlides: Recap = {
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
  metrics: [],
  achievements: [],
  action: {
    type: 'create_listing',
    label: 'Создать объявление',
    reason: 'Продолжить продажи',
    target: {},
  },
};

describe('createRecapSlides', () => {
  it('формирует обязательные карточки при пустых metrics и achievements', () => {
    const slides = createRecapSlides(recapWithoutOptionalSlides);

    expect(slides.map((slide) => slide.kind)).toEqual([
      'intro',
      'role',
      'action',
    ]);
  });
});
