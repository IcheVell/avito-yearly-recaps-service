export type StatsCategory = {
  id: number;
  name: string;
};

export type StatsListing = {
  id: number;
  name: string;
  city: string;
  imageUrl: string;
  viewsCount: number;
};

export type StatsReview = {
  id: number;
  rating: number;
  text: string;
};

export type CategoryViews = {
  categoryId: number;
  categoryName: string;
  views: number;
};

export type CategorySearches = {
  categoryId: number;
  categoryName: string;
  searches: number;
};

export type StatsFavorite = {
  listingId: number;
  categoryId: number;
};

export type ListingViewCount = {
  listingId: number;
  categoryId: number;
  views: number;
};

export type OwnListing = {
  id: number;
  categoryId: number;
  status: string;
  updatedAt: string;
  viewsCount: number;
};

export type YearMetrics = {
  userId: number;
  registrationDate: string;
  viewsCount: number;
  searchesCount: number;
  favoritesCount: number;
  messagesPeopleCount: number;
  listingsCreatedCount: number;
  buysCount: number;
  sellsCount: number;
  spentAmount: number | null;
  earnedAmount: number | null;
  maxStreakDays: number;
  activeDays: number;
  yearsOnAvito: number;
  priceMin: number | null;
  priceMax: number | null;
  sellerRating: number | null;
  favoriteBuyCategory: StatsCategory | null;
  favoriteSellCategory: StatsCategory | null;
  mostViewedListing: StatsListing | null;
  bestReviewReceived: StatsReview | null;
  bestReviewLeft: StatsReview | null;
  viewsByCategory: CategoryViews[];
  searchesByCategory: CategorySearches[];
  favorites: StatsFavorite[];
  listingViewCounts: ListingViewCount[];
  messagedListingIds: number[];
  ownListings: OwnListing[];
};
