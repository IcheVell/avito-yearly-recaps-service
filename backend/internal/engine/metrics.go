package engine

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/rand/v2"
	"sort"
	"sync"

	"v1/catalog"
	"v1/internal/domain/recap"
)

type metricBuilder func(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error)

const (
	metricKindNumber      = "number"
	metricKindQualitative = "qualitative"
	metricKindComparison  = "comparison"

	desiredNumberMetrics      = 2
	desiredQualitativeMetrics = 1
	desiredComparisonMetrics  = 1
)

var builders = map[string]metricBuilder{
	"earned_amount":            buildEarnedAmount,
	"spent_amount":             buildSpentAmount,
	"max_streak_days":          buildMaxStreak,
	"active_days_number":       buildActiveDaysNumber,
	"viewed_listenings_number": buildViewedListeningsNumber,
	"favorite_buy_category":    buildFavoriteBuyCategory,
	"buy_category_comparison":  buildBuyCategoryComparison,
	"chats_people":             buildChatsPeople,
	"years_together":           buildYearsTogether,
	"seller_rating":            buildSellerRating,
	"best_received_review":     buildBestReceivedReview,
	"best_left_review":         buildBestLeftReview,
	"favorite_sell_category":   buildFavoriteSellCategory,
	"sells_count":              buildSellsCount,
	"buys_count":               buildBuysCount,
	"listings_created":         buildListingsCreated,
	"favorites_count":          buildFavoritesCount,
	"searches_count":           buildSearchesCount,
	"most_viewed_listing":      buildMostViewedListing,
	"price_range":              buildPriceRange,
	"buy_vs_sell":              buildBuyVsSell,
	"views_vs_favorites":       buildViewsVsFavorites,
}

func ResolveMetrics(m recap.YearMetrics) ([]recap.RecapMetric, error) {
	copies, err := loadMetricsCopies()
	if err != nil {
		return nil, err
	}

	var allowedBuilders []string
	if m.EarnedAmount != nil {
		allowedBuilders = append(allowedBuilders, "earned_amount")
	}
	if m.SpentAmount != nil {
		allowedBuilders = append(allowedBuilders, "spent_amount")
	}
	if m.MaxStreakDays > 0 {
		allowedBuilders = append(allowedBuilders, "max_streak_days")
	}
	if m.ActiveDays > 0 {
		allowedBuilders = append(allowedBuilders, "active_days_number")
	}
	if m.ViewsCount > 0 {
		allowedBuilders = append(allowedBuilders, "viewed_listenings_number")
	}
	if m.FavoriteBuyCategory != nil {
		allowedBuilders = append(allowedBuilders, "favorite_buy_category")
	}
	if len(m.SearchesByCategory) >= 2 || len(m.ViewsByCategory) >= 2 {
		allowedBuilders = append(allowedBuilders, "buy_category_comparison")
	}
	if m.MessagesPeopleCount > 0 {
		allowedBuilders = append(allowedBuilders, "chats_people")
	}
	if m.YearsOnAvito > 0 {
		allowedBuilders = append(allowedBuilders, "years_together")
	}
	if m.SellerRating != nil {
		allowedBuilders = append(allowedBuilders, "seller_rating")
	}
	if m.BestReviewReceived != nil {
		allowedBuilders = append(allowedBuilders, "best_received_review")
	}
	if m.BestReviewLeft != nil {
		allowedBuilders = append(allowedBuilders, "best_left_review")
	}
	if m.FavoriteSellCategory != nil {
		allowedBuilders = append(allowedBuilders, "favorite_sell_category")
	}
	if m.SellsCount > 0 {
		allowedBuilders = append(allowedBuilders, "sells_count")
	}
	if m.BuysCount > 0 {
		allowedBuilders = append(allowedBuilders, "buys_count")
	}
	if m.ListingsCreatedCount > 0 {
		allowedBuilders = append(allowedBuilders, "listings_created")
	}
	if m.FavoritesCount > 0 {
		allowedBuilders = append(allowedBuilders, "favorites_count")
	}
	if m.SearchesCount > 0 {
		allowedBuilders = append(allowedBuilders, "searches_count")
	}
	if m.MostViewedListing != nil {
		allowedBuilders = append(allowedBuilders, "most_viewed_listing")
	}
	if m.PriceMin != nil && m.PriceMax != nil {
		allowedBuilders = append(allowedBuilders, "price_range")
	}
	if m.BuysCount > 0 || m.SellsCount > 0 {
		allowedBuilders = append(allowedBuilders, "buy_vs_sell")
	}
	if m.ViewsCount > 0 && m.FavoritesCount > 0 {
		allowedBuilders = append(allowedBuilders, "views_vs_favorites")
	}

	typeBuckets := map[string][]string{
		metricKindNumber:      {},
		metricKindQualitative: {},
		metricKindComparison:  {},
	}
	for _, metricType := range allowedBuilders {
		copyStat, ok := copies[metricType]
		if !ok {
			continue
		}
		typeBuckets[copyStat.Kind] = append(typeBuckets[copyStat.Kind], metricType)
	}

	selected := make([]string, 0, desiredNumberMetrics+desiredQualitativeMetrics+desiredComparisonMetrics)
	selected = append(selected, pickN(typeBuckets[metricKindNumber], desiredNumberMetrics)...)
	selected = append(selected, pickN(typeBuckets[metricKindQualitative], desiredQualitativeMetrics)...)
	selected = append(selected, pickN(typeBuckets[metricKindComparison], desiredComparisonMetrics)...)

	metrics := make([]recap.RecapMetric, 0)
	for _, metricType := range selected {
		buildFn, ok := builders[metricType]
		if !ok {
			return nil, fmt.Errorf("builder for metric type %q not found", metricType)
		}
		metricCopy, ok := copies[metricType]
		if !ok {
			return nil, fmt.Errorf("copy for metric type %q not found", metricType)
		}

		metric, err := buildFn(m, metricCopy)
		if err != nil {
			return nil, err
		}
		metrics = append(metrics, metric)
	}

	return metrics, nil
}

func pickN[T any](slice []T, n int) []T {
	if n <= 0 || len(slice) == 0 {
		return []T{}
	}
	if len(slice) <= n {
		return slice
	}

	cp := make([]T, len(slice))
	copy(cp, slice)

	rand.Shuffle(len(cp), func(i, j int) {
		cp[i], cp[j] = cp[j], cp[i]
	})

	return cp[:n]
}

func buildMetric(
	metricType string,
	copy metricStats,
	value any,
	payload map[string]any,
) (recap.RecapMetric, error) {
	if len(copy.Texts) == 0 {
		return recap.RecapMetric{}, errors.New("no texts")
	}
	if len(copy.Highlights) == 0 {
		return recap.RecapMetric{}, errors.New("no highlights")
	}

	randomText := copy.Texts[rand.IntN(len(copy.Texts))]
	highlight := fmt.Sprintf(copy.Highlights[0], value)
	text := fmt.Sprintf(randomText, highlight)

	return recap.RecapMetric{
		Type:       metricType,
		Title:      copy.Title,
		Text:       text,
		Highlights: []string{highlight},
		Payload:    payload,
	}, nil
}

func buildEarnedAmount(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.EarnedAmount == nil {
		return recap.RecapMetric{}, errors.New("no earned amount for this year")
	}
	return buildMetric("earned_amount", copy, *m.EarnedAmount, map[string]any{
		"earnedAmount": *m.EarnedAmount,
	})
}

func buildSpentAmount(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.SpentAmount == nil {
		return recap.RecapMetric{}, errors.New("no spent amount for this year")
	}
	return buildMetric("spent_amount", copy, *m.SpentAmount, map[string]any{
		"spentAmount": *m.SpentAmount,
	})
}

func buildMaxStreak(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.MaxStreakDays <= 0 {
		return recap.RecapMetric{}, errors.New("max streak days must be greater than zero")
	}
	return buildMetric("max_streak_days", copy, m.MaxStreakDays, map[string]any{
		"maxStreakDays": m.MaxStreakDays,
	})
}

func buildActiveDaysNumber(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.ActiveDays <= 0 {
		return recap.RecapMetric{}, errors.New("active days must be greater than zero")
	}
	return buildMetric("active_days_number", copy, m.ActiveDays, map[string]any{
		"activeDays": m.ActiveDays,
	})
}

func buildViewedListeningsNumber(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.ViewsCount <= 0 {
		return recap.RecapMetric{}, errors.New("views count must be greater than zero")
	}
	return buildMetric("viewed_listenings_number", copy, m.ViewsCount, map[string]any{
		"viewsCount": m.ViewsCount,
	})
}

func buildFavoriteBuyCategory(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.FavoriteBuyCategory == nil {
		return recap.RecapMetric{}, errors.New("favorite buy category is nil")
	}
	return buildMetric("favorite_buy_category", copy, m.FavoriteBuyCategory.Name, map[string]any{
		"categoryId":   m.FavoriteBuyCategory.ID,
		"categoryName": m.FavoriteBuyCategory.Name,
	})
}

func buildBuyCategoryComparison(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if len(copy.Texts) == 0 {
		return recap.RecapMetric{}, errors.New("no texts")
	}
	if len(copy.Highlights) == 0 {
		return recap.RecapMetric{}, errors.New("no highlights")
	}

	type categoryPair struct {
		name  string
		count int
	}

	var pairs []categoryPair
	if len(m.SearchesByCategory) >= 2 {
		for _, c := range m.SearchesByCategory {
			pairs = append(pairs, categoryPair{name: c.CategoryName, count: c.Searches})
		}
	} else {
		for _, c := range m.ViewsByCategory {
			pairs = append(pairs, categoryPair{name: c.CategoryName, count: c.Views})
		}
	}

	if len(pairs) < 2 {
		return recap.RecapMetric{}, errors.New("not enough categories for comparison")
	}

	sort.Slice(pairs, func(i, j int) bool {
		return pairs[i].count > pairs[j].count
	})

	left := pairs[0]
	right := pairs[1]
	highlight := fmt.Sprintf(copy.Highlights[0], left.name, right.name)
	randomText := copy.Texts[rand.IntN(len(copy.Texts))]
	text := fmt.Sprintf(randomText, highlight)

	return recap.RecapMetric{
		Type:       "buy_category_comparison",
		Title:      copy.Title,
		Text:       text,
		Highlights: []string{highlight},
		Payload: map[string]any{
			"leftCategoryName":   left.name,
			"leftCategoryCount":  left.count,
			"rightCategoryName":  right.name,
			"rightCategoryCount": right.count,
		},
	}, nil
}

func buildChatsPeople(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.MessagesPeopleCount <= 0 {
		return recap.RecapMetric{}, errors.New("messages people count must be greater than zero")
	}
	return buildMetric("chats_people", copy, m.MessagesPeopleCount, map[string]any{
		"peopleCount": m.MessagesPeopleCount,
	})
}

func buildYearsTogether(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.YearsOnAvito <= 0 {
		return recap.RecapMetric{}, errors.New("years on Avito must be greater than zero")
	}
	return buildMetric("years_together", copy, m.YearsOnAvito, map[string]any{
		"yearsTogether": m.YearsOnAvito,
	})
}

func buildSellerRating(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.SellerRating == nil {
		return recap.RecapMetric{}, errors.New("seller rating is nil")
	}
	return buildMetric("seller_rating", copy, *m.SellerRating, map[string]any{
		"sellerRating": *m.SellerRating,
	})
}

func buildBestReceivedReview(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.BestReviewReceived == nil {
		return recap.RecapMetric{}, errors.New("best review received is nil")
	}
	return buildMetric("best_received_review", copy, m.BestReviewReceived.Text, map[string]any{
		"bestReceivedReview": m.BestReviewReceived.Text,
	})
}

func buildBestLeftReview(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.BestReviewLeft == nil {
		return recap.RecapMetric{}, errors.New("best review left is nil")
	}
	return buildMetric("best_left_review", copy, m.BestReviewLeft.Text, map[string]any{
		"bestLeftReview": m.BestReviewLeft.Text,
	})
}

func buildFavoriteSellCategory(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.FavoriteSellCategory == nil {
		return recap.RecapMetric{}, errors.New("favorite sell category is nil")
	}
	return buildMetric("favorite_sell_category", copy, m.FavoriteSellCategory.Name, map[string]any{
		"categoryId":   m.FavoriteSellCategory.ID,
		"categoryName": m.FavoriteSellCategory.Name,
	})
}

func buildSellsCount(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.SellsCount <= 0 {
		return recap.RecapMetric{}, errors.New("sells count must be greater than zero")
	}
	return buildMetric("sells_count", copy, m.SellsCount, map[string]any{
		"sellsCount": m.SellsCount,
	})
}

func buildBuysCount(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.BuysCount <= 0 {
		return recap.RecapMetric{}, errors.New("buys count must be greater than zero")
	}
	return buildMetric("buys_count", copy, m.BuysCount, map[string]any{
		"buysCount": m.BuysCount,
	})
}

func buildListingsCreated(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.ListingsCreatedCount <= 0 {
		return recap.RecapMetric{}, errors.New("listings created count must be greater than zero")
	}
	return buildMetric("listings_created", copy, m.ListingsCreatedCount, map[string]any{
		"listingsCreatedCount": m.ListingsCreatedCount,
	})
}

func buildFavoritesCount(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.FavoritesCount <= 0 {
		return recap.RecapMetric{}, errors.New("favorites count must be greater than zero")
	}
	return buildMetric("favorites_count", copy, m.FavoritesCount, map[string]any{
		"favoritesCount": m.FavoritesCount,
	})
}

func buildSearchesCount(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.SearchesCount <= 0 {
		return recap.RecapMetric{}, errors.New("searches count must be greater than zero")
	}
	return buildMetric("searches_count", copy, m.SearchesCount, map[string]any{
		"searchesCount": m.SearchesCount,
	})
}

func buildMostViewedListing(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.MostViewedListing == nil {
		return recap.RecapMetric{}, errors.New("most viewed listing is nil")
	}
	listing := m.MostViewedListing
	return buildMetric("most_viewed_listing", copy, listing.Name, map[string]any{
		"listingId":  listing.ID,
		"name":       listing.Name,
		"city":       listing.City,
		"imageUrl":   listing.ImageURL,
		"viewsCount": listing.ViewsCount,
	})
}

func buildPriceRange(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.PriceMin == nil || m.PriceMax == nil {
		return recap.RecapMetric{}, errors.New("price min/max is nil")
	}
	if len(copy.Texts) == 0 {
		return recap.RecapMetric{}, errors.New("no texts")
	}
	if len(copy.Highlights) == 0 {
		return recap.RecapMetric{}, errors.New("no highlights")
	}

	highlight := fmt.Sprintf(copy.Highlights[0], *m.PriceMin, *m.PriceMax)
	randomText := copy.Texts[rand.IntN(len(copy.Texts))]
	text := fmt.Sprintf(randomText, highlight)

	return recap.RecapMetric{
		Type:       "price_range",
		Title:      copy.Title,
		Text:       text,
		Highlights: []string{highlight},
		Payload: map[string]any{
			"priceMin": *m.PriceMin,
			"priceMax": *m.PriceMax,
		},
	}, nil
}

func buildBuyVsSell(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.BuysCount <= 0 && m.SellsCount <= 0 {
		return recap.RecapMetric{}, errors.New("no buys or sells for comparison")
	}
	if len(copy.Texts) == 0 {
		return recap.RecapMetric{}, errors.New("no texts")
	}
	if len(copy.Highlights) == 0 {
		return recap.RecapMetric{}, errors.New("no highlights")
	}

	var highlight string
	switch {
	case m.SellsCount > m.BuysCount:
		highlight = fmt.Sprintf(copy.Highlights[0], "продавал", "покупал")
	case m.BuysCount > m.SellsCount:
		highlight = fmt.Sprintf(copy.Highlights[0], "покупал", "продавал")
	default:
		if len(copy.Highlights) > 1 {
			highlight = copy.Highlights[1]
		} else {
			highlight = "покупал и продавал одинаково"
		}
	}

	randomText := copy.Texts[rand.IntN(len(copy.Texts))]
	text := fmt.Sprintf(randomText, highlight)

	return recap.RecapMetric{
		Type:       "buy_vs_sell",
		Title:      copy.Title,
		Text:       text,
		Highlights: []string{highlight},
		Payload: map[string]any{
			"buysCount":  m.BuysCount,
			"sellsCount": m.SellsCount,
		},
	}, nil
}

func buildViewsVsFavorites(m recap.YearMetrics, copy metricStats) (recap.RecapMetric, error) {
	if m.ViewsCount <= 0 || m.FavoritesCount <= 0 {
		return recap.RecapMetric{}, errors.New("need both views and favorites for comparison")
	}
	if len(copy.Texts) == 0 {
		return recap.RecapMetric{}, errors.New("no texts")
	}
	if len(copy.Highlights) == 0 {
		return recap.RecapMetric{}, errors.New("no highlights")
	}

	highlight := fmt.Sprintf(copy.Highlights[0], m.ViewsCount, m.FavoritesCount)
	randomText := copy.Texts[rand.IntN(len(copy.Texts))]
	text := fmt.Sprintf(randomText, highlight)

	return recap.RecapMetric{
		Type:       "views_vs_favorites",
		Title:      copy.Title,
		Text:       text,
		Highlights: []string{highlight},
		Payload: map[string]any{
			"viewsCount":     m.ViewsCount,
			"favoritesCount": m.FavoritesCount,
		},
	}, nil
}

type metricStats struct {
	Kind       string         `json:"kind"`
	Title      string         `json:"title"`
	Texts      []string       `json:"text"`
	Highlights []string       `json:"highlights"`
	Payload    map[string]any `json:"payload"`
}

var (
	metricsCopies     map[string]metricStats
	metricsCopiesErr  error
	metricsCopiesOnce sync.Once
)

func loadMetricsCopies() (map[string]metricStats, error) {
	metricsCopiesOnce.Do(func() {
		metricsCopiesErr = json.Unmarshal(catalog.MetricsJSON, &metricsCopies)
	})
	return metricsCopies, metricsCopiesErr
}
