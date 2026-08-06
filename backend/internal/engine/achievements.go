package engine

import (
	"v1/internal/domain"
)

const achievementsNum = 3

func ResolveAchievements(metrics domain.YearMetrics) []domain.RecapAchievement {
	achievements := metrics.YearAchievements
	if len(metrics.YearAchievements) > achievementsNum {
		achievements = metrics.YearAchievements[:achievementsNum]
	}

	result := make([]domain.RecapAchievement, len(achievements))
	for i, achievement := range achievements {
		result[i] = domain.RecapAchievement{
			Code:        achievement.Code,
			Name:        achievement.Name,
			Description: achievement.Description,
			ImageURL:    achievement.ImageURL,
		}
	}

	return result
}
