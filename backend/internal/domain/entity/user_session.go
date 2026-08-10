package entity

import "time"

type UserSession struct {
	ID        int64
	UserID    int64
	StartedAt time.Time
	EndedAt   *time.Time

	User User
}
