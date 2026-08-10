package entity

import (
	"time"

	"github.com/shopspring/decimal"
)

type UserSearch struct {
	ID         int64
	UserID     int64
	CategoryID int64
	Query      string
	MinPrice   *decimal.Decimal
	MaxPrice   *decimal.Decimal
	CreatedAt  time.Time

	User     User
	Category Category
}
