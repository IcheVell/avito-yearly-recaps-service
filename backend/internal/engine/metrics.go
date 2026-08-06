package engine

import (
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand/v2"
	"sort"
	"sync"
	"v1/internal/domain"
)

type metricBuilder func(m domain.YearMetrics, copy metricStats) (domain.RecapMetric, error)

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
}

func ResolveMetrics(m domain.YearMetrics) ([]domain.RecapMetric, error) {
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

	metrics := make([]domain.RecapMetric, 0)
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
) (domain.RecapMetric, error) {
	if len(copy.Texts) == 0 {
		return domain.RecapMetric{}, errors.New("no texts")
	}
	if len(copy.Highlights) == 0 {
		return domain.RecapMetric{}, errors.New("no highlights")
	}

	randomText := copy.Texts[rand.IntN(len(copy.Texts))]
	highlight := fmt.Sprintf(copy.Highlights[0], value)
	text := fmt.Sprintf(randomText, highlight)

	return domain.RecapMetric{
		Type:       metricType,
		Title:      copy.Title,
		Text:       text,
		Highlights: []string{highlight},
		Payload:    payload,
	}, nil
}

func buildEarnedAmount(m domain.YearMetrics, copy metricStats) (domain.RecapMetric, error) {
	if m.EarnedAmount == nil {
		return domain.RecapMetric{}, errors.New("no earned amount for this year")
	}
	return buildMetric("earned_amount", copy, *m.EarnedAmount, map[string]any{
		"earnedAmount": *m.EarnedAmount,
	})
}

func buildSpentAmount(m domain.YearMetrics, copy metricStats) (domain.RecapMetric, error) {
	if m.SpentAmount == nil {
		return domain.RecapMetric{}, errors.New("no spent amount for this year")
	}
	return buildMetric("spent_amount", copy, *m.SpentAmount, map[string]any{
		"spentAmount": *m.SpentAmount,
	})
}

func buildMaxStreak(m domain.YearMetrics, copy metricStats) (domain.RecapMetric, error) {
	if m.MaxStreakDays <= 0 {
		return domain.RecapMetric{}, errors.New("max streak days must be greater than zero")
	}
	return buildMetric("max_streak_days", copy, m.MaxStreakDays, map[string]any{
		"maxStreakDays": m.MaxStreakDays,
	})
}

func buildActiveDaysNumber(m domain.YearMetrics, copy metricStats) (domain.RecapMetric, error) {
	if m.ActiveDays <= 0 {
		return domain.RecapMetric{}, errors.New("active days must be greater than zero")
	}
	return buildMetric("active_days_number", copy, m.ActiveDays, map[string]any{
		"activeDays": m.ActiveDays,
	})
}

func buildViewedListeningsNumber(m domain.YearMetrics, copy metricStats) (domain.RecapMetric, error) {
	if m.ViewsCount <= 0 {
		return domain.RecapMetric{}, errors.New("views count must be greater than zero")
	}
	return buildMetric("viewed_listenings_number", copy, m.ViewsCount, map[string]any{
		"viewsCount": m.ViewsCount,
	})
}

func buildFavoriteBuyCategory(m domain.YearMetrics, copy metricStats) (domain.RecapMetric, error) {
	if m.FavoriteBuyCategory == nil {
		return domain.RecapMetric{}, errors.New("favorite buy category is nil")
	}
	return buildMetric("favorite_buy_category", copy, m.FavoriteBuyCategory.Name, map[string]any{
		"categoryId":   m.FavoriteBuyCategory.ID,
		"categoryName": m.FavoriteBuyCategory.Name,
	})
}

func buildBuyCategoryComparison(m domain.YearMetrics, copy metricStats) (domain.RecapMetric, error) {
	if len(copy.Texts) == 0 {
		return domain.RecapMetric{}, errors.New("no texts")
	}
	if len(copy.Highlights) == 0 {
		return domain.RecapMetric{}, errors.New("no highlights")
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
		return domain.RecapMetric{}, errors.New("not enough categories for comparison")
	}

	sort.Slice(pairs, func(i, j int) bool {
		return pairs[i].count > pairs[j].count
	})

	left := pairs[0]
	right := pairs[1]
	highlight := fmt.Sprintf(copy.Highlights[0], left.name, right.name)
	randomText := copy.Texts[rand.IntN(len(copy.Texts))]
	text := fmt.Sprintf(randomText, highlight)

	return domain.RecapMetric{
		Type:       "buy_category_comparison",
		Title:      copy.Title,
		Text:       text,
		Highlights: []string{highlight},
		Payload: map[string]any{
			"leftCategoryName":  left.name,
			"leftCategoryCount": left.count,
			"rightCategoryName": right.name,
			"rightCategoryCount": right.count,
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

//go:embed metrics.json
var metricsJSON []byte

var (
	metricsCopies     map[string]metricStats
	metricsCopiesErr  error
	metricsCopiesOnce sync.Once
)

func loadMetricsCopies() (map[string]metricStats, error) {
	metricsCopiesOnce.Do(func() {
		metricsCopiesErr = json.Unmarshal(metricsJSON, &metricsCopies)
	})
	return metricsCopies, metricsCopiesErr
}
