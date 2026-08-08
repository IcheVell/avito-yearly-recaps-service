import type { Recap } from '../entities/recap/types';
import { mockAchievementCatalog } from './mockAchievements';
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

function selectAchievements(...codes: string[]) {
  const selectedCodes = new Set(codes);
  return mockAchievementCatalog.filter((achievement) =>
    selectedCodes.has(achievement.code),
  );
}

const sellerCreatorMockRecap: Recap = {
  id: 104,
  userId: 4,
  year: 2025,
  createdAt: '2026-01-18T09:20:00Z',
  role: {
    code: 'seller',
    name: 'Продавец',
    title: 'В этом году ты был на волне продаж!',
    subtitle: 'Ты продал 18 товаров.',
    why: '72% активности — объявления и успешные продажи',
    activitySharePercent: 72,
  },
  metrics: [
    {
      type: 'earned_amount',
      title: 'Заработанная сумма',
      text: 'Твои объявления принесли заметный результат за год.',
      highlights: ['286 000 ₽'],
      payload: { earnedAmount: 286_000 },
    },
    {
      type: 'sells_count',
      title: 'Продажи за год',
      text: 'Столько вещей нашли новых владельцев благодаря тебе.',
      highlights: ['18 продаж'],
      payload: { sellsCount: 18 },
    },
    {
      type: 'favorite_sell_category',
      title: 'Любимая категория продаж',
      text: 'Чаще всего ты продавал товары для дома.',
      highlights: ['Для дома'],
      payload: { categoryId: 4, categoryName: 'Для дома' },
    },
  ],
  achievements: selectAchievements(
    'two_faced_market',
    'trust_badge',
    'diplomat',
  ),
  action: {
    type: 'create_listing',
    label: 'Разместить новое',
    reason: 'У тебя уже были успешные продажи — самое время продолжить.',
    target: {},
  },
  debug: {
    generatorVersion: 'v1',
    seedProfile: 'seller_creator_4',
  },
};

const buyerExplorerMockRecap: Recap = {
  id: 105,
  userId: 5,
  year: 2025,
  createdAt: '2026-01-19T11:10:00Z',
  role: {
    code: 'buyer',
    name: 'Покупатель',
    title: 'Ты находил именно то, что искал!',
    subtitle: 'Ты купил 21 товар.',
    why: '81% активности — поиск, избранное и покупки',
    activitySharePercent: 81,
  },
  metrics: [
    {
      type: 'spent_amount',
      title: 'Потраченная сумма',
      text: 'Столько стоили твои лучшие находки за год.',
      highlights: ['194 600 ₽'],
      payload: { spentAmount: 194_600 },
    },
    {
      type: 'buys_count',
      title: 'Покупки за год',
      text: 'Каждая из них началась с любопытства и хорошего поиска.',
      highlights: ['21 покупка'],
      payload: { buysCount: 21 },
    },
    {
      type: 'price_range',
      title: 'Диапазон цен',
      text: 'Ты находил варианты и для мелких, и для больших покупок.',
      highlights: ['от 300 ₽'],
      payload: { priceMin: 300, priceMax: 85_000 },
    },
  ],
  achievements: selectAchievements(
    'shortlist_hoarder',
    'wallet_whisperer',
    'plot_twist',
  ),
  action: {
    type: 'listing_abandoned',
    label: 'Написать продавцу',
    reason: 'Есть объявление, к которому ты возвращался, но не написал.',
    target: { listingIds: [205], categoryId: 1 },
  },
  debug: {
    generatorVersion: 'v1',
    seedProfile: 'buyer_explorer_5',
  },
};

const watcherCollectorMockRecap: Recap = {
  id: 106,
  userId: 6,
  year: 2025,
  createdAt: '2026-01-20T13:40:00Z',
  role: {
    code: 'watcher',
    name: 'Наблюдатель',
    title: 'Ни одна интересная вещь не прошла мимо!',
    subtitle: 'Ты посмотрел 1 432 объявления.',
    why: '89% активности — просмотры, поиски и сравнение вариантов',
    activitySharePercent: 89,
  },
  metrics: [
    {
      type: 'viewed_listenings_number',
      title: 'Просмотренные объявления',
      text: 'Ты изучил достаточно вариантов, чтобы выбирать уверенно.',
      highlights: ['1 432'],
      payload: { viewsCount: 1_432 },
    },
    {
      type: 'searches_count',
      title: 'Поиски',
      text: 'Каждый новый запрос приближал тебя к идеальному варианту.',
      highlights: ['516'],
      payload: { searchesCount: 516 },
    },
    {
      type: 'favorite_buy_category',
      title: 'Главный интерес года',
      text: 'Больше всего тебя привлекала электроника.',
      highlights: ['Электроника'],
      payload: { categoryId: 1, categoryName: 'Электроника' },
    },
  ],
  achievements: selectAchievements(
    'streak_survivor',
    'shortlist_hoarder',
    'diplomat',
  ),
  action: {
    type: 'compare_top',
    label: 'Сравнить топ-3',
    reason: 'У тебя уже есть три сильных кандидата — осталось сравнить.',
    target: { listingIds: [301, 302, 303], categoryId: 1 },
  },
  debug: {
    generatorVersion: 'v1',
    seedProfile: 'watcher_collector_6',
  },
};

const sellerVeteranMockRecap: Recap = {
  id: 107,
  userId: 7,
  year: 2025,
  createdAt: '2026-01-21T15:00:00Z',
  role: {
    code: 'seller',
    name: 'Продавец',
    title: 'Опыт и доверие работали на тебя весь год!',
    subtitle: 'Ты продал 34 товара.',
    why: '76% активности — продажи и управление объявлениями',
    activitySharePercent: 76,
  },
  metrics: [
    {
      type: 'earned_amount',
      title: 'Твои продажи',
      text: 'Год получился действительно результативным.',
      highlights: ['542 000 ₽'],
      payload: { earnedAmount: 542_000 },
    },
    {
      type: 'seller_rating',
      title: 'Рейтинг продавца',
      text: 'Покупатели особенно высоко оценили работу с тобой.',
      highlights: ['5,0'],
      payload: { sellerRating: 5 },
    },
    {
      type: 'buy_vs_sell',
      title: 'Покупки и продажи',
      text: 'В этом году продажи уверенно вышли вперёд.',
      highlights: ['34 продажи'],
      payload: { buysCount: 6, sellsCount: 34 },
    },
  ],
  achievements: selectAchievements(
    'streak_survivor',
    'two_faced_market',
    'shortlist_hoarder',
  ),
  action: {
    type: 'boost_listings',
    label: 'Обновить объявления',
    reason: 'Несколько активных объявлений пора снова поднять в выдаче.',
    target: { listingIds: [401, 402], categoryId: 3 },
  },
  debug: {
    generatorVersion: 'v1',
    seedProfile: 'seller_veteran_7',
  },
};

const buyerBalancedMockRecap: Recap = {
  id: 108,
  userId: 8,
  year: 2025,
  createdAt: '2026-01-22T16:25:00Z',
  role: {
    code: 'buyer',
    name: 'Покупатель',
    title: 'Ты умел находить выгодные варианты!',
    subtitle: 'Ты купил 9 товаров.',
    why: '69% активности — сравнение цен и покупки',
    activitySharePercent: 69,
  },
  metrics: [
    {
      type: 'favorites_count',
      title: 'Избранное',
      text: 'Ты сохранял лучшие варианты, чтобы ничего не потерять.',
      highlights: ['48 находок'],
      payload: { favoritesCount: 48 },
    },
    {
      type: 'buys_count',
      title: 'Покупки за год',
      text: 'Девять поисков завершились удачной покупкой.',
      highlights: ['9 покупок'],
      payload: { buysCount: 9 },
    },
    {
      type: 'best_left_review',
      title: 'Лучший оставленный отзыв',
      text: '«Продавец помог с выбором и быстро всё отправил».',
      highlights: ['5 звёзд'],
      payload: {
        bestLeftReview: 'Продавец помог с выбором и быстро всё отправил',
      },
    },
  ],
  achievements: selectAchievements(
    'two_faced_market',
    'wallet_whisperer',
  ),
  action: {
    type: 'open_favorites',
    label: 'Вернуться к сохранённым',
    reason: 'В избранном остались варианты, которые стоит проверить.',
    target: { categoryId: 2 },
  },
  debug: {
    generatorVersion: 'v1',
    seedProfile: 'buyer_balanced_8',
  },
};

const watcherReturningMockRecap: Recap = {
  id: 109,
  userId: 9,
  year: 2025,
  createdAt: '2026-01-23T18:05:00Z',
  role: {
    code: 'watcher',
    name: 'Наблюдатель',
    title: 'Ты вернулся и снова включился в поиск!',
    subtitle: 'Ты посмотрел 963 объявления.',
    why: '84% активности — просмотры и возвращение к поиску',
    activitySharePercent: 84,
  },
  metrics: [
    {
      type: 'active_days_number',
      title: 'Дни на Avito',
      text: 'Ты регулярно возвращался посмотреть новые предложения.',
      highlights: ['148 дней'],
      payload: { activeDays: 148 },
    },
    {
      type: 'years_together',
      title: 'Лет вместе с Avito',
      text: 'За это время поиск хороших вариантов стал привычным делом.',
      highlights: ['7 лет'],
      payload: { yearsTogether: 7 },
    },
    {
      type: 'views_vs_favorites',
      title: 'Просмотры и избранное',
      text: 'Из сотен вариантов ты сохранял только самые интересные.',
      highlights: ['963 просмотра'],
      payload: { viewsCount: 963, favoritesCount: 71 },
    },
  ],
  achievements: selectAchievements(
    'plot_twist',
    'diplomat',
    'streak_survivor',
  ),
  action: {
    type: 'continue_search',
    label: 'Продолжить поиск',
    reason: 'Новые объявления уже появились — можно продолжить с лучшего места.',
    target: { categoryId: 4 },
  },
  debug: {
    generatorVersion: 'v1',
    seedProfile: 'watcher_returning_9',
  },
};

export const mockRecaps: Recap[] = [
  mockRecap,
  buyerMockRecap,
  watcherMockRecap,
  sellerCreatorMockRecap,
  buyerExplorerMockRecap,
  watcherCollectorMockRecap,
  sellerVeteranMockRecap,
  buyerBalancedMockRecap,
  watcherReturningMockRecap,
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
