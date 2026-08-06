package engine

import (
	"time"
	"v1/internal/domain"
)

func Generate(yearMetrics domain.YearMetrics) (domain.Recap, error) {
	role, err := ResolveRole(yearMetrics)
	if err != nil {
		return domain.Recap{}, err
	}

	metrics, err := ResolveMetrics(yearMetrics)
	if err != nil {
		return domain.Recap{}, err
	}

	action, err := ResolveAction(yearMetrics, role.Code)
	if err != nil {
		return domain.Recap{}, err
	}

	achievements := ResolveAchievements(yearMetrics)

	now := time.Now()
	past := now.AddDate(0, -1, 0)
	year := past.Year()

	recap := domain.Recap{
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
