package dto

import (
	"v1/internal/domain/recap"
)

type CreateShareRecapResponse struct {
	ShareURL string `json:"shareUrl"`
}

type ShareRecapResponse struct {
	Year         int                             `json:"year"`
	Role         ShareRecapRoleResponse          `json:"role"`
	Metrics      []ShareRecapMetricResponse      `json:"metrics"`
	Achievements []ShareRecapAchievementResponse `json:"achievements"`
}

type ShareRecapRoleResponse struct {
	Code  string `json:"code"`
	Name  string `json:"name"`
	Title string `json:"title"`
}

type ShareRecapMetricResponse struct {
	Type       string   `json:"type"`
	Title      string   `json:"title"`
	Text       string   `json:"text"`
	Highlights []string `json:"highlights"`
}

type ShareRecapAchievementResponse struct {
	Code     string `json:"code"`
	Name     string `json:"name"`
	ImageURL string `json:"imageUrl"`
}

func NewCreateShareRecapResponse(shareURL string) CreateShareRecapResponse {
	return CreateShareRecapResponse{ShareURL: shareURL}
}

func NewShareRecapResponse(shareStory recap.ShareRecap) ShareRecapResponse {
	role := ShareRecapRoleResponse{}
	if shareStory.Role != nil {
		role = ShareRecapRoleResponse{
			Code:  shareStory.Role.Code,
			Name:  shareStory.Role.Name,
			Title: shareStory.Role.Title,
		}
	}

	return ShareRecapResponse{
		Year:         shareStory.Year,
		Role:         role,
		Metrics:      newShareRecapMetricResponses(shareStory.Metrics),
		Achievements: newShareRecapAchievementResponses(shareStory.Achievements),
	}
}

func newShareRecapMetricResponses(metrics []recap.ShareRecapMetric) []ShareRecapMetricResponse {
	items := make([]ShareRecapMetricResponse, 0, len(metrics))
	for _, metric := range metrics {
		items = append(items, ShareRecapMetricResponse{
			Type:       metric.Type,
			Title:      metric.Title,
			Text:       metric.Text,
			Highlights: emptyStringSliceIfNil(metric.Highlights),
		})
	}

	return items
}

func newShareRecapAchievementResponses(achievements []recap.ShareRecapAchievement) []ShareRecapAchievementResponse {
	items := make([]ShareRecapAchievementResponse, 0, len(achievements))
	for _, achievement := range achievements {
		items = append(items, ShareRecapAchievementResponse{
			Code:     achievement.Code,
			Name:     achievement.Name,
			ImageURL: achievement.ImageURL,
		})
	}

	return items
}
