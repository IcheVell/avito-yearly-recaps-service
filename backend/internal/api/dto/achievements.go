package dto

import (
	"sort"
	"strconv"
	"time"
	"v1/internal/domain/entity"
	"v1/internal/domain/recap"
)

type UserAchievementsResponse struct {
	Earned               []UserAchievementResponse     `json:"earned"`
	Locked               []AchievementResponse         `json:"locked"`
	AchievementsProgress []AchievementProgressResponse `json:"achievements_progress"`
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

type AchievementProgressResponse struct {
	Code       string                        `json:"code"`
	Type       string                        `json:"type"`
	IsComplete bool                          `json:"is_complete"`
	Progress   float64                       `json:"progress"`
	Condition  *ConditionProgressResponse    `json:"condition,omitempty"`
	Children   []AchievementProgressResponse `json:"children,omitempty"`
}

type ConditionProgressResponse struct {
	Metric   string `json:"metric"`
	Operator string `json:"operator"`
	Current  string `json:"current"`
	Target   string `json:"target"`
}

func NewUserAchievementsResponse(
	earned []entity.UserAchievement,
	locked []entity.Achievement,
	rulesEvaluations []*recap.AchievementEvaluation,
) UserAchievementsResponse {
	sortedEarned := append([]entity.UserAchievement(nil), earned...)
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

	achievementsProgress := make([]AchievementProgressResponse, 0, len(rulesEvaluations))
	for _, ruleEvaluation := range rulesEvaluations {
		achievementsProgress = append(achievementsProgress, NewAchievementProgressResponse(&ruleEvaluation.Evaluation, ruleEvaluation.Code))
	}

	return UserAchievementsResponse{
		Earned:               earnedItems,
		Locked:               lockedItems,
		AchievementsProgress: achievementsProgress,
	}
}

func NewAchievementProgressResponse(r *recap.RuleEvaluation, code string) AchievementProgressResponse {
	children := make([]AchievementProgressResponse, 0, len(r.Children))
	for _, child := range r.Children {
		children = append(children, NewAchievementProgressResponse(&child, code))
	}

	var condition *ConditionProgressResponse
	if r.Condition != nil {
		condition = &ConditionProgressResponse{
			Metric:   r.Condition.Metric,
			Operator: r.Condition.Operator,
			Current:  strconv.FormatFloat(r.Condition.Actual, 'f', -1, 64),
			Target:   strconv.FormatFloat(r.Condition.Expected, 'f', -1, 64),
		}
	}

	return AchievementProgressResponse{
		Code:       code,
		Type:       string(r.Type),
		IsComplete: r.IsComplete,
		Progress:   r.Progress,
		Condition:  condition,
		Children:   children,
	}
}
