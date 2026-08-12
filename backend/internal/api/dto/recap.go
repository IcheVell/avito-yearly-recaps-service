package dto

import (
	"time"
	"v1/internal/domain/recap"
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
	ListingIDs   []int64                      `json:"listingIds"`
	CategoryID   int64                        `json:"categoryId"`
	CategoryName string                       `json:"categoryName,omitempty"`
	Listings     []RecapActionListingResponse `json:"listings"`
}

type RecapActionListingResponse struct {
	ID           int64   `json:"id"`
	Name         string  `json:"name,omitempty"`
	ImageURL     string  `json:"imageUrl,omitempty"`
	Price        *int64  `json:"price"`
	Status       string  `json:"status,omitempty"`
	CategoryID   int64   `json:"categoryId,omitempty"`
	CategoryName string  `json:"categoryName,omitempty"`
	ViewsCount   int     `json:"viewsCount,omitempty"`
	UpdatedAt    *string `json:"updatedAt,omitempty"`
	City         string  `json:"city,omitempty"`
}

type RecapDebugResponse struct {
	GeneratorVersion string `json:"generatorVersion"`
	SeedProfile      string `json:"seedProfile"`
}

func NewRecapResponse(story recap.Recap) RecapResponse {
	return RecapResponse{
		ID:        story.ID,
		UserID:    story.UserID,
		Year:      story.Year,
		CreatedAt: story.CreatedAt,
		Role: RecapRoleResponse{
			Code:                 story.Role.Code,
			Name:                 story.Role.Name,
			Title:                story.Role.Title,
			Subtitle:             story.Role.Subtitle,
			Why:                  story.Role.Why,
			ActivitySharePercent: story.Role.ActivitySharePercent,
		},
		Metrics:      newRecapMetricResponses(story.Metrics),
		Achievements: newRecapAchievementResponses(story.Achievements),
		Action: RecapActionResponse{
			Type:   story.Action.Type,
			Label:  story.Action.Label,
			Reason: story.Action.Reason,
			Target: RecapActionTargetResponse{
				ListingIDs:   emptyInt64SliceIfNil(story.Action.Target.ListingIDs),
				CategoryID:   story.Action.Target.CategoryID,
				CategoryName: story.Action.Target.CategoryName,
				Listings:     newRecapActionListingResponses(story.Action.Target.Listings),
			},
		},
		Debug: RecapDebugResponse{
			GeneratorVersion: story.Debug.GeneratorVersion,
			SeedProfile:      story.Debug.SeedProfile,
		},
	}
}

func newRecapMetricResponses(metrics []recap.RecapMetric) []RecapMetricResponse {
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

func newRecapAchievementResponses(achievements []recap.RecapAchievement) []RecapAchievementResponse {
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

func newRecapActionListingResponses(
	listings []recap.RecapActionListing,
) []RecapActionListingResponse {
	if listings == nil {
		return []RecapActionListingResponse{}
	}

	items := make([]RecapActionListingResponse, 0, len(listings))
	for _, listing := range listings {
		var updatedAt *string
		if listing.UpdatedAt != nil {
			value := listing.UpdatedAt.UTC().Format(time.RFC3339)
			updatedAt = &value
		}

		items = append(items, RecapActionListingResponse{
			ID:           listing.ID,
			Name:         listing.Name,
			ImageURL:     listing.ImageURL,
			Price:        listing.Price,
			Status:       listing.Status,
			CategoryID:   listing.CategoryID,
			CategoryName: listing.CategoryName,
			ViewsCount:   listing.ViewsCount,
			UpdatedAt:    updatedAt,
			City:         listing.City,
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
