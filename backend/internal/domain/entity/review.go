package entity

import "time"

type Review struct {
	ID         int64
	ReviewerID int64
	RevieweeID int64
	DealID     int64
	Text       string
	Rating     int
	CreatedAt  time.Time

	Reviewer User
	Reviewee User
	Deal     Deal
}
