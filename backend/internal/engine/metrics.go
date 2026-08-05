package engine

import (
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand/v2"
	"sync"
	"v1/internal/domain"
)

type metricBuilder func(m domain.YearMetrics, copy metricStats) (domain.RecapMetric, error)

var builders = map[string]metricBuilder{
	"earned_amount":            buildEarnedAmount,
	"spent_amount":             buildSpentAmount,
	"max_streak_days":          buildMaxStreak,
	"active_days_number":       buildActiveDaysNumber,
	"viewed_listenings_number": buildViewedListeningsNumber,
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

	selected := pickThree(allowedBuilders)

	metrics := make([]domain.RecapMetric, 0)
	for _, builder := range selected {
		metric, err := (builders[builder])(m, copies[builder])
		if err != nil {
			return nil, err
		}
		metrics = append(metrics, metric)
	}

	return metrics, nil
}

func pickThree[T any](slice []T) []T {
	if len(slice) <= 3 {
		return slice
	}

	cp := make([]T, len(slice))
	copy(cp, slice)

	rand.Shuffle(len(cp), func(i, j int) {
		cp[i], cp[j] = cp[j], cp[i]
	})

	return cp[:3]
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

type metricStats struct {
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
