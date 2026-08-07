package dto

import (
	"sort"
	"time"
	"v1/internal/domain"
)

type UserAchievementsResponse struct {
	Earned []UserAchievementResponse `json:"earned"`
	Locked []AchievementResponse     `json:"locked"`
}

type UserAchievementResponse struct {
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	EarnedAt    time.Time `json:"earnedAt"`
	ImageURL    string    `json:"imageUrl"`
}

type AchievementResponse struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageURL    string `json:"imageUrl"`
}

func NewUserAchievementsResponse(
	earned []domain.UserAchievement,
	locked []domain.Achievement,
) UserAchievementsResponse {
	sortedEarned := append([]domain.UserAchievement(nil), earned...)
	sort.SliceStable(sortedEarned, func(i, j int) bool {
		return sortedEarned[i].CreatedAt.After(sortedEarned[j].CreatedAt)
	})

	earnedItems := make([]UserAchievementResponse, 0, len(sortedEarned))
	for _, a := range sortedEarned {
		earnedItems = append(earnedItems, UserAchievementResponse{
			Code:        a.Achievement.Code,
			Name:        a.Achievement.Name,
			Description: a.Achievement.Description,
			EarnedAt:    a.CreatedAt,
			ImageURL:    a.Achievement.ImageURL,
		})
	}

	lockedItems := make([]AchievementResponse, 0, len(locked))
	for _, a := range locked {
		lockedItems = append(lockedItems, AchievementResponse{
			Code:        a.Code,
			Name:        a.Name,
			Description: a.Description,
			ImageURL:    a.ImageURL,
		})
	}

	return UserAchievementsResponse{
		Earned: earnedItems,
		Locked: lockedItems,
	}
}
