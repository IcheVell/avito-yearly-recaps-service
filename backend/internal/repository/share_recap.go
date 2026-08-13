package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"

	"v1/internal/domain/entity"
	"v1/internal/domain/recap"
	applog "v1/internal/logger"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ShareRecapRepository struct {
	db     *gorm.DB
	logger *slog.Logger
}

func NewShareRecapRepository(db *gorm.DB, logger *slog.Logger) *ShareRecapRepository {
	return &ShareRecapRepository{
		db:     db,
		logger: applog.WithComponent(logger, "share_recap_repository"),
	}
}

func (r *ShareRecapRepository) Create(
	ctx context.Context,
	token string,
	userID int64,
	year int,
	recapID int64,
	share *recap.ShareRecap,
) (*entity.ShareRecap, error) {
	if share == nil {
		err := errors.New("create share recap: share is nil")
		r.logger.ErrorContext(ctx, "create share recap failed", "err", err, "operation", "create_share_recap")
		return nil, err
	}
	if token == "" {
		err := errors.New("create share recap: token is empty")
		r.logger.ErrorContext(ctx, "create share recap failed", "err", err, "operation", "create_share_recap")
		return nil, err
	}

	payloadJSON, err := json.Marshal(share)
	if err != nil {
		r.logger.ErrorContext(
			ctx,
			"marshal share recap payload failed",
			"user_id", userID,
			"year", year,
			"recap_id", recapID,
			"err", err,
			"operation", "create_share_recap",
		)
		return nil, fmt.Errorf("marshal share recap payload: %w", err)
	}

	row := entity.ShareRecap{
		Token:   token,
		UserID:  userID,
		Year:    year,
		RecapID: recapID,
		Payload: datatypes.JSON(payloadJSON),
	}

	if err := r.db.
		WithContext(ctx).
		Table("share_recaps").
		Omit("User", "Recap").
		Create(&row).
		Error; err != nil {
		r.logger.ErrorContext(
			ctx,
			"create share recap failed",
			"user_id", userID,
			"year", year,
			"recap_id", recapID,
			"err", err,
			"operation", "create_share_recap",
		)
		return nil, fmt.Errorf("create share recap: %w", err)
	}

	return &row, nil
}

func (r *ShareRecapRepository) GetByToken(ctx context.Context, token string) (*entity.ShareRecap, error) {
	var row entity.ShareRecap

	res := r.db.
		WithContext(ctx).
		Table("share_recaps").
		Select("share_recaps.*").
		Where("share_recaps.token = ?", token).
		Scan(&row)

	if res.Error != nil {
		r.logger.ErrorContext(ctx, "get share recap by token failed", "err", res.Error, "operation", "get_share_recap_by_token")
		return nil, fmt.Errorf("get share recap by token: %w", res.Error)
	}

	if res.RowsAffected == 0 {
		return nil, nil
	}

	return &row, nil
}
