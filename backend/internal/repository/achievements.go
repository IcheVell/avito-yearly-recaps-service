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

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrAchievementsNotFound     = errors.New("achievements not found")
	ErrCantAddAchievementToUser = errors.New("can not add achievement to user")
)

type AchievementsRepository struct {
	db     *gorm.DB
	logger *slog.Logger
}

func NewAchievementsRepository(db *gorm.DB, logger *slog.Logger) *AchievementsRepository {
	return &AchievementsRepository{
		db:     db,
		logger: applog.WithComponent(logger, "achievements_repository"),
	}
}

func (r *AchievementsRepository) ListUserAchievements(ctx context.Context, userID int64) (earned []entity.UserAchievement, locked []entity.Achievement, err error) {
	err = r.db.WithContext(ctx).
		Preload("Achievement").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&earned).Error
	if err != nil {
		r.logger.ErrorContext(ctx, "list earned achievements failed", "user_id", userID, "err", err, "operation", "list_user_achievements")
		return nil, nil, fmt.Errorf("list earned achievements: %w", err)
	}

	var all []entity.Achievement
	err = r.db.WithContext(ctx).Order("id ASC").Find(&all).Error
	if err != nil {
		r.logger.ErrorContext(ctx, "list all achievements failed", "user_id", userID, "err", err, "operation", "list_user_achievements")
		return nil, nil, fmt.Errorf("list all achievements: %w", err)
	}

	earnedIDs := make(map[int64]struct{}, len(earned))
	for _, a := range earned {
		earnedIDs[a.AchievementID] = struct{}{}
	}

	locked = make([]entity.Achievement, 0)
	for _, a := range all {
		if _, ok := earnedIDs[a.ID]; !ok {
			locked = append(locked, a)
		}
	}

	return earned, locked, nil
}

func (r *AchievementsRepository) AddAchievementToUser(ctx context.Context, userID int64, achievementID int64) error {
	userAchievement := &entity.UserAchievement{
		AchievementID: achievementID,
		UserID:        userID,
	}

	err := r.db.
		WithContext(ctx).
		Table("user_achievements").
		Clauses(clause.OnConflict{
			DoNothing: true,
		}).
		Create(userAchievement).
		Error

	if err != nil {
		r.logger.ErrorContext(ctx, "add achievement to user failed", "user_id", userID, "achievement_id", achievementID, "err", err, "operation", "add_achievement_to_user")
		return fmt.Errorf("add achievement to user: %w", err)
	}

	return nil
}

func (r *AchievementsRepository) GetRulesForAchievements(ctx context.Context) ([]recap.Rule, error) {
	var rows []struct {
		AchievementID int64  `gorm:"column:achievement_id"`
		Rule          []byte `gorm:"column:rule"`
	}

	err := r.db.
		WithContext(ctx).
		Table("achievement_rules").
		Select("achievement_id, rule").
		Scan(&rows).
		Error

	if err != nil {
		r.logger.ErrorContext(ctx, "get achievement rules failed", "err", err, "operation", "get_achievement_rules")
		return nil, fmt.Errorf("get rules for achievements: %w", err)
	}

	rules := make([]recap.Rule, 0, len(rows))

	for _, row := range rows {
		var ruleNode recap.RuleNode

		if err := json.Unmarshal(row.Rule, &ruleNode); err != nil {
			r.logger.ErrorContext(ctx, "unmarshal achievement rule failed", "achievement_id", row.AchievementID, "err", err, "operation", "get_achievement_rules")
			return nil, fmt.Errorf("unmarshal rule for achievement %d: %w", row.AchievementID, err)
		}

		rules = append(rules, recap.Rule{ID: row.AchievementID, RuleNode: ruleNode})
	}

	return rules, nil
}
