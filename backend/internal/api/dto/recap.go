package dto

import (
	"time"
	"v1/internal/domain"
)

type GenerateRecapRequest struct {
	UserID int64 `json:"userId"`
	Year   int   `json:"year,omitempty"`
}

type RecapResponse struct {
	ID           int64                      `json:"id"`
	UserID       int64                      `json:"userId"`
	Year         int                        `json:"year"`
	CreatedAt    time.Time                  `json:"createdAt"`
	Role         RecapRoleResponse          `json:"role"`
	Metrics      []RecapMetricResponse      `json:"metrics"`
	Achievements []RecapAchievementResponse `json:"achievements"`
	Action       RecapActionResponse        `json:"action"`
	Debug        RecapDebugResponse         `json:"debug"`
}

type RecapRoleResponse struct {
	Code                 string `json:"code"`
	Name                 string `json:"name"`
	Title                string `json:"title"`
	Subtitle             string `json:"subtitle"`
	Why                  string `json:"why"`
	ActivitySharePercent int    `json:"activitySharePercent"`
}

type RecapMetricResponse struct {
	Type       string         `json:"type"`
	Title      string         `json:"title"`
	Text       string         `json:"text"`
	Highlights []string       `json:"highlights"`
	Payload    map[string]any `json:"payload"`
}

type RecapAchievementResponse struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageURL    string `json:"imageUrl"`
}

type RecapActionResponse struct {
	Type   string                    `json:"type"`
	Label  string                    `json:"label"`
	Reason string                    `json:"reason"`
	Target RecapActionTargetResponse `json:"target"`
}

type RecapActionTargetResponse struct {
	ListingIDs []int64 `json:"listingIds"`
	CategoryID int64   `json:"categoryId"`
}

type RecapDebugResponse struct {
	GeneratorVersion string `json:"generatorVersion"`
	SeedProfile      string `json:"seedProfile"`
}

func NewRecapResponse(recap domain.Recap) RecapResponse {
	return RecapResponse{
		ID:        recap.ID,
		UserID:    recap.UserID,
		Year:      recap.Year,
		CreatedAt: recap.CreatedAt,
		Role: RecapRoleResponse{
			Code:                 recap.Role.Code,
			Name:                 recap.Role.Name,
			Title:                recap.Role.Title,
			Subtitle:             recap.Role.Subtitle,
			Why:                  recap.Role.Why,
			ActivitySharePercent: recap.Role.ActivitySharePercent,
		},
		Metrics:      newRecapMetricResponses(recap.Metrics),
		Achievements: newRecapAchievementResponses(recap.Achievements),
		Action: RecapActionResponse{
			Type:   recap.Action.Type,
			Label:  recap.Action.Label,
			Reason: recap.Action.Reason,
			Target: RecapActionTargetResponse{
				ListingIDs: emptyInt64SliceIfNil(recap.Action.Target.ListingIDs),
				CategoryID: recap.Action.Target.CategoryID,
			},
		},
		Debug: RecapDebugResponse{
			GeneratorVersion: recap.Debug.GeneratorVersion,
			SeedProfile:      recap.Debug.SeedProfile,
		},
	}
}

func newRecapMetricResponses(metrics []domain.RecapMetric) []RecapMetricResponse {
	items := make([]RecapMetricResponse, 0, len(metrics))
	for _, metric := range metrics {
		items = append(items, RecapMetricResponse{
			Type:       metric.Type,
			Title:      metric.Title,
			Text:       metric.Text,
			Highlights: emptyStringSliceIfNil(metric.Highlights),
			Payload:    emptyMapIfNil(metric.Payload),
		})
	}

	return items
}

func newRecapAchievementResponses(achievements []domain.RecapAchievement) []RecapAchievementResponse {
	items := make([]RecapAchievementResponse, 0, len(achievements))
	for _, achievement := range achievements {
		items = append(items, RecapAchievementResponse{
			Code:        achievement.Code,
			Name:        achievement.Name,
			Description: achievement.Description,
			ImageURL:    achievement.ImageURL,
		})
	}

	return items
}

func emptyStringSliceIfNil(values []string) []string {
	if values == nil {
		return []string{}
	}

	return values
}

func emptyInt64SliceIfNil(values []int64) []int64 {
	if values == nil {
		return []int64{}
	}

	return values
}

func emptyMapIfNil(values map[string]any) map[string]any {
	if values == nil {
		return map[string]any{}
	}

	return values
}
