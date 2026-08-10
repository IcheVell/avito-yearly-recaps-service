package entity

import "time"

type ListingView struct {
	ID        int64
	UserID    int64
	ListingID int64
	CreatedAt time.Time

	User    User
	Listing Listing
}
