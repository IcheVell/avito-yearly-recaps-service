package entity

import "time"

type User struct {
	ID        int64
	Username  string
	ImageURL  string
	CreatedAt time.Time
	UpdatedAt time.Time
}
