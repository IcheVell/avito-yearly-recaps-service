package engine

import (
	"time"
	"v1/internal/domain/recap"
)

func Generate(yearMetrics recap.YearMetrics) (recap.Recap, error) {
	role, err := ResolveRole(yearMetrics)
	if err != nil {
		return recap.Recap{}, err
	}

	metrics, err := ResolveMetrics(yearMetrics)
	if err != nil {
		return recap.Recap{}, err
	}

	action, err := ResolveAction(yearMetrics)
	if err != nil {
		return recap.Recap{}, err
	}

	achievements := ResolveAchievements(yearMetrics)

	now := time.Now()
	past := now.AddDate(0, -1, 0)
	year := past.Year()

	recap := recap.Recap{
		UserID:       yearMetrics.UserID,
		Year:         year,
		CreatedAt:    time.Now().UTC(),
		Role:         role,
		Metrics:      metrics,
		Action:       action,
		Achievements: achievements,
	}

	return recap, nil
}
