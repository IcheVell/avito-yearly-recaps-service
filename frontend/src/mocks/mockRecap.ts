import type { Recap } from '../entities/recap/types';


export const mockRecap: Recap = {
  id: 101,
  userId: 1,
  year: 2025,
  createdAt: '2026-01-15T12:00:00Z',

  role: {
    code: 'seller',
    title: 'В этом году ты крутой продавец!',
    subtitle: 'Ты продал 9 товаров.',
    why: '67% активности — создание объявлений и продажа товаров',
    activitySharePercent: 67,
  },

  metrics: [
    {
      type: 'spent_amount',
      title: 'Потраченная сумма',
      text: 'Столько стоило твоё любопытство в этом году.',
      highlights: ['48 500 ₽'],
      payload: {
        spentAmount: 48_500,
      },
    },
    {
      type: 'max_streak_days',
      title: 'Максимальный стрик',
      text: 'Так выглядит твой рекорд постоянства.',
      highlights: ['14 дней'],
      payload: {
        maxStreakDays: 14,
      },
    },
    {
      type: 'most_viewed_listing',
      title: 'Товар, к которому ты возвращался',
      text: 'Один лот не давал тебе покоя — iPhone 13 128GB.',
      highlights: ['iPhone 13'],
      payload: {
        listingId: 2,
        name: 'iPhone 13 128GB',
        imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80',
        viewsCount: 42,
      },
    },
  ],

  achievements: [
    {
      code: 'clean_sale',
      name: 'Чистая продажа',
      description: 'У тебя есть завершённые продажи в этом году.',
    },
    {
      code: 'diplomat',
      name: 'Дипломат',
      description: 'Ты вёл много диалогов относительно просмотров.',
    },
  ],

  action: {
    type: 'boost_listings',
    label: 'Обновить объявления',
    reason: 'Есть активные объявления с низким откликом.',
    target: {
      listingIds: [11],
      categoryId: 3,
    },
  },

  debug: {
    generatorVersion: 'v1',
    seedProfile: 'seller_1',
  },
};
