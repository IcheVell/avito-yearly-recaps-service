package engine

import (
	"v1/internal/domain/recap"
)

const achievementsNum = 3

func ResolveAchievements(metrics recap.YearMetrics) []recap.RecapAchievement {
	achievements := metrics.YearAchievements
	if len(metrics.YearAchievements) > achievementsNum {
		achievements = metrics.YearAchievements[:achievementsNum]
	}

	result := make([]recap.RecapAchievement, len(achievements))
	for i, achievement := range achievements {
		result[i] = recap.RecapAchievement{
			Code:        achievement.Code,
			Name:        achievement.Name,
			Description: achievement.Description,
			ImageURL:    achievement.ImageURL,
		}
	}

	return result
}
