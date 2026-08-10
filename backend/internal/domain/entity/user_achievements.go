package entity

import "time"

type UserAchievement struct {
	UserID        int64 `gorm:"primaryKey;autoIncrement:false"`
	AchievementID int64 `gorm:"primaryKey;autoIncrement:false"`
	CreatedAt     time.Time

	User        User
	Achievement Achievement
}
