package entity

import (
	"time"

	"gorm.io/datatypes"
)

type YearlyRecap struct {
	ID        int64
	UserID    int64
	Year      int
	CreatedAt time.Time
	Payload   datatypes.JSON `gorm:"type:jsonb"`

	User User
}
