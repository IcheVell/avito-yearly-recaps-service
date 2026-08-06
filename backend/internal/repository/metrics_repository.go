package repository

import (
	"context"
	"fmt"
	"time"
	"v1/internal/domain"

	"gorm.io/gorm"
)

type MetricsRepository struct {
	db *gorm.DB
}

func NewMetricsRepository(db *gorm.DB) *MetricsRepository {
	return &MetricsRepository{db: db}
}

func (r *MetricsRepository) GetByUserIDAndYear(ctx context.Context, user domain.User, year int) (*domain.YearMetrics, error) {
	yearMetrics := &domain.YearMetrics{}

	var err error

	maxDate := time.Date(year+1, time.January, 1, 0, 0, 0, 0, time.UTC)
	minDate := time.Date(year, time.January, 1, 0, 0, 0, 0, time.UTC)

	yearMetrics.UserID = user.ID
	yearMetrics.RegistrationDate = user.CreatedAt

	if yearMetrics.ViewsCount, err = r.getUserViewsCount(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	if yearMetrics.SearchesCount, err = r.getUserSearchesCount(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	if yearMetrics.FavoritesCount, err = r.getUserFavoritesCount(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	if yearMetrics.MessagesPeopleCount, err = r.getUserMessagesCount(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	if yearMetrics.ListingsCreatedCount, err = r.getUserCreatedListingsCount(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	if yearMetrics.BuysCount, err = r.getUserBuysCount(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	if yearMetrics.SellsCount, err = r.getUserSellsCount(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	if yearMetrics.SpentAmount, err = r.getUserSpentAmount(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	if yearMetrics.EarnedAmount, err = r.getUserEarnedAmount(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	if yearMetrics.MaxStreakDays, err = r.getUserMaxStreak(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	if yearMetrics.ActiveDays, err = r.getUserActiveDays(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	yearMetrics.YearsOnAvito = int64(year - user.CreatedAt.Year())

	var maxPrice *int64
	var minPrice *int64

	if maxPrice, minPrice, err = r.getUserMaxAndMinPrice(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	yearMetrics.PriceMax = maxPrice
	yearMetrics.PriceMin = minPrice

	yearMetrics.SellerRating, err = r.getUserSellerRating(ctx, user, maxDate, minDate)

	if err != nil {
		return nil, err
	}

	yearMetrics.FavoriteBuyCategory, err = r.getUserFavoriteBuyCategory(ctx, user, maxDate, minDate)

	if err != nil {
		return nil, err
	}

	yearMetrics.FavoriteSellCategory, err = r.getUserFavoriteSellCategory(ctx, user, maxDate, minDate)

	if err != nil {
		return nil, err
	}

	yearMetrics.MostViewedListing, err = r.getUserMostViewedListing(ctx, user, maxDate, minDate)

	if err != nil {
		return nil, err
	}

	yearMetrics.BestReviewReceived, err = r.getUserBestReviewReceived(ctx, user, maxDate, minDate)

	if err != nil {
		return nil, err
	}

	yearMetrics.BestReviewLeft, err = r.getUserBestReviewLeft(ctx, user, maxDate, minDate)

	if err != nil {
		return nil, err
	}

	yearMetrics.ViewsByCategory, err = r.getUserViewsByCategory(ctx, user, maxDate, minDate)

	if err != nil {
		return nil, err
	}

	yearMetrics.SearchesByCategory, err = r.getUserSearchesByCategory(ctx, user, maxDate, minDate)

	if err != nil {
		return nil, err
	}

	yearMetrics.Favorites, err = r.getUserFavorites(ctx, user, maxDate, minDate)

	if err != nil {
		return nil, err
	}

	yearMetrics.ListingViewCounts, err = r.getUserListingCount(ctx, user, maxDate, minDate)

	if err != nil {
		return nil, err
	}

	yearMetrics.MessagedListingIDs, err = r.getUserMessagedListingIDs(ctx, user, maxDate, minDate)

	if err != nil {
		return nil, err
	}

	if yearMetrics.OwnListings, err = r.getUserOwnListings(ctx, user, maxDate, minDate); err != nil {
		return nil, err
	}

	if yearMetrics.YearAchievements, err = r.getUserAchievements(ctx, user.ID, maxDate, minDate); err != nil {
		return nil, err
	}

	return yearMetrics, nil
}

func (r *MetricsRepository) getUserViewsCount(ctx context.Context, user domain.User, maxDate, minDate time.Time) (int64, error) {
	var viewsCount int64

	err := r.db.
		WithContext(ctx).
		Table("listing_views").
		Where("listing_views.user_id = ?", user.ID).
		Where("listing_views.created_at < ?", maxDate).
		Where("listing_views.created_at >= ?", minDate).
		Count(&viewsCount).
		Error

	if err != nil {
		return 0, fmt.Errorf("get user views count: %w", err)
	}

	return viewsCount, nil
}

func (r *MetricsRepository) getUserSearchesCount(ctx context.Context, user domain.User, maxDate, minDate time.Time) (int64, error) {
	var searchesCount int64

	err := r.db.
		WithContext(ctx).
		Table("user_searches").
		Where("user_searches.user_id = ?", user.ID).
		Where("user_searches.created_at < ?", maxDate).
		Where("user_searches.created_at >= ?", minDate).
		Count(&searchesCount).
		Error

	if err != nil {
		return 0, fmt.Errorf("get user searches count: %w", err)
	}

	return searchesCount, nil
}

func (r *MetricsRepository) getUserFavoritesCount(ctx context.Context, user domain.User, maxDate, minDate time.Time) (int64, error) {
	var favoritesCount int64

	err := r.db.
		WithContext(ctx).
		Table("favorite_listings").
		Where("favorite_listings.user_id = ?", user.ID).
		Where("favorite_listings.created_at < ?", maxDate).
		Where("favorite_listings.created_at >= ?", minDate).
		Count(&favoritesCount).
		Error

	if err != nil {
		return 0, fmt.Errorf("get user favorites count: %w", err)
	}

	return favoritesCount, nil
}

func (r *MetricsRepository) getUserMessagesCount(ctx context.Context, user domain.User, maxDate, minDate time.Time) (int64, error) {
	var messagesCount int64

	err := r.db.
		WithContext(ctx).
		Table("conversations").
		Where("conversations.initiator_id = ?", user.ID).
		Where("conversations.created_at < ?", maxDate).
		Where("conversations.created_at >= ?", minDate).
		Count(&messagesCount).
		Error

	if err != nil {
		return 0, fmt.Errorf("get user conversation count: %w", err)
	}

	return messagesCount, nil
}

func (r *MetricsRepository) getUserCreatedListingsCount(ctx context.Context, user domain.User, maxDate, minDate time.Time) (int64, error) {
	var listingsCount int64

	err := r.db.
		WithContext(ctx).
		Table("listings").
		Where("listings.seller_id = ?", user.ID).
		Where("listings.created_at < ?", maxDate).
		Where("listings.created_at >= ?", minDate).
		Count(&listingsCount).
		Error

	if err != nil {
		return 0, fmt.Errorf("get user listings count: %w", err)
	}

	return listingsCount, nil
}

func (r *MetricsRepository) getUserBuysCount(ctx context.Context, user domain.User, maxDate, minDate time.Time) (int64, error) {
	var buysCount int64

	err := r.db.
		WithContext(ctx).
		Table("deals").
		Where("deals.buyer_id = ?", user.ID).
		Where("deals.completed_at < ?", maxDate).
		Where("deals.completed_at >= ?", minDate).
		Where("deals.status = ?", domain.DealStatusCompleted).
		Count(&buysCount).
		Error

	if err != nil {
		return 0, fmt.Errorf("get user buys count: %w", err)
	}

	return buysCount, nil
}

func (r *MetricsRepository) getUserSellsCount(ctx context.Context, user domain.User, maxDate, minDate time.Time) (int64, error) {
	var sellsCount int64

	err := r.db.
		WithContext(ctx).
		Table("listings").
		Joins("JOIN deals ON listings.ID = deals.listing_id").
		Where("listings.seller_id = ?", user.ID).
		Where("deals.completed_at < ?", maxDate).
		Where("deals.completed_at >= ?", minDate).
		Where("deals.status = ?", domain.DealStatusCompleted).
		Count(&sellsCount).
		Error

	if err != nil {
		return 0, fmt.Errorf("get user sells count: %w", err)
	}

	return sellsCount, nil
}

func (r *MetricsRepository) getUserSpentAmount(ctx context.Context, user domain.User, maxDate, minDate time.Time) (*int64, error) {
	var res struct {
		Amount *int64 `gorm:"column:amount"`
	}

	err := r.db.
		WithContext(ctx).
		Table("deals").
		Select("SUM(deals.price)").
		Where("deals.buyer_id = ?", user.ID).
		Where("deals.completed_at < ?", maxDate).
		Where("deals.completed_at >= ?", minDate).
		Where("deals.status = ?", domain.DealStatusCompleted).
		Scan(&res).
		Error

	if err != nil {
		return nil, fmt.Errorf("get user spent amount: %w", err)
	}

	return res.Amount, nil
}

func (r *MetricsRepository) getUserEarnedAmount(ctx context.Context, user domain.User, maxDate, minDate time.Time) (*int64, error) {
	var res struct {
		Amount *int64 `gorm:"column:amount"`
	}

	err := r.db.
		WithContext(ctx).
		Table("listings").
		Joins("JOIN deals ON listings.ID = deals.listing_id").
		Select("SUM(deals.price)").
		Where("listings.seller_id = ?", user.ID).
		Where("deals.completed_at < ?", maxDate).
		Where("deals.completed_at >= ?", minDate).
		Where("deals.status = ?", domain.DealStatusCompleted).
		Scan(&res).
		Error

	if err != nil {
		return nil, fmt.Errorf("get user earned amount: %w", err)
	}

	return res.Amount, nil
}

func (r *MetricsRepository) getUserMaxStreak(ctx context.Context, user domain.User, maxDate, minDate time.Time) (int64, error) {
	var maxStreak int64

	query := `
		WITH unique_dates AS (
			SELECT DISTINCT DATE(started_at) AS visit_date
			FROM user_sessions
			WHERE user_id = ? AND started_at < ? AND started_at >= ?
		),
		ranked_dates AS (
			SELECT 
				visit_date,
				visit_date - CAST(ROW_NUMBER() OVER (ORDER BY visit_date) AS INT) * INTERVAL '1 day' AS base_date
			FROM unique_dates
		),
		streak_groups AS (
			SELECT COUNT(*) AS streak_len
			FROM ranked_dates
			GROUP BY base_date
		)
		SELECT COALESCE(MAX(streak_len), 0) FROM streak_groups
	`

	err := r.db.
		WithContext(ctx).
		Raw(query, user.ID, maxDate, minDate).
		Scan(&maxStreak).
		Error

	if err != nil {
		return 0, fmt.Errorf("get user max streak: %w", err)
	}

	return maxStreak, nil
}

func (r *MetricsRepository) getUserActiveDays(ctx context.Context, user domain.User, maxDate, minDate time.Time) (int64, error) {
	var activeDays int64

	err := r.db.
		WithContext(ctx).
		Table("user_sessions").
		Select("COUNT(DISTINCT DATE(started_at))").
		Where("user_id = ? AND started_at < ? AND started_at >= ?", user.ID, maxDate, minDate).
		Scan(&activeDays).
		Error

	if err != nil {
		return 0, fmt.Errorf("get user active days: %w", err)
	}

	return activeDays, nil
}

func (r *MetricsRepository) getUserMaxAndMinPrice(ctx context.Context, user domain.User, maxDate, minDate time.Time) (*int64, *int64, error) {
	var res struct {
		MaxPrice *int64 `gorm:"column:max_price"`
		MinPrice *int64 `gorm:"column:min_price"`
	}

	err := r.db.
		WithContext(ctx).
		Table("deals").
		Select("MAX(price) AS max_price, MIN(price) AS min_price").
		Where("deals.buyer_id = ?", user.ID).
		Where("deals.completed_at < ?", maxDate).
		Where("deals.completed_at >= ?", minDate).
		Where("deals.status = ?", domain.DealStatusCompleted).
		Scan(&res).
		Error

	if err != nil {
		return nil, nil, fmt.Errorf("get user max price: %w", err)
	}

	return res.MaxPrice, res.MinPrice, nil
}

func (r *MetricsRepository) getUserSellerRating(ctx context.Context, user domain.User, maxDate, minDate time.Time) (*float64, error) {
	var res struct {
		Rating *float64 `gorm:"column:rating"`
	}

	err := r.db.
		WithContext(ctx).
		Table("reviews").
		Select("AVG(reviews.rating) AS rating").
		Where("reviews.reviewee_id = ?", user.ID).
		Where("reviews.created_at < ?", maxDate).
		Where("reviews.created_at >= ?", minDate).
		Scan(&res).
		Error

	if err != nil {
		return nil, fmt.Errorf("get user seller rating: %w", err)
	}

	return res.Rating, nil
}

func (r *MetricsRepository) getUserFavoriteBuyCategory(ctx context.Context, user domain.User, maxDate, minDate time.Time) (*domain.YearMetricsCategory, error) {
	var favoriteBuyCategory domain.YearMetricsCategory

	res := r.db.
		WithContext(ctx).
		Table("categories").
		Joins("JOIN listings ON categories.ID = listings.category_id").
		Joins("JOIN deals ON listings.ID = deals.listing_id").
		Select("categories.ID, categories.name").
		Where("deals.completed_at < ?", maxDate).
		Where("deals.completed_at >= ?", minDate).
		Where("deals.status = ?", domain.DealStatusCompleted).
		Where("deals.buyer_id = ?", user.ID).
		Group("categories.ID, categories.name").
		Order("COUNT(deals.ID) DESC").
		Limit(1).
		Scan(&favoriteBuyCategory)

	if res.Error != nil {
		return nil, fmt.Errorf("get user favorite buy category: %w", res.Error)
	}

	if res.RowsAffected == 0 {
		return nil, nil
	}

	return &favoriteBuyCategory, nil
}

func (r *MetricsRepository) getUserFavoriteSellCategory(ctx context.Context, user domain.User, maxDate, minDate time.Time) (*domain.YearMetricsCategory, error) {
	var favoriteSellCategory domain.YearMetricsCategory

	res := r.db.
		WithContext(ctx).
		Table("categories").
		Joins("JOIN listings ON categories.id = listings.category_id").
		Joins("JOIN deals ON listings.id = deals.listing_id").
		Select("categories.id, categories.name").
		Where("deals.completed_at < ?", maxDate).
		Where("deals.completed_at >= ?", minDate).
		Where("deals.status = ?", domain.DealStatusCompleted).
		Where("listings.seller_id = ?", user.ID).
		Group("categories.id").
		Order("COUNT(deals.id) DESC").
		Limit(1).
		Scan(&favoriteSellCategory)

	if res.Error != nil {
		return nil, fmt.Errorf("get user favorite seller category: %w", res.Error)
	}

	if res.RowsAffected == 0 {
		return nil, nil
	}

	return &favoriteSellCategory, nil
}

func (r *MetricsRepository) getUserMostViewedListing(ctx context.Context, user domain.User, maxDate, minDate time.Time) (*domain.YearMetricsListing, error) {
	var mostViewedListing domain.YearMetricsListing

	res := r.db.
		WithContext(ctx).
		Table("listing_views").
		Joins("JOIN listings ON listings.ID = listing_views.listing_id").
		Select("listings.ID, listings.name, listings.city, listings.image_url, COUNT(listing_views.ID) AS views_count").
		Where("listing_views.user_id = ?", user.ID).
		Where("listing_views.created_at < ?", maxDate).
		Where("listing_views.created_at >= ?", minDate).
		Group("listings.ID").
		Order("COUNT(listing_views.ID) DESC").
		Limit(1).
		Scan(&mostViewedListing)

	if res.Error != nil {
		return nil, fmt.Errorf("get user most viewed listing: %w", res.Error)
	}

	if res.RowsAffected == 0 {
		return nil, nil
	}

	return &mostViewedListing, nil
}

func (r *MetricsRepository) getUserBestReviewReceived(ctx context.Context, user domain.User, maxDate, minDate time.Time) (*domain.YearMetricsReview, error) {
	var review domain.YearMetricsReview

	res := r.db.
		WithContext(ctx).
		Table("reviews").
		Where("reviews.reviewee_id = ?", user.ID).
		Where("reviews.created_at < ?", maxDate).
		Where("reviews.created_at >= ?", minDate).
		Order("reviews.rating DESC").
		Limit(1).
		Scan(&review)

	if res.Error != nil {
		return nil, fmt.Errorf("get user best review recieved: %w", res.Error)
	}

	if res.RowsAffected == 0 {
		return nil, nil
	}

	return &review, nil
}

func (r *MetricsRepository) getUserBestReviewLeft(ctx context.Context, user domain.User, maxDate, minDate time.Time) (*domain.YearMetricsReview, error) {
	var review domain.YearMetricsReview

	res := r.db.
		WithContext(ctx).
		Table("reviews").
		Where("reviews.reviewer_id = ?", user.ID).
		Where("reviews.created_at < ?", maxDate).
		Where("reviews.created_at >= ?", minDate).
		Order("reviews.rating DESC").
		Limit(1).
		Scan(&review)

	if res.Error != nil {
		return nil, fmt.Errorf("get user best review left: %w", res.Error)
	}

	if res.RowsAffected == 0 {
		return nil, nil
	}

	return &review, nil
}

func (r *MetricsRepository) getUserViewsByCategory(ctx context.Context, user domain.User, maxDate, minDate time.Time) ([]domain.YearMetricsViews, error) {
	categories := []domain.YearMetricsViews{}

	err := r.db.
		WithContext(ctx).
		Table("listing_views").
		Joins("JOIN listings ON listings.ID = listing_views.listing_id").
		Joins("JOIN categories ON categories.ID = listings.category_id").
		Select("categories.ID AS category_id, categories.name AS category_name, COUNT(listing_views.ID) AS views").
		Where("listing_views.user_id = ?", user.ID).
		Where("listing_views.created_at < ?", maxDate).
		Where("listing_views.created_at >= ?", minDate).
		Group("categories.ID, categories.name").
		Order("COUNT(listing_views.ID) DESC").
		Scan(&categories). // mb add limit
		Error

	if err != nil {
		return nil, fmt.Errorf("get user views by category: %w", err)
	}

	return categories, nil
}

func (r *MetricsRepository) getUserSearchesByCategory(ctx context.Context, user domain.User, maxDate, minDate time.Time) ([]domain.YearMetricsSearches, error) {
	categories := []domain.YearMetricsSearches{}

	err := r.db.
		WithContext(ctx).
		Table("user_searches").
		Joins("JOIN categories ON user_searches.category_id = categories.ID").
		Select("categories.ID AS category_id, categories.name AS category_name, COUNT(user_searches.ID) AS searches").
		Where("user_searches.user_id = ?", user.ID).
		Where("user_searches.created_at < ?", maxDate).
		Where("user_searches.created_at >= ?", minDate).
		Group("categories.ID, categories.name"). // mb limit
		Order("COUNT(user_searches.ID) DESC").
		Scan(&categories).
		Error

	if err != nil {
		return nil, fmt.Errorf("get user searches by category: %w", err)
	}

	return categories, nil
}

func (r *MetricsRepository) getUserFavorites(ctx context.Context, user domain.User, maxDate, minDate time.Time) ([]domain.YearMetricsFavorite, error) {
	categories := []domain.YearMetricsFavorite{}

	err := r.db.
		WithContext(ctx).
		Table("favorite_listings").
		Joins("JOIN listings ON listings.ID = favorite_listings.listing_id").
		Joins("JOIN categories ON categories.ID = listings.category_id").
		Select("favorite_listings.listing_id, categories.ID AS category_id").
		Where("favorite_listings.user_id = ?", user.ID).
		Where("favorite_listings.created_at < ?", maxDate).
		Where("favorite_listings.created_at >= ?", minDate).
		Group("favorite_listings.listing_id, categories.ID").
		Scan(&categories).
		Error

	if err != nil {
		return nil, fmt.Errorf("get user favorites: %w", err)
	}

	return categories, nil
}

func (r *MetricsRepository) getUserListingCount(ctx context.Context, user domain.User, maxDate, minDate time.Time) ([]domain.YearMetricsListingCount, error) {
	listingCount := []domain.YearMetricsListingCount{}

	err := r.db.
		WithContext(ctx).
		Table("listing_views").
		Joins("JOIN listings ON listings.ID = listing_views.listing_id").
		Joins("JOIN categories ON categories.ID = listings.category_id").
		Select("listing_views.listing_id, categories.ID AS category_id, COUNT(listing_views.ID) AS views").
		Where("listing_views.created_at < ?", maxDate).
		Where("listing_views.created_at >= ?", minDate).
		Where("listing_views.user_id = ?", user.ID).
		Group("listing_views.listing_id, categories.ID").
		Order("COUNT(listing_views.ID) DESC"). // mb limit
		Scan(&listingCount).
		Error

	if err != nil {
		return nil, fmt.Errorf("get user listing count: %w", err)
	}

	return listingCount, nil
}

func (r *MetricsRepository) getUserMessagedListingIDs(ctx context.Context, user domain.User, maxDate, minDate time.Time) ([]int64, error) {
	var ids []int64

	err := r.db.
		WithContext(ctx).
		Table("conversations").
		Joins("JOIN listings ON listings.ID = conversations.listing_id").
		Select("listings.ID").
		Where("conversations.initiator_id = ?", user.ID).
		Where("conversations.created_at < ?", maxDate).
		Where("conversations.created_at >= ?", minDate).
		Where("listings.status = ?", domain.ListingStatusActive).
		Group("listings.ID").
		Scan(&ids).
		Error

	if err != nil {
		return nil, fmt.Errorf("get user listing ids: %w", err)
	}

	return ids, nil
}

func (r *MetricsRepository) getUserOwnListings(ctx context.Context, user domain.User, maxDate, minDate time.Time) ([]domain.YearMetricsOwnListing, error) {
	listings := []domain.YearMetricsOwnListing{}

	err := r.db.
		WithContext(ctx).
		Table("listings").
		Joins("JOIN categories ON categories.ID = listings.category_id").
		Joins("LEFT JOIN listing_views ON listing_views.listing_id = listings.ID AND listing_views.created_at >= ? AND listing_views.created_at < ?", minDate, maxDate).
		Select("listings.ID, categories.ID AS category_id, listings.status, listings.updated_at, COUNT(listing_views.ID) AS views_count").
		Where("listings.created_at < ?", maxDate).
		Where("listings.created_at >= ?", minDate).
		Where("listings.seller_id = ?", user.ID).
		Group("listings.ID, categories.ID, listings.status, listings.updated_at").
		Scan(&listings).
		Error

	if err != nil {
		return nil, fmt.Errorf("get user listings: %w", err)
	}

	return listings, nil
}

func (r *MetricsRepository) getUserAchievementsByIDAndYear(ctx context.Context, userID int64, maxDate time.Time, minDate time.Time) ([]domain.YearAchievement, error) {
	var achievements []domain.YearAchievement

	res := r.db.
		WithContext(ctx).
		Table("achievements").
		Joins("JOIN user_achievements ON user_achievements.achievement_id = achievements.id").
		Select("achievements.*").
		Where("user_achievements.user_id = ?", userID).
		Where("user_achievements.created_at < ?", maxDate).
		Where("user_achievements.created_at >= ?", minDate).
		Scan(&achievements)

	if res.Error != nil {
		return nil, fmt.Errorf("get achievements: %w", res.Error)
	}

	return achievements, nil
}
