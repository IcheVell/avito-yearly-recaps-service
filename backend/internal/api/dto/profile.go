package dto

import (
	"v1/internal/domain/entity"
)

type Profile struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	ImageURL string `json:"imageUrl"`
}

type ProfilesResponse struct {
	CurrentYear int       `json:"currentYear"`
	Items       []Profile `json:"items"`
}

func NewProfilesResponse(users []entity.User, currentYear int) ProfilesResponse {
	items := make([]Profile, 0, len(users))
	for _, user := range users {
		items = append(items, Profile{
			ID:       user.ID,
			Username: user.Username,
			ImageURL: user.ImageURL,
		})
	}

	return ProfilesResponse{
		CurrentYear: currentYear,
		Items:       items,
	}
}
