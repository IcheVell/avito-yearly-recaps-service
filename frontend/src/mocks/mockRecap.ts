import type { Recap } from '../entities/recap/types';
import { mockProfiles } from './mockProfiles';


export const mockRecap: Recap = {
  id: 101,
  userId: 1,
  year: 2025,
  createdAt: '2026-01-15T12:00:00Z',

  role: {
    code: 'seller',
    name: 'Продавец',
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
      code: 'shortlist_hoarder',
      name: 'Коллекционер',
      description: 'Много в избранном',
      imageUrl: '/mock-achievements/shortlist_boarder.png',
    },
    {
      code: 'diplomat',
      name: 'Дипломат',
      description: 'Много собеседников',
      imageUrl: '/mock-achievements/diplomat.png',
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

const buyerMockRecap: Recap = {
  id: 102,
  userId: 2,
  year: 2025,
  createdAt: '2026-01-16T10:30:00Z',

  role: {
    code: 'buyer',
    name: 'Покупатель',
    title: 'В этом году ты активный покупатель!',
    subtitle: 'Ты купил 12 товаров.',
    why: '78% активности — поиск и покупки',
    activitySharePercent: 78,
  },

  metrics: [
    {
      type: 'spent_amount',
      title: 'Потраченная сумма',
      text: 'Столько ты вложил в покупки на Avito за год.',
      highlights: ['127 900 ₽'],
      payload: {
        spentAmount: 127_900,
      },
    },
    {
      type: 'searches_count',
      title: 'Поисковый азарт',
      text: 'Ты точно знаешь, что хорошая находка требует терпения.',
      highlights: ['384 раз'],
      payload: {
        searchesCount: 384,
      },
    },
    {
      type: 'most_viewed_listing',
      title: 'Товар, к которому ты возвращался',
      text: 'Эта вещь не выходила у тебя из головы.',
      highlights: ['PlayStation 5'],
      payload: {
        listingId: 7,
        name: 'PlayStation 5 Slim',
        imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80',
        viewsCount: 36,
      },
    },
  ],

  achievements: [
    {
      code: 'wallet_whisperer',
      name: 'Шепот кошелька',
      description: 'Много потратил как покупатель',
      imageUrl: '/mock-achievements/wallet_whisperer.png',
    },
    {
      code: 'trust_badge',
      name: 'Знак доверия',
      description: 'Высокий рейтинг',
      imageUrl: '/mock-achievements/trust_badge.png',
    },
  ],

  action: {
    type: 'open_favorites',
    label: 'Вернуться к сохранённым',
    reason: 'У тебя есть избранные объявления, к которым ты давно не возвращался.',
    target: {},
  },

  debug: {
    generatorVersion: 'v1',
    seedProfile: 'buyer_2',
  },
};

const watcherMockRecap: Recap = {
  id: 103,
  userId: 3,
  year: 2025,
  createdAt: '2026-01-17T08:15:00Z',

  role: {
    code: 'watcher',
    name: 'Наблюдатель',
    title: 'В этом году ты внимательный наблюдатель!',
    subtitle: 'Ты посмотрел 847 объявлений.',
    why: '86% активности — просмотры и поиск',
    activitySharePercent: 86,
  },

  metrics: [
    {
      type: 'active_days_number',
      title: 'Дней вместе с Avito',
      text: 'Больше половины года ты заглядывал в поисках чего-то интересного.',
      highlights: ['216'],
      payload: {
        activeDays: 216,
      },
    },
    {
      type: 'favorites_count',
      title: 'Коллекция находок',
      text: 'сиксевенннн.',
      highlights: ['67'],
      payload: {
        favoritesCount: 67,
      },
    },
    {
      type: 'views_vs_favorites',
      title: 'Просмотры и избранное',
      text: 'Ты много смотрел и сохранял самые интересные объявления.',
      highlights: ['847 просмотров', '67 в избранном'],
      payload: {
        viewsCount: 847,
        favoritesCount: 67,
      },
    },
    {
      type: 'most_viewed_listing',
      title: 'Товар, к которому ты возвращалась',
      text: 'Эту вещь ты просматривала чаще всего.',
      highlights: ['42 раза'],
      payload: {
        listingId: 15,
        name: 'City bike',
        imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80',
        viewsCount: 42,
      },
    },
  ],

  achievements: [
    {
      code: 'streak_survivor',
      name: 'Несгибаемый',
      description: 'Длинная серия заходов',
      imageUrl: '/mock-achievements/streak_survivor.png',
    },
    {
      code: 'plot_twist',
      name: 'Неожиданный поворот',
      description: 'Вернулся после паузы',
      imageUrl: '/mock-achievements/plot_twist.png',
    },
  ],

  action: {
    type: 'continue_search',
    label: 'Продолжить поиск',
    reason: 'Ты активно смотрел и искал — осталось сузить выбор и найти подходящий вариант.',
    target: {},
  },

  debug: {
    generatorVersion: 'v1',
    seedProfile: 'watcher_3',
  },
};

export const mockRecaps: Recap[] = [
  mockRecap,
  buyerMockRecap,
  watcherMockRecap,
];

function prepareMockRecap(recap: Recap, userId: number): Recap {
  return {
    ...recap,
    userId,
    year: mockProfiles.currentYear,
  };
}

const mockRecapStore = new Map<number, Recap>(
  mockRecaps.map((recap) => [
    recap.userId,
    prepareMockRecap(recap, recap.userId),
  ]),
);

export function getMockRecap(userId: number): Recap | undefined {
  return mockRecapStore.get(userId);
}

export function generateMockRecap(userId: number): Recap {
  const existingRecap = mockRecapStore.get(userId);
  const generatedRecap = prepareMockRecap(
    existingRecap ?? {
      ...mockRecap,
      id: 100 + userId,
    },
    userId,
  );

  mockRecapStore.set(userId, generatedRecap);

  return generatedRecap;
}
