package dto

import "v1/internal/domain/fortune"

type PredictionResponse struct {
	UserID int64  `json:"userId"`
	Year   int    `json:"year"`
	Title  string `json:"title"`
	Text   string `json:"text"`
	Type   string `json:"type"`
}

func NewPredictionResponse(fortune fortune.Fortune) PredictionResponse {
	return PredictionResponse{
		UserID: fortune.UserID,
		Year:   fortune.Year,
		Title:  fortune.Title,
		Text:   fortune.Text,
		Type:   fortune.Type,
	}
}
