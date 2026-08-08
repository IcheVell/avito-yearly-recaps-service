package domain

type UserStats struct {
	UserID             int64
	BuysCount          int64
	SellsCount         int64
	FavoritesCount     int64
	ConversationsCount int64
	SpentAmount        int64
	RatingSum          int64
	ReviewsCount       int64
	MaxStreakDays      int64
	MaxInactiveGapDays int64
	UpdatedAt          int64

	User User
}
