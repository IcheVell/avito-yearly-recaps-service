package repository

import (
	"context"
	"fmt"
	"v1/internal/domain"

	"gorm.io/gorm"
)

type RecapRepository struct {
	db *gorm.DB
}

func NewRecapRepository(db *gorm.DB) *RecapRepository {
	return &RecapRepository{db: db}
}

func (r *RecapRepository) GetUserRecapByID(ctx context.Context, userID int64, year int) (*domain.YearlyRecap, error) {
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

func (r *RecapRepository) getUserAchievements(ctx context.Context, userID int64, year int) ([]domain.Achievement, error) {
	var achievements []domain.Achievement

	res := r.db.
		WithContext(ctx).
		Table("achievements").
		Joins("JOIN yearly_recap_achievements ON yearly_recap_achievements.achievement_id = achievements.id").
		Joins("JOIN yearly_recaps ON yearly_recap_achievements.yearly_recap_id = yearly_recaps.id").
		Select("achievements.*").
		Where("yearly_recaps.user_id = ?", userID).
		Where("yearly_recaps.year = ?", year).
		Scan(&achievements)

	if res.Error != nil {
		return nil, fmt.Errorf("get achievements: %w", res.Error)
	}

	return achievements, nil
}
