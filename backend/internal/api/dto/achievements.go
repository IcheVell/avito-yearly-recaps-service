package dto

import (
	"sort"
	"time"
	"v1/internal/domain"
)

type UserAchievementsResponse struct {
	Items []UserAchievementResponse `json:"items"`
}

type UserAchievementResponse struct {
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	EarnedAt    time.Time `json:"earnedAt"`
}

func NewUserAchievementsResponse(achievements []domain.YearlyRecapAchievement) UserAchievementsResponse {
	sorted := append([]domain.YearlyRecapAchievement(nil), achievements...)
	sort.SliceStable(sorted, func(i, j int) bool {
		return sorted[i].ReceivedDate.After(sorted[j].ReceivedDate)
	})

	items := make([]UserAchievementResponse, 0, len(sorted))
	for _, achievement := range sorted {
		items = append(items, UserAchievementResponse{
			Name:        achievement.Achievement.Name,
			Description: achievement.Achievement.Description,
			EarnedAt:    achievement.ReceivedDate,
		})
	}

	return UserAchievementsResponse{Items: items}
}
