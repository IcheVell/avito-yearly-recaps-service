package dto

import (
	"math"
	"time"
	"v1/internal/domain"
)

type YearMetricsResponse struct {
	UserID           int64     `json:"userId"`
	RegistrationDate time.Time `json:"registrationDate"`

	ViewsCount           int64 `json:"viewsCount"`
	SearchesCount        int64 `json:"searchesCount"`
	FavoritesCount       int64 `json:"favoritesCount"`
	MessagesPeopleCount  int64 `json:"messagesPeopleCount"`
	ListingsCreatedCount int64 `json:"listingsCreatedCount"`
	BuysCount            int64 `json:"buysCount"`
	SellsCount           int64 `json:"sellsCount"`

	SpentAmount  *int64 `json:"spentAmount"`
	EarnedAmount *int64 `json:"earnedAmount"`

	MaxStreakDays int64 `json:"maxStreakDays"`
	ActiveDays    int64 `json:"activeDays"`
	YearsOnAvito  int64 `json:"yearsOnAvito"`

	PriceMin *int64 `json:"priceMin"`
	PriceMax *int64 `json:"priceMax"`

	SellerRating *float64 `json:"sellerRating"`

	FavoriteBuyCategory  *YearMetricsCategoryResponse      `json:"favoriteBuyCategory"`
	FavoriteSellCategory *YearMetricsCategoryResponse      `json:"favoriteSellCategory"`
	MostViewedListing    *YearMetricsListingResponse       `json:"mostViewedListing"`
	BestReviewReceived   *YearMetricsReviewResponse        `json:"bestReviewReceived"`
	BestReviewLeft       *YearMetricsReviewResponse        `json:"bestReviewLeft"`
	ViewsByCategory      []YearMetricsViewsResponse        `json:"viewsByCategory"`
	SearchesByCategory   []YearMetricsSearchesResponse     `json:"searchesByCategory"`
	Favorites            []YearMetricsFavoriteResponse     `json:"favorites"`
	ListingViewCounts    []YearMetricsListingCountResponse `json:"listingViewCounts"`
	MessagedListingIDs   []int64                           `json:"messagedListingIds"`
	OwnListings          []YearMetricsOwnListingResponse   `json:"ownListings"`
}

type YearMetricsCategoryResponse struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type YearMetricsListingResponse struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	City       string `json:"city"`
	ImageURL   string `json:"imageUrl"`
	ViewsCount int    `json:"viewsCount"`
}

type YearMetricsReviewResponse struct {
	ID     int64  `json:"id"`
	Rating int    `json:"rating"`
	Text   string `json:"text"`
}

type YearMetricsViewsResponse struct {
	CategoryID   int64  `json:"categoryId"`
	CategoryName string `json:"categoryName"`
	Views        int    `json:"views"`
}

type YearMetricsSearchesResponse struct {
	CategoryID   int64  `json:"categoryId"`
	CategoryName string `json:"categoryName"`
	Searches     int    `json:"searches"`
}

type YearMetricsFavoriteResponse struct {
	ListingID  int64 `json:"listingId"`
	CategoryID int64 `json:"categoryId"`
}

type YearMetricsListingCountResponse struct {
	ListingID  int64 `json:"listingId"`
	CategoryID int64 `json:"categoryId"`
	Views      int   `json:"views"`
}

type YearMetricsOwnListingResponse struct {
	ID         int64     `json:"id"`
	CategoryID int64     `json:"categoryId"`
	Status     string    `json:"status"`
	UpdatedAt  time.Time `json:"updatedAt"`
	ViewsCount int       `json:"viewsCount"`
}

func NewYearMetricsResponse(metrics domain.YearMetrics) YearMetricsResponse {
	return YearMetricsResponse{
		UserID:               metrics.UserID,
		RegistrationDate:     metrics.RegistrationDate,
		ViewsCount:           metrics.ViewsCount,
		SearchesCount:        metrics.SearchesCount,
		FavoritesCount:       metrics.FavoritesCount,
		MessagesPeopleCount:  metrics.MessagesPeopleCount,
		ListingsCreatedCount: metrics.ListingsCreatedCount,
		BuysCount:            metrics.BuysCount,
		SellsCount:           metrics.SellsCount,
		SpentAmount:          metrics.SpentAmount,
		EarnedAmount:         metrics.EarnedAmount,
		MaxStreakDays:        metrics.MaxStreakDays,
		ActiveDays:           metrics.ActiveDays,
		YearsOnAvito:         metrics.YearsOnAvito,
		PriceMin:             metrics.PriceMin,
		PriceMax:             metrics.PriceMax,
		SellerRating:         roundSellerRating(metrics.SellerRating),
		FavoriteBuyCategory:  newYearMetricsCategoryResponse(metrics.FavoriteBuyCategory),
		FavoriteSellCategory: newYearMetricsCategoryResponse(metrics.FavoriteSellCategory),
		MostViewedListing:    newYearMetricsListingResponse(metrics.MostViewedListing),
		BestReviewReceived:   newYearMetricsReviewResponse(metrics.BestReviewReceived),
		BestReviewLeft:       newYearMetricsReviewResponse(metrics.BestReviewLeft),
		ViewsByCategory:      newYearMetricsViewsResponses(metrics.ViewsByCategory),
		SearchesByCategory:   newYearMetricsSearchesResponses(metrics.SearchesByCategory),
		Favorites:            newYearMetricsFavoriteResponses(metrics.Favorites),
		ListingViewCounts:    newYearMetricsListingCountResponses(metrics.ListingViewCounts),
		MessagedListingIDs:   emptyInt64SliceIfNil(metrics.MessagedListingIDs),
		OwnListings:          newYearMetricsOwnListingResponses(metrics.OwnListings),
	}
}

func roundSellerRating(rating *float64) *float64 {
	if rating == nil {
		return nil
	}
	rounded := math.Round(*rating*10) / 10
	return &rounded
}

func newYearMetricsCategoryResponse(category *domain.YearMetricsCategory) *YearMetricsCategoryResponse {
	if category == nil {
		return nil
	}

	return &YearMetricsCategoryResponse{
		ID:   category.ID,
		Name: category.Name,
	}
}

func newYearMetricsListingResponse(listing *domain.YearMetricsListing) *YearMetricsListingResponse {
	if listing == nil {
		return nil
	}

	return &YearMetricsListingResponse{
		ID:         listing.ID,
		Name:       listing.Name,
		City:       listing.City,
		ImageURL:   listing.ImageURL,
		ViewsCount: listing.ViewsCount,
	}
}

func newYearMetricsReviewResponse(review *domain.YearMetricsReview) *YearMetricsReviewResponse {
	if review == nil {
		return nil
	}

	return &YearMetricsReviewResponse{
		ID:     review.ID,
		Rating: review.Rating,
		Text:   review.Text,
	}
}

func newYearMetricsViewsResponses(views []domain.YearMetricsViews) []YearMetricsViewsResponse {
	items := make([]YearMetricsViewsResponse, 0, len(views))
	for _, view := range views {
		items = append(items, YearMetricsViewsResponse{
			CategoryID:   view.CategoryID,
			CategoryName: view.CategoryName,
			Views:        view.Views,
		})
	}

	return items
}

func newYearMetricsSearchesResponses(searches []domain.YearMetricsSearches) []YearMetricsSearchesResponse {
	items := make([]YearMetricsSearchesResponse, 0, len(searches))
	for _, search := range searches {
		items = append(items, YearMetricsSearchesResponse{
			CategoryID:   search.CategoryID,
			CategoryName: search.CategoryName,
			Searches:     search.Searches,
		})
	}

	return items
}

func newYearMetricsFavoriteResponses(favorites []domain.YearMetricsFavorite) []YearMetricsFavoriteResponse {
	items := make([]YearMetricsFavoriteResponse, 0, len(favorites))
	for _, favorite := range favorites {
		items = append(items, YearMetricsFavoriteResponse{
			ListingID:  favorite.ListingID,
			CategoryID: favorite.CategoryID,
		})
	}

	return items
}

func newYearMetricsListingCountResponses(counts []domain.YearMetricsListingCount) []YearMetricsListingCountResponse {
	items := make([]YearMetricsListingCountResponse, 0, len(counts))
	for _, count := range counts {
		items = append(items, YearMetricsListingCountResponse{
			ListingID:  count.ListingID,
			CategoryID: count.CategoryID,
			Views:      count.Views,
		})
	}

	return items
}

func newYearMetricsOwnListingResponses(listings []domain.YearMetricsOwnListing) []YearMetricsOwnListingResponse {
	items := make([]YearMetricsOwnListingResponse, 0, len(listings))
	for _, listing := range listings {
		items = append(items, YearMetricsOwnListingResponse{
			ID:         listing.ID,
			CategoryID: listing.CategoryID,
			Status:     listing.Status,
			UpdatedAt:  listing.UpdatedAt,
			ViewsCount: listing.ViewsCount,
		})
	}

	return items
}
