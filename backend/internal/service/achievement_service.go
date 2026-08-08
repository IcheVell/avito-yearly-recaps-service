package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"
	"v1/internal/domain"
	"v1/internal/repository"
)

type AchievementRepository interface {
	ListUserAchievements(ctx context.Context, userID int64) ([]domain.UserAchievement, []domain.Achievement, error)
	AddAchievementToUser(ctx context.Context, userID int64, achievementID int64) error
	GetRulesForAchievements(ctx context.Context) ([]domain.Rule, error)
}

type UserStatsRepository interface {
	GetByUserID(ctx context.Context, userID int64) (*domain.UserStats, error)
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

func (s *AchievementService) ListUserAchievements(ctx context.Context, userID int64) ([]domain.UserAchievement, []domain.Achievement, error) {
	if _, err := s.users.GetByID(ctx, userID); err != nil {
		return nil, nil, mapUserError(err)
	}

	userStats, err := s.userStats.GetByUserID(ctx, userID)
	if err != nil {
		return nil, nil, mapUserStatsError(err)
	}

	to := time.Now()

	if err := s.userStats.Update(ctx, userID, userStats.ProcessedAt, to); err != nil {
		return nil, nil, mapUserStatsError(err)
	}

	userStats, err = s.userStats.GetByUserID(ctx, userID)
	if err != nil {
		return nil, nil, mapUserStatsError(err)
	}

	rules, err := s.achievements.GetRulesForAchievements(ctx)
	if err != nil {
		return nil, nil, err
	}

	for _, rule := range rules {
		ok, err := evaluateRule(rule.RuleNode, *userStats)
		if err != nil {
			return nil, nil, fmt.Errorf("evaluate rule: %w", err)
		}

		if ok {
			if err := s.achievements.AddAchievementToUser(ctx, userID, rule.ID); err != nil {
				return nil, nil, mapAchievementError(err)
			}
		}
	}

	return s.achievements.ListUserAchievements(ctx, userID)
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

func evaluateRule(rule domain.RuleNode, stats domain.UserStats) (bool, error) {
	switch rule.Type {
	case domain.RuleTypeCondition:
		return evaluateCondition(rule, stats)

	case domain.RuleTypeAll:
		for _, condition := range rule.Conditions {
			ok, err := evaluateRule(condition, stats)
			if err != nil {
				return false, err
			}

			if !ok {
				return false, nil
			}
		}

		return true, nil

	case domain.RuleTypeAny:
		for _, condition := range rule.Conditions {
			ok, err := evaluateRule(condition, stats)
			if err != nil {
				return false, err
			}

			if ok {
				return true, nil
			}
		}

		return false, nil

	default:
		return false, fmt.Errorf(
			"unknown rule type: %s",
			rule.Type,
		)
	}
}

func evaluateCondition(rule domain.RuleNode, stats domain.UserStats) (bool, error) {
	if rule.Value == nil {
		return false, fmt.Errorf("rule value is nil")
	}

	actual, err := getMetricValue(stats, rule.Metric)
	if err != nil {
		return false, err
	}

	expected := *rule.Value

	switch rule.Operator {
	case ">=":
		return actual >= expected, nil

	case ">":
		return actual > expected, nil

	case "<=":
		return actual <= expected, nil

	case "<":
		return actual < expected, nil

	case "==":
		return actual == expected, nil

	default:
		return false, fmt.Errorf(
			"unknown operator: %s",
			rule.Operator,
		)
	}
}

func getMetricValue(stats domain.UserStats, metric string) (float64, error) {
	switch metric {
	case "buys_count":
		return float64(stats.BuysCount), nil

	case "sells_count":
		return float64(stats.SellsCount), nil

	case "favorites_count":
		return float64(stats.FavoritesCount), nil

	case "conversations_count":
		return float64(stats.ConversationsCount), nil

	case "spent_amount":
		return float64(stats.SpentAmount), nil

	case "max_streak_days":
		return float64(stats.MaxStreakDays), nil

	case "max_inactive_gap_days":
		return float64(stats.MaxInactiveGapDays), nil

	case "seller_rating":
		if stats.ReviewsCount == 0 {
			return 0, nil
		}

		return float64(stats.RatingSum) / float64(stats.ReviewsCount), nil

	default:
		return 0, fmt.Errorf("unknown metric: %s", metric)
	}
}
