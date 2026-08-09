package repository

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"v1/internal/domain/entity"
	applog "v1/internal/logger"

	"gorm.io/gorm"
)

var ErrUserStatsNotFound = errors.New("user stats not found")

type UserStatsRepository struct {
	db     *gorm.DB
	logger *slog.Logger
}

func NewUserStatsRepository(db *gorm.DB, logger *slog.Logger) *UserStatsRepository {
	return &UserStatsRepository{
		db:     db,
		logger: applog.WithComponent(logger, "user_stats_repository"),
	}
}

func (r *UserStatsRepository) Update(ctx context.Context, userID int64, from time.Time, to time.Time) (err error) {
	defer func() {
		if err != nil {
			r.logger.ErrorContext(ctx, "update user stats failed", "user_id", userID, "from", from, "to", to, "err", err, "operation", "update_user_stats")
		}
	}()

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		repo := UserStatsRepository{
			db:     tx,
			logger: r.logger,
		}

		if err := repo.updateBuysCount(ctx, userID, from, to); err != nil {
			return err
		}

		if err := repo.updateSellsCount(ctx, userID, from, to); err != nil {
			return err
		}

		if err := repo.updateFavoritesCount(ctx, userID, from, to); err != nil {
			return err
		}

		if err := repo.updateConversationsCount(ctx, userID, from, to); err != nil {
			return err
		}

		if err := repo.updateSpentAmount(ctx, userID, from, to); err != nil {
			return err
		}

		if err := repo.updateRating(ctx, userID, from, to); err != nil {
			return err
		}

		if err := repo.updateMaxStreakDays(ctx, userID, to); err != nil {
			return err
		}

		if err := repo.updateMaxInactiveGapDays(ctx, userID, to); err != nil {
			return err
		}

		err := tx.
			WithContext(ctx).
			Model(&entity.UserStats{}).
			Where("user_id = ?", userID).
			Updates(map[string]any{
				"processed_at": to,
				"updated_at":   time.Now(),
			}).
			Error

		if err != nil {
			return fmt.Errorf("update user stats timestamps: %w", err)
		}

		return nil
	})
}

func (r *UserStatsRepository) GetByUserID(ctx context.Context, userID int64) (*entity.UserStats, error) {
	var userStats entity.UserStats

	err := r.db.
		WithContext(ctx).
		Table("user_stats").
		Select("*").
		Where("user_id = ?", userID).
		Scan(&userStats).
		Error

	if err != nil {
		r.logger.ErrorContext(ctx, "get user stats failed", "user_id", userID, "err", err, "operation", "get_user_stats")
		return nil, fmt.Errorf("get user stats: %w", err)
	}

	return &userStats, nil
}

func (r *UserStatsRepository) updateBuysCount(
	ctx context.Context,
	userID int64,
	from time.Time,
	to time.Time,
) error {
	newBuys := r.db.
		WithContext(ctx).
		Table("deals").
		Select("COUNT(*)").
		Where("buyer_id = ?", userID).
		Where("completed_at > ?", from).
		Where("completed_at <= ?", to).
		Where("status = ?", entity.DealStatusCompleted)

	err := r.db.
		WithContext(ctx).
		Model(&entity.UserStats{}).
		Where("user_id = ?", userID).
		Update(
			"buys_count",
			gorm.Expr("buys_count + (?)", newBuys),
		).
		Error

	if err != nil {
		return fmt.Errorf("update buys count: %w", err)
	}

	return nil
}

func (r *UserStatsRepository) updateSellsCount(
	ctx context.Context,
	userID int64,
	from time.Time,
	to time.Time,
) error {
	newSells := r.db.
		WithContext(ctx).
		Table("listings").
		Joins("JOIN deals ON deals.listing_id = listings.id").
		Select("COUNT(*)").
		Where("listings.seller_id = ?", userID).
		Where("deals.completed_at > ?", from).
		Where("deals.completed_at <= ?", to).
		Where("deals.status = ?", entity.DealStatusCompleted)

	err := r.db.
		WithContext(ctx).
		Model(&entity.UserStats{}).
		Where("user_id = ?", userID).
		Update(
			"sells_count",
			gorm.Expr("sells_count + (?)", newSells),
		).
		Error

	if err != nil {
		return fmt.Errorf("update sells count: %w", err)
	}

	return nil
}

func (r *UserStatsRepository) updateFavoritesCount(
	ctx context.Context,
	userID int64,
	from time.Time,
	to time.Time,
) error {
	newFavorites := r.db.
		WithContext(ctx).
		Table("favorite_listings").
		Select("COUNT(*)").
		Where("user_id = ?", userID).
		Where("created_at > ?", from).
		Where("created_at <= ?", to)

	err := r.db.
		WithContext(ctx).
		Model(&entity.UserStats{}).
		Where("user_id = ?", userID).
		Update(
			"favorites_count",
			gorm.Expr("favorites_count + (?)", newFavorites),
		).
		Error

	if err != nil {
		return fmt.Errorf("update favorites count: %w", err)
	}

	return nil
}

func (r *UserStatsRepository) updateConversationsCount(
	ctx context.Context,
	userID int64,
	from time.Time,
	to time.Time,
) error {
	newConversations := r.db.
		WithContext(ctx).
		Table("conversations").
		Joins(`
			JOIN conversation_participants cp
				ON cp.conversation_id = conversations.id
		`).
		Select("COUNT(DISTINCT conversations.id)").
		Where("cp.user_id = ?", userID).
		Where("conversations.created_at > ?", from).
		Where("conversations.created_at <= ?", to)

	err := r.db.
		WithContext(ctx).
		Model(&entity.UserStats{}).
		Where("user_id = ?", userID).
		Update(
			"conversations_count",
			gorm.Expr(
				"conversations_count + (?)",
				newConversations,
			),
		).
		Error

	if err != nil {
		return fmt.Errorf("update conversations count: %w", err)
	}

	return nil
}

func (r *UserStatsRepository) updateSpentAmount(
	ctx context.Context,
	userID int64,
	from time.Time,
	to time.Time,
) error {
	newSpentAmount := r.db.
		WithContext(ctx).
		Table("deals").
		Select("COALESCE(SUM(price), 0)").
		Where("buyer_id = ?", userID).
		Where("completed_at > ?", from).
		Where("completed_at <= ?", to).
		Where("status = ?", entity.DealStatusCompleted)

	err := r.db.
		WithContext(ctx).
		Model(&entity.UserStats{}).
		Where("user_id = ?", userID).
		Update(
			"spent_amount",
			gorm.Expr(
				"spent_amount + (?)",
				newSpentAmount,
			),
		).
		Error

	if err != nil {
		return fmt.Errorf("update spent amount: %w", err)
	}

	return nil
}

func (r *UserStatsRepository) updateRating(
	ctx context.Context,
	userID int64,
	from time.Time,
	to time.Time,
) error {
	newRatingSum := r.db.
		WithContext(ctx).
		Table("reviews").
		Select("COALESCE(SUM(rating), 0)").
		Where("reviewee_id = ?", userID).
		Where("created_at > ?", from).
		Where("created_at <= ?", to)

	newReviewsCount := r.db.
		WithContext(ctx).
		Table("reviews").
		Select("COUNT(*)").
		Where("reviewee_id = ?", userID).
		Where("created_at > ?", from).
		Where("created_at <= ?", to)

	err := r.db.
		WithContext(ctx).
		Model(&entity.UserStats{}).
		Where("user_id = ?", userID).
		Updates(map[string]any{
			"rating_sum": gorm.Expr(
				"rating_sum + (?)",
				newRatingSum,
			),
			"reviews_count": gorm.Expr(
				"reviews_count + (?)",
				newReviewsCount,
			),
		}).
		Error

	if err != nil {
		return fmt.Errorf("update rating stats: %w", err)
	}

	return nil
}

func (r *UserStatsRepository) updateMaxStreakDays(
	ctx context.Context,
	userID int64,
	to time.Time,
) error {
	query := `
		(
			WITH unique_dates AS (
				SELECT DISTINCT DATE(started_at) AS visit_date
				FROM user_sessions
				WHERE user_id = ?
				  AND started_at <= ?
			),
			ranked_dates AS (
				SELECT
					visit_date,
					visit_date - CAST(
						ROW_NUMBER() OVER (
							ORDER BY visit_date
						) AS INTEGER
					) AS streak_group
				FROM unique_dates
			),
			streaks AS (
				SELECT COUNT(*) AS streak_length
				FROM ranked_dates
				GROUP BY streak_group
			)
			SELECT COALESCE(MAX(streak_length), 0)
			FROM streaks
		)
	`

	err := r.db.
		WithContext(ctx).
		Model(&entity.UserStats{}).
		Where("user_id = ?", userID).
		Update(
			"max_streak_days",
			gorm.Expr(query, userID, to),
		).
		Error

	if err != nil {
		return fmt.Errorf("update max streak days: %w", err)
	}

	return nil
}

func (r *UserStatsRepository) updateMaxInactiveGapDays(
	ctx context.Context,
	userID int64,
	to time.Time,
) error {
	query := `
		(
			WITH unique_dates AS (
				SELECT DISTINCT DATE(started_at) AS visit_date
				FROM user_sessions
				WHERE user_id = ?
				  AND started_at <= ?
			),
			ordered_dates AS (
				SELECT
					visit_date,
					LAG(visit_date) OVER (
						ORDER BY visit_date
					) AS previous_date
				FROM unique_dates
			)
			SELECT COALESCE(
				MAX(visit_date - previous_date - 1),
				0
			)
			FROM ordered_dates
			WHERE previous_date IS NOT NULL
		)
	`

	err := r.db.
		WithContext(ctx).
		Model(&entity.UserStats{}).
		Where("user_id = ?", userID).
		Update(
			"max_inactive_gap_days",
			gorm.Expr(query, userID, to),
		).
		Error

	if err != nil {
		return fmt.Errorf(
			"update max inactive gap days: %w",
			err,
		)
	}

	return nil
}
