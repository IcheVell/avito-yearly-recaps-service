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

func NewUserAchievementsResponse(achievements []domain.UserAchievement) UserAchievementsResponse {
	sorted := append([]domain.UserAchievement(nil), achievements...)
	sort.SliceStable(sorted, func(i, j int) bool {
		return sorted[i].CreatedAt.After(sorted[j].CreatedAt)
	})

	items := make([]UserAchievementResponse, 0, len(sorted))
	for _, achievement := range sorted {
		items = append(items, UserAchievementResponse{
			Code:        achievement.Achievement.Code,
			Name:        achievement.Achievement.Name,
			Description: achievement.Achievement.Description,
			EarnedAt:    achievement.CreatedAt,
		})
	}

	return UserAchievementsResponse{Items: items}
}
