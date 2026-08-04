package domain

import "time"

type YearMetrics struct {
	UserID           int64
	RegistrationDate time.Time

	ViewsCount           int
	SearchesCount        int
	FavoritesCount       int
	MessagesPeopleCount  int
	ListingsCreatedCount int
	BuysCount            int
	SellsCount           int

	SpentAmount  *int
	EarnedAmount *int

	MaxStreakDays int
	ActiveDays    int
	YearsOnAvito  int

	PriceMin *int
	PriceMax *int

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
	ListingID  int64
	CategoryID int64
}

type YearMetricsListingCount struct {
	ListingID  int64
	CategoryID int64
	Views      int
}

type YearMetricsOwnListing struct {
	ID         int64
	CategoryID int64
	Status     string
	UpdatedAt  time.Time
	ViewsCount int
}
