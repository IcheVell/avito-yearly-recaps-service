package entity

import "time"

type Conversation struct {
	ID          int64
	InitiatorID int64
	ListingID   int64
	CreatedAt   time.Time

	Initiator User
	Listing   Listing
}
