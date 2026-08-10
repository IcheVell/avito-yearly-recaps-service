package entity

import "time"

type FavoriteListing struct {
	ListingID int64 `gorm:"primaryKey;autoIncrement:false"`
	UserID    int64 `gorm:"primaryKey;autoIncrement:false"`
	CreatedAt time.Time

	Listing Listing
	User    User
}
