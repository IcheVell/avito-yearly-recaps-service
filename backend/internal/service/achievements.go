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
	applog "v1/internal/logger"
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
	return &AchievementService{
		achievements: achievementRepo,
		users:        userRepo,
		userStats:    userStatsRepo,
		logger:       applog.WithComponent(logger, "achievement_service"),
	}
}

func (s *AchievementService) ListUserAchievements(ctx context.Context, userID int64) ([]entity.UserAchievement, []entity.Achievement, []*recap.AchievementEvaluation, error) {
	s.logger.InfoContext(ctx, "list user achievements started", "user_id", userID, "operation", "list_user_achievements")

	rules, err := s.UpdateUserAchievements(ctx, userID)
	if err != nil {
		return nil, nil, nil, err
	}

	earned, locked, err := s.achievements.ListUserAchievements(ctx, userID)
	if err != nil {
		s.logger.ErrorContext(ctx, "list user achievements failed", "user_id", userID, "err", err, "operation", "list_user_achievements")
		return nil, nil, nil, err
	}

	s.logger.InfoContext(
		ctx,
		"list user achievements succeeded",
		"user_id", userID,
		"earned_count", len(earned),
		"locked_count", len(locked),
		"operation", "list_user_achievements",
	)
	return earned, locked, rules, nil
}

func (s *AchievementService) UpdateUserAchievements(ctx context.Context, userID int64) ([]*recap.AchievementEvaluation, error) {
	s.logger.InfoContext(ctx, "update user achievements started", "user_id", userID, "operation", "update_user_achievements")

	if _, err := s.users.GetByID(ctx, userID); err != nil {
		s.logger.WarnContext(ctx, "update user achievements user lookup failed", "user_id", userID, "err", err, "operation", "update_user_achievements")
		return nil, mapUserError(err)
	}

	userStats, err := s.userStats.GetByUserID(ctx, userID)
	if err != nil {
		s.logger.WarnContext(ctx, "update user achievements stats lookup failed", "user_id", userID, "err", err, "operation", "update_user_achievements")
		return nil, mapUserStatsError(err)
	}

	from := userStats.ProcessedAt
	to := time.Now()

	if err := s.userStats.Update(ctx, userID, from, to); err != nil {
		s.logger.ErrorContext(
			ctx,
			"update user achievements stats update failed",
			"user_id", userID,
			"from", from,
			"to", to,
			"err", err,
			"operation", "update_user_achievements",
		)
		return nil, mapUserStatsError(err)
	}

	userStats, err = s.userStats.GetByUserID(ctx, userID)
	if err != nil {
		s.logger.ErrorContext(ctx, "update user achievements stats reload failed", "user_id", userID, "err", err, "operation", "update_user_achievements")
		return nil, mapUserStatsError(err)
	}

	rules, err := s.achievements.GetRulesForAchievements(ctx)
	if err != nil {
		s.logger.ErrorContext(ctx, "update user achievements rules load failed", "user_id", userID, "err", err, "operation", "update_user_achievements")
		return nil, err
	}

	achievementEvaluations := make([]*recap.AchievementEvaluation, 0, len(rules))

	matched := 0
	for _, rule := range rules {
		ruleEvaluation, err := enginerules.EvaluateRule(rule.RuleNode, *userStats)
		if err != nil {
			s.logger.ErrorContext(
				ctx,
				"update user achievements rule evaluate failed",
				"user_id", userID,
				"achievement_id", rule.ID,
				"err", err,
				"operation", "update_user_achievements",
			)
			return nil, fmt.Errorf("evaluate rule: %w", err)
		}

		if ruleEvaluation.IsComplete {
			if err := s.achievements.AddAchievementToUser(ctx, userID, rule.ID); err != nil {
				s.logger.ErrorContext(
					ctx,
					"update user achievements award failed",
					"user_id", userID,
					"achievement_id", rule.ID,
					"err", err,
					"operation", "update_user_achievements",
				)
				return nil, mapAchievementError(err)
			}

			matched++
			s.logger.InfoContext(
				ctx,
				"achievement rule matched",
				"user_id", userID,
				"achievement_id", rule.ID,
				"operation", "update_user_achievements",
			)
		}

		achievementEvaluations = append(achievementEvaluations, &recap.AchievementEvaluation{
			Code:       rule.Code,
			Evaluation: *ruleEvaluation,
		})
	}

	s.logger.InfoContext(
		ctx,
		"update user achievements succeeded",
		"user_id", userID,
		"rules_count", len(rules),
		"matched_count", matched,
		"buys_count", userStats.BuysCount,
		"sells_count", userStats.SellsCount,
		"operation", "update_user_achievements",
	)
	return achievementEvaluations, nil
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
