import type { Recap } from '../entities/recap/types';


export const mockRecap: Recap = {
  id: 101,
  userId: 1,
  year: 2025,
  createdAt: '2026-01-15T12:00:00Z',

  role: {
    code: 'seller',
    name: 'Продавец',
    title: 'Продавец!',
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
      imageUrl: '',
    },
    {
      code: 'diplomat',
      name: 'Дипломат',
      description: 'Ты вёл много диалогов относительно просмотров.',
      imageUrl: '',
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
    code: 'bargain_hunter',
    name: 'Охотник за выгодой',
    title: 'Охотник за выгодой',
    subtitle: 'Ты знаешь, как найти лучшее предложение.',
    why: '78% активности — поиск, сравнение и покупки',
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
      code: 'smart_choice',
      name: 'Умный выбор',
      description: 'Ты сравнил десятки вариантов и нашёл свой.',
      imageUrl: '',
    },
    {
      code: 'quick_deal',
      name: 'Быстрая сделка',
      description: 'Одна из твоих покупок состоялась в день первого сообщения.',
      imageUrl: '',
    },
  ],

  action: {
    type: 'view_favorites',
    label: 'Проверить избранное',
    reason: 'В твоём избранном остались предложения, которые могут скоро исчезнуть.',
    target: {
      listingIds: [7, 18, 24],
      categoryId: 4,
    },
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
    code: 'explorer',
    name: 'Неутомимый исследователь',
    title: 'Неутомимый исследователь',
    subtitle: 'Ты всегда в курсе, что нового появилось на Avito.',
    why: '86% активности — просмотры и избранное',
    activitySharePercent: 86,
  },

  metrics: [
    {
      type: 'active_days',
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
      type: 'max_streak_days',
      title: 'Максимальный стрик',
      text: ' Без единого дня без новых находок.',
      highlights: ['31 день'],
      payload: {
        maxStreakDays: 31,
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
      code: 'collector',
      name: 'Коллекционер',
      description: 'Твоё избранное похоже на настоящую коллекцию.',
      imageUrl: '',
    },
    {
      code: 'regular',
      name: 'Завсегдатай',
      description: 'Ты возвращалась на Avito чаще, чем через день.',
      imageUrl: '',
    },
    {
      code: 'wide_horizon',
      name: 'Широкий кругозор',
      description: 'В твоих поисках было больше десяти разных категорий.',
      imageUrl: '',
    },
  ],

  action: {
    type: 'open_recommendations',
    label: 'Посмотреть рекомендации',
    reason: 'Мы нашли новые объявления по мотивам твоих любимых поисков.',
    target: {
      categoryId: 5,
    },
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

export function getMockRecap(
  userId: number,
  year: number,
): Recap {
  const recap =
    mockRecaps.find((item) => item.userId === userId) ??
    mockRecap;

  return {
    ...recap,
    userId,
    year,
  };
}

export function getMockRecapById(recapId: number): Recap {
  return (
    mockRecaps.find((item) => item.id === recapId) ?? {
      ...mockRecap,
      id: recapId,
    }
  );
}
