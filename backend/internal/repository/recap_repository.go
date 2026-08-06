package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"v1/internal/domain"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type RecapRepository struct {
	db *gorm.DB
}

func NewRecapRepository(db *gorm.DB) *RecapRepository {
	return &RecapRepository{db: db}
}

func (r *RecapRepository) Create(ctx context.Context, recap *domain.Recap) error {
	if recap == nil {
		return errors.New("create recap: recap is nil")
	}

	payloadJSON, err := marshalRecapPayload(recap)
	if err != nil {
		return err
	}

	yearlyRecap := domain.YearlyRecap{
		UserID:  recap.UserID,
		Year:    recap.Year,
		Payload: datatypes.JSON(payloadJSON),
	}

	if err := r.db.
		WithContext(ctx).
		Table("yearly_recaps").
		Omit("User").
		Create(&yearlyRecap).
		Error; err != nil {
		return fmt.Errorf("create yearly recap: %w", err)
	}

	recap.ID = yearlyRecap.ID
	recap.CreatedAt = yearlyRecap.CreatedAt

	return nil
}

func (r *RecapRepository) Update(ctx context.Context, recap *domain.Recap) error {
	if recap == nil {
		return errors.New("update recap: recap is nil")
	}

	payloadJSON, err := marshalRecapPayload(recap)
	if err != nil {
		return err
	}

	res := r.db.
		WithContext(ctx).
		Table("yearly_recaps").
		Where("id = ?", recap.ID).
		Updates(map[string]any{
			"payload": datatypes.JSON(payloadJSON),
		})

	if res.Error != nil {
		return fmt.Errorf("update yearly recap: %w", res.Error)
	}

	if res.RowsAffected == 0 {
		return fmt.Errorf("update yearly recap: not found")
	}

	return nil
}

func (r *RecapRepository) GetUserRecapByIDAndYear(ctx context.Context, userID int64, year int) (*domain.YearlyRecap, error) {
	var recap domain.YearlyRecap

	res := r.db.
		WithContext(ctx).
		Table("yearly_recaps").
		Select("yearly_recaps.*").
		Where("yearly_recaps.user_id = ?", userID).
		Where("yearly_recaps.year = ?", year).
		Scan(&recap)

	if res.Error != nil {
		return nil, fmt.Errorf("get recap by id: %w", res.Error)
	}

	if res.RowsAffected == 0 {
		return nil, nil
	}

	return &recap, nil
}

func (r *RecapRepository) ListUserAchievements(ctx context.Context, userID int64) ([]domain.UserAchievement, error) {
	var achievements []domain.UserAchievement

	err := r.db.
		WithContext(ctx).
		Preload("Achievement").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&achievements).
		Error

	if err != nil {
		return nil, fmt.Errorf("list user achievements: %w", err)
	}

	return achievements, nil
}

func marshalRecapPayload(recap *domain.Recap) ([]byte, error) {
	payload := domain.YearlyRecapPayload{
		Role:         recap.Role,
		Metrics:      recap.Metrics,
		Achievements: recap.Achievements,
		Action:       recap.Action,
		Debug:        recap.Debug,
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal recap payload: %w", err)
	}

	return payloadJSON, nil
}
