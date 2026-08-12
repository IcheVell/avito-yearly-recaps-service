package recap

import "time"

type YearMetrics struct {
	UserID           int64
	RegistrationDate time.Time

	ViewsCount           int64
	SearchesCount        int64
	FavoritesCount       int64
	MessagesPeopleCount  int64 // count new conversations
	ListingsCreatedCount int64
	BuysCount            int64
	SellsCount           int64

	SpentAmount  *int64
	EarnedAmount *int64

	MaxStreakDays int64 // add achievements
	ActiveDays    int64
	YearsOnAvito  int64

	PriceMin *int64
	PriceMax *int64

	SellerRating *float64

	FavoriteBuyCategory  *YearMetricsCategory
	FavoriteSellCategory *YearMetricsCategory

	MostViewedListing *YearMetricsListing

	BestReviewReceived *YearMetricsReview
	BestReviewLeft     *YearMetricsReview
	ViewsByCategory    []YearMetricsViews
	SearchesByCategory []YearMetricsSearches
	Favorites          []YearMetricsFavorite
	ListingViewCounts  []YearMetricsListingCount
	MessagedListingIDs []int64
	OwnListings        []YearMetricsOwnListing
	YearAchievements   []YearAchievement
}

type YearAchievement struct {
	ID          int64
	Code        string
	Name        string
	Description string
	ImageURL    string
}
type YearMetricsCategory struct {
	ID   int64
	Name string
}

type YearMetricsListing struct {
	ID         int64
	Name       string
	City       string
	ImageURL   string
	ViewsCount int
}

type YearMetricsReview struct {
	ID     int64
	Rating int
	Text   string
}

type YearMetricsViews struct {
	CategoryID   int64
	CategoryName string
	Views        int
}

type YearMetricsSearches struct {
	CategoryID   int64
	CategoryName string
	Searches     int
}

type YearMetricsFavorite struct {
	ListingID       int64
	ListingName     string
	ListingImageURL string
	ListingPrice    *int64
	ListingCity     string
	CategoryID      int64
	CategoryName    string
}

type YearMetricsListingCount struct {
	ListingID       int64
	ListingName     string
	ListingImageURL string
	ListingPrice    *int64
	ListingCity     string
	CategoryID      int64
	CategoryName    string
	Views           int
}

type YearMetricsOwnListing struct {
	ID           int64 // ListingID
	Name         string
	ImageURL     string
	Price        *int64
	City         string
	CategoryID   int64
	CategoryName string
	Status       string
	UpdatedAt    time.Time
	ViewsCount   int
}
