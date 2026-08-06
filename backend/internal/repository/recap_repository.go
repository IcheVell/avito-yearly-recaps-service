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

	payload := domain.YearlyRecapPayload{
		Role:         recap.Role,
		Metrics:      recap.Metrics,
		Achievements: recap.Achievements,
		Action:       recap.Action,
		Debug:        recap.Debug,
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal recap payload: %w", err)
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

func (r *MetricsRepository) GetUserAchievements(ctx context.Context, userID int64) ([]domain.YearAchievement, error) {
	var achievements []domain.YearAchievement

	res := r.db.
		WithContext(ctx).
		Table("achievements").
		Joins("JOIN user_achievements ON user_achievements.achievement_id = achievements.id").
		Select("achievements.*").
		Where("user_achievements.user_id = ?", userID).
		Scan(&achievements)

	if res.Error != nil {
		return nil, fmt.Errorf("get achievements: %w", res.Error)
	}

	return achievements, nil
}
