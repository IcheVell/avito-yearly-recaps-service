package entity

import (
	"time"

	"github.com/shopspring/decimal"
)

type DealStatus string

const (
	DealStatusPending   DealStatus = "pending"
	DealStatusCompleted DealStatus = "completed"
	DealStatusCancelled DealStatus = "cancelled"
)

type Deal struct {
	ID          int64
	BuyerID     int64
	ListingID   int64
	Status      DealStatus
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Price       decimal.Decimal
	CompletedAt *time.Time

	Buyer   User
	Listing Listing
}
