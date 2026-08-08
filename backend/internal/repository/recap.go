package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"v1/internal/domain/entity"
	"v1/internal/domain/recap"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type RecapRepository struct {
	db *gorm.DB
}

func NewRecapRepository(db *gorm.DB) *RecapRepository {
	return &RecapRepository{db: db}
}

func (r *RecapRepository) Create(ctx context.Context, story *recap.Recap) error {
	if story == nil {
		return errors.New("create recap: recap is nil")
	}

	payloadJSON, err := marshalRecapPayload(story)
	if err != nil {
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
		return fmt.Errorf("create yearly recap: %w", err)
	}

	story.ID = yearlyRecap.ID
	story.CreatedAt = yearlyRecap.CreatedAt

	return nil
}

func (r *RecapRepository) Update(ctx context.Context, story *recap.Recap) error {
	if story == nil {
		return errors.New("update recap: recap is nil")
	}

	payloadJSON, err := marshalRecapPayload(story)
	if err != nil {
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
		return fmt.Errorf("update yearly recap: %w", res.Error)
	}

	if res.RowsAffected == 0 {
		return fmt.Errorf("update yearly recap: not found")
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
