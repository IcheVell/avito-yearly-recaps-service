package domain

import "time"

type UserAchievement struct {
	UserID        int64 `gorm:"primaryKey;autoIncrement:false"`
	AchievementID int64 `gorm:"primaryKey;autoIncrement:false"`
	CreatedAt     time.Time

	YearlyRecap YearlyRecap
	Achievement Achievement
}
