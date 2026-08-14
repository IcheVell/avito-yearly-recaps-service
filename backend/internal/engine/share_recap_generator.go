package engine

import (
	"errors"
	"v1/internal/domain/recap"
)

func GenerateShareRecap(yearRecap recap.Recap) (*recap.ShareRecap, error) {
	var shareRecap recap.ShareRecap

	if yearRecap.Role.Code == "" {
		return nil, errors.New("no role")
	}
	shareRecap.Role = &recap.ShareRecapRole{Code: yearRecap.Role.Code, Name: yearRecap.Role.Name, Title: yearRecap.Role.Title}

	shareRecap.Metrics = make([]recap.ShareRecapMetric, len(yearRecap.Metrics))
	for i, metric := range yearRecap.Metrics {
		shareRecap.Metrics[i] = recap.ShareRecapMetric{Type: metric.Type, Title: metric.Title, Text: metric.Text, Highlights: metric.Highlights}
	}

	shareRecap.Achievements = make([]recap.ShareRecapAchievement, len(yearRecap.Achievements))
	for i, achievement := range yearRecap.Achievements {
		shareRecap.Achievements[i] = recap.ShareRecapAchievement{Code: achievement.Code, Name: achievement.Name, ImageURL: achievement.ImageURL}
	}

	shareRecap.Year = yearRecap.Year

	return &shareRecap, nil
}
