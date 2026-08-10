package entity

import (
	"time"

	"gorm.io/datatypes"
)

type AchievementRule struct {
	AchievementID int64
	Rule          datatypes.JSON
	CreatedAt     time.Time
	UpdatedAt     time.Time

	Achievement Achievement
}
