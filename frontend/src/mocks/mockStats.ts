import type { YearMetrics } from '../entities/stats/types';

const categories = [
  { id: 1, name: 'Электроника' },
  { id: 2, name: 'Транспорт' },
  { id: 3, name: 'Одежда и обувь' },
];

const mostViewedListings = [
  {
    id: 101,
    name: 'iPhone 13 128GB',
    city: 'Москва',
    imageUrl:
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80',
    viewsCount: 42,
  },
  {
    id: 102,
    name: 'PlayStation 5 Slim',
    city: 'Санкт-Петербург',
    imageUrl:
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80',
    viewsCount: 38,
  },
  {
    id: 103,
    name: 'Городской велосипед',
    city: 'Казань',
    imageUrl:
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80',
    viewsCount: 51,
  },
  {
    id: 104,
    name: 'Фотоаппарат Fujifilm X-T30',
    city: 'Новосибирск',
    imageUrl:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
    viewsCount: 47,
  },
  {
    id: 105,
    name: 'Кресло в скандинавском стиле',
    city: 'Екатеринбург',
    imageUrl:
      'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80',
    viewsCount: 33,
  },
  {
    id: 106,
    name: 'Ноутбук для работы и учёбы',
    city: 'Самара',
    imageUrl:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
    viewsCount: 64,
  },
  {
    id: 107,
    name: 'Акустическая гитара',
    city: 'Пермь',
    imageUrl:
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80',
    viewsCount: 29,
  },
  {
    id: 108,
    name: 'Кроссовки New Balance',
    city: 'Омск',
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    viewsCount: 56,
  },
  {
    id: 109,
    name: 'Кофемашина для дома',
    city: 'Красноярск',
    imageUrl:
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=900&q=80',
    viewsCount: 44,
  },
];

export function getMockStats(userId: number): YearMetrics {
  const factor = Math.max(1, userId);
  const favoriteBuyCategory = categories[(factor - 1) % categories.length];
  const favoriteSellCategory = categories[factor % categories.length];
  const mostViewedListing =
    mostViewedListings[(factor - 1) % mostViewedListings.length];

  return {
    userId,
    registrationDate: '2020-06-01T12:00:00Z',
    viewsCount: 420 + factor * 47,
    searchesCount: 80 + factor * 9,
    favoritesCount: 12 + factor,
    messagesPeopleCount: 18 + factor * 2,
    listingsCreatedCount: 4 + factor,
    buysCount: 2 + factor,
    sellsCount: 3 + factor,
    spentAmount: 24_000 + factor * 5_500,
    earnedAmount: 46_000 + factor * 8_000,
    maxStreakDays: 7 + factor,
    activeDays: 72 + factor * 8,
    yearsOnAvito: 6,
    priceMin: 500,
    priceMax: 150_000,
    sellerRating: Math.min(5, 4.5 + factor * 0.05),
    favoriteBuyCategory,
    favoriteSellCategory,
    mostViewedListing,
    bestReviewReceived: {
      id: 200 + factor,
      rating: 5,
      text: 'Всё чётко, рекомендую!',
    },
    bestReviewLeft: {
      id: 300 + factor,
      rating: 5,
      text: 'Товар полностью соответствует описанию.',
    },
    viewsByCategory: categories.map((category, index) => ({
      categoryId: category.id,
      categoryName: category.name,
      views: (3 - index) * 70 + factor * 8,
    })),
    searchesByCategory: categories.map((category, index) => ({
      categoryId: category.id,
      categoryName: category.name,
      searches: (3 - index) * 18 + factor * 2,
    })),
    favorites: [
      { listingId: 10 + factor, categoryId: favoriteBuyCategory.id },
      { listingId: 20 + factor, categoryId: favoriteSellCategory.id },
    ],
    listingViewCounts: [
      {
        listingId: mostViewedListing.id,
        categoryId: favoriteBuyCategory.id,
        views: mostViewedListing.viewsCount,
      },
    ],
    messagedListingIds: [30 + factor, 40 + factor],
    ownListings: [
      {
        id: 50 + factor,
        categoryId: favoriteSellCategory.id,
        status: 'active',
        updatedAt: '2026-01-10T12:00:00Z',
        viewsCount: 15 + factor,
      },
    ],
  };
}
