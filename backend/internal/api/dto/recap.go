package dto

import (
	"encoding/json"
	"v1/internal/domain"
)

type GenerateRecapRequest struct {
	Year int `json:"year"`
}

type RecapResponse struct {
	ID        int64       `json:"id,omitempty"`
	ProfileID int64       `json:"profile_id"`
	Year      int         `json:"year,omitempty"`
	Cards     []RecapCard `json:"cards"`
}

type RecapCard struct {
	Type   string   `json:"type"`
	Title  string   `json:"title,omitempty"`
	Value  any      `json:"value,omitempty"`
	Text   string   `json:"text,omitempty"`
	Items  []string `json:"items,omitempty"`
	Action string   `json:"action,omitempty"`
}

func NewRecapResponse(recap domain.Recap) RecapResponse {
	cards := []RecapCard{
		{
			Type:  "intro",
			Title: "Привет! Вот твои итоги года",
		},
	}

	for _, metric := range recap.Metrics {
		cards = append(cards, newMetricCard(metric))
	}

	if recap.Role.Code != "" || recap.Role.Title != "" {
		cards = append(cards, RecapCard{
			Type:  "role",
			Value: recap.Role.Code,
			Title: recap.Role.Title,
			Text:  firstNonEmpty(recap.Role.Subtitle, recap.Role.Why),
		})
	}

	if len(recap.Achievements) > 0 {
		items := make([]string, 0, len(recap.Achievements))
		for _, achievement := range recap.Achievements {
			items = append(items, achievement.Name)
		}

		cards = append(cards, RecapCard{
			Type:  "achievements",
			Items: items,
		})
	}

	if recap.Action.Type != "" || recap.Action.Label != "" {
		cards = append(cards, RecapCard{
			Type:   "recommendation",
			Title:  recap.Action.Label,
			Text:   firstNonEmpty(recap.Action.Reason, recap.Action.Label),
			Action: recap.Action.Type,
		})
	}

	return RecapResponse{
		ID:        recap.ID,
		ProfileID: recap.UserID,
		Year:      recap.Year,
		Cards:     cards,
	}
}

func newMetricCard(metric domain.RecapMetric) RecapCard {
	if metric.Type == "comparison" {
		return RecapCard{
			Type:  "comparison",
			Title: metric.Title,
			Text:  metric.Text,
		}
	}

	if value, ok := numericMetricValue(metric.Payload); ok {
		return RecapCard{
			Type:  "number",
			Title: metric.Title,
			Value: value,
			Text:  metric.Text,
		}
	}

	return RecapCard{
		Type:  "text",
		Title: metric.Title,
		Text:  metric.Text,
	}
}

func numericMetricValue(payload map[string]any) (any, bool) {
	for _, key := range []string{
		"value",
		"earnedAmount",
		"spentAmount",
		"activeDays",
		"viewsCount",
		"favoritesCount",
		"searchesCount",
		"sellsCount",
		"buysCount",
		"maxStreakDays",
	} {
		value, ok := payload[key]
		if !ok {
			continue
		}

		switch typed := value.(type) {
		case int:
			return typed, true
		case int8:
			return typed, true
		case int16:
			return typed, true
		case int32:
			return typed, true
		case int64:
			return typed, true
		case uint:
			return typed, true
		case uint8:
			return typed, true
		case uint16:
			return typed, true
		case uint32:
			return typed, true
		case uint64:
			return typed, true
		case float32:
			return typed, true
		case float64:
			return typed, true
		case json.Number:
			return typed, true
		}
	}

	return nil, false
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}

	return ""
}
