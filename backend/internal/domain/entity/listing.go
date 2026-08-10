package entity

import (
	"time"

	"github.com/shopspring/decimal"
)

type ListingStatus string

const (
	ListingStatusActive    ListingStatus = "active"
	ListingStatusSold      ListingStatus = "sold"
	ListingStatusCancelled ListingStatus = "cancelled"
)

type Listing struct {
	ID         int64
	SellerID   int64
	CategoryID int64
	ImageURL   string
	Name       string
	City       string
	Status     ListingStatus
	CreatedAt  time.Time
	UpdatedAt  time.Time
	Price      decimal.Decimal

	Seller   User
	Category Category
}
