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

type RecapRepository struct {
	db     *gorm.DB
	logger *slog.Logger
}

func NewRecapRepository(db *gorm.DB, logger *slog.Logger) *RecapRepository {
	return &RecapRepository{
		db:     db,
		logger: applog.WithComponent(logger, "recap_repository"),
	}
}

func (r *RecapRepository) Create(ctx context.Context, story *recap.Recap) error {
	if story == nil {
		err := errors.New("create recap: recap is nil")
		r.logger.ErrorContext(ctx, "create recap failed", "err", err, "operation", "create_recap")
		return err
	}

	payloadJSON, err := marshalRecapPayload(story)
	if err != nil {
		r.logger.ErrorContext(ctx, "marshal recap payload failed", "user_id", story.UserID, "year", story.Year, "err", err, "operation", "create_recap")
		return err
	}

	yearlyRecap := entity.YearlyRecap{
		UserID:  story.UserID,
		Year:    story.Year,
		Payload: datatypes.JSON(payloadJSON),
	}

	if err := r.db.
		WithContext(ctx).
		Table("yearly_recaps").
		Omit("User").
		Create(&yearlyRecap).
		Error; err != nil {
		r.logger.ErrorContext(ctx, "create yearly recap failed", "user_id", story.UserID, "year", story.Year, "err", err, "operation", "create_recap")
		return fmt.Errorf("create yearly recap: %w", err)
	}

	story.ID = yearlyRecap.ID
	story.CreatedAt = yearlyRecap.CreatedAt

	return nil
}

func (r *RecapRepository) Update(ctx context.Context, story *recap.Recap) error {
	if story == nil {
		err := errors.New("update recap: recap is nil")
		r.logger.ErrorContext(ctx, "update recap failed", "err", err, "operation", "update_recap")
		return err
	}

	payloadJSON, err := marshalRecapPayload(story)
	if err != nil {
		r.logger.ErrorContext(ctx, "marshal recap payload failed", "user_id", story.UserID, "year", story.Year, "recap_id", story.ID, "err", err, "operation", "update_recap")
		return err
	}

	res := r.db.
		WithContext(ctx).
		Table("yearly_recaps").
		Where("id = ?", story.ID).
		Updates(map[string]any{
			"payload": datatypes.JSON(payloadJSON),
		})

	if res.Error != nil {
		r.logger.ErrorContext(ctx, "update yearly recap failed", "user_id", story.UserID, "year", story.Year, "recap_id", story.ID, "err", res.Error, "operation", "update_recap")
		return fmt.Errorf("update yearly recap: %w", res.Error)
	}

	if res.RowsAffected == 0 {
		err := fmt.Errorf("update yearly recap: not found")
		r.logger.WarnContext(ctx, "update yearly recap missing", "user_id", story.UserID, "year", story.Year, "recap_id", story.ID, "err", err, "operation", "update_recap")
		return err
	}

	return nil
}

func (r *RecapRepository) GetUserRecapByIDAndYear(ctx context.Context, userID int64, year int) (*entity.YearlyRecap, error) {
	var yearly entity.YearlyRecap

	res := r.db.
		WithContext(ctx).
		Table("yearly_recaps").
		Select("yearly_recaps.*").
		Where("yearly_recaps.user_id = ?", userID).
		Where("yearly_recaps.year = ?", year).
		Scan(&yearly)

	if res.Error != nil {
		r.logger.ErrorContext(ctx, "get yearly recap failed", "user_id", userID, "year", year, "err", res.Error, "operation", "get_user_recap")
		return nil, fmt.Errorf("get recap by id: %w", res.Error)
	}

	if res.RowsAffected == 0 {
		return nil, nil
	}

	return &yearly, nil
}

func marshalRecapPayload(story *recap.Recap) ([]byte, error) {
	payload := recap.YearlyRecapPayload{
		Role:         story.Role,
		Metrics:      story.Metrics,
		Achievements: story.Achievements,
		Action:       story.Action,
		Debug:        story.Debug,
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal recap payload: %w", err)
	}

	return payloadJSON, nil
}
