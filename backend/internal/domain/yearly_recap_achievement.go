package domain

import "time"

type YearlyRecapAchievement struct {
	YearlyRecapID int64 `gorm:"primaryKey;autoIncrement:false"`
	AchievementID int64 `gorm:"primaryKey;autoIncrement:false"`
	ReceivedDate  time.Time

	YearlyRecap YearlyRecap
	Achievement Achievement
}
