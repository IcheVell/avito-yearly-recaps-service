package entity

import (
	"time"

	"gorm.io/datatypes"
)

type ShareRecap struct {
	ID        int64
	Token     string
	UserID    int64
	Year      int
	RecapID   int64
	Payload   datatypes.JSON `gorm:"type:jsonb"`
	CreatedAt time.Time

	User  User
	Recap YearlyRecap
}
