package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"v1/internal/domain/entity"
	"v1/internal/domain/recap"
	enginerules "v1/internal/engine/rules"
	"v1/internal/repository"
)

type AchievementRepository interface {
	ListUserAchievements(ctx context.Context, userID int64) ([]entity.UserAchievement, []entity.Achievement, error)
	AddAchievementToUser(ctx context.Context, userID int64, achievementID int64) error
	GetRulesForAchievements(ctx context.Context) ([]recap.Rule, error)
}

type UserStatsRepository interface {
	GetByUserID(ctx context.Context, userID int64) (*entity.UserStats, error)
	Update(ctx context.Context, userID int64, from time.Time, to time.Time) error
}

type AchievementService struct {
	achievements AchievementRepository
	users        UserRepository
	userStats    UserStatsRepository
	logger       *slog.Logger
}

func NewAchievementService(achievementRepo AchievementRepository, userRepo UserRepository, userStatsRepo UserStatsRepository, logger *slog.Logger) *AchievementService {
	if logger == nil {
		return &AchievementService{
			achievements: achievementRepo,
			users:        userRepo,
			userStats:    userStatsRepo,
			logger:       slog.Default()}
	}

	return &AchievementService{
		achievements: achievementRepo,
		users:        userRepo,
		userStats:    userStatsRepo,
		logger:       logger.With("component", "achievement_service"),
	}
}

func (s *AchievementService) ListUserAchievements(ctx context.Context, userID int64) ([]entity.UserAchievement, []entity.Achievement, error) {
	if err := s.UpdateUserAchievements(ctx, userID); err != nil {
		return nil, nil, err
	}

	return s.achievements.ListUserAchievements(ctx, userID)
}

func (s *AchievementService) UpdateUserAchievements(ctx context.Context, userID int64) error {
	if _, err := s.users.GetByID(ctx, userID); err != nil {
		return mapUserError(err)
	}

	userStats, err := s.userStats.GetByUserID(ctx, userID)
	if err != nil {
		return mapUserStatsError(err)
	}

	to := time.Now()

	if err := s.userStats.Update(ctx, userID, userStats.ProcessedAt, to); err != nil {
		return mapUserStatsError(err)
	}

	userStats, err = s.userStats.GetByUserID(ctx, userID)
	if err != nil {
		return mapUserStatsError(err)
	}

	rules, err := s.achievements.GetRulesForAchievements(ctx)
	if err != nil {
		return err
	}

	for _, rule := range rules {
		ok, err := enginerules.EvaluateRule(rule.RuleNode, *userStats)
		if err != nil {
			return fmt.Errorf("evaluate rule: %w", err)
		}

		if ok {
			if err := s.achievements.AddAchievementToUser(ctx, userID, rule.ID); err != nil {
				return mapAchievementError(err)
			}
		}
	}

	return nil
}

func mapUserStatsError(err error) error {
	if errors.Is(err, repository.ErrUserStatsNotFound) {
		return notFound("USER_STATS_NOT_FOUND", "user stats not found")
	}

	return err
}

func mapAchievementError(err error) error {
	if errors.Is(err, repository.ErrAchievementsNotFound) {
		return notFound("ACHIEVEMENTS_NOT_FOUND", "achievements not found")
	}

	if errors.Is(err, repository.ErrCantAddAchievementToUser) {
		return notFound("ACHIEVEMENTS_TO_USER", "can't add achievement to user")
	}

	return err
}
