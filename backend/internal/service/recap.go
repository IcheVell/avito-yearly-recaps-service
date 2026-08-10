package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"

	"v1/internal/domain/entity"
	"v1/internal/domain/recap"
	"v1/internal/engine"
	applog "v1/internal/logger"
	"v1/internal/repository"
)

type UserRepository interface {
	GetByID(ctx context.Context, id int64) (*entity.User, error)
	ListProfiles(ctx context.Context) ([]entity.User, error)
}

type MetricsRepository interface {
	GetByUserIDAndYear(ctx context.Context, user entity.User, year int) (*recap.YearMetrics, error)
}

type RecapRepository interface {
	Create(ctx context.Context, story *recap.Recap) error
	Update(ctx context.Context, story *recap.Recap) error
	GetUserRecapByIDAndYear(ctx context.Context, userID int64, year int) (*entity.YearlyRecap, error)
}

type AchievementServiceInterface interface {
	UpdateUserAchievements(ctx context.Context, userID int64) error
}

const recapMetricsLimit = 4

type RecapService struct {
	users              UserRepository
	metrics            MetricsRepository
	recaps             RecapRepository
	AchievementService AchievementServiceInterface
	logger             *slog.Logger
}

func NewRecapService(
	users UserRepository,
	metrics MetricsRepository,
	recaps RecapRepository,
	achievements AchievementServiceInterface,
	logger *slog.Logger,
) *RecapService {
	return &RecapService{
		users:              users,
		metrics:            metrics,
		recaps:             recaps,
		AchievementService: achievements,
		logger:             applog.WithComponent(logger, "recap_service"),
	}
}

func (s *RecapService) GenerateRecap(ctx context.Context, userID int64, year int) (recap.Recap, bool, error) {
	s.logger.InfoContext(ctx, "generate recap started", "user_id", userID, "year", year, "operation", "generate_recap")

	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		s.logger.WarnContext(ctx, "generate recap user lookup failed", "user_id", userID, "year", year, "err", err, "operation", "generate_recap")
		return recap.Recap{}, false, mapUserError(err)
	}

	if err := s.AchievementService.UpdateUserAchievements(ctx, userID); err != nil {
		s.logger.ErrorContext(ctx, "generate recap achievements sync failed", "user_id", userID, "year", year, "err", err, "operation", "generate_recap")
		return recap.Recap{}, false, err
	}

	metrics, err := s.metrics.GetByUserIDAndYear(ctx, *user, year)
	if err != nil {
		s.logger.ErrorContext(ctx, "generate recap metrics failed", "user_id", userID, "year", year, "err", err, "operation", "generate_recap")
		return recap.Recap{}, false, fmt.Errorf("get user stats: %w", err)
	}

	s.logger.InfoContext(
		ctx,
		"generate recap metrics loaded",
		"user_id", userID,
		"year", year,
		"buys_count", metrics.BuysCount,
		"sells_count", metrics.SellsCount,
		"views_count", metrics.ViewsCount,
		"favorites_count", metrics.FavoritesCount,
		"achievements_count", len(metrics.YearAchievements),
		"operation", "generate_recap",
	)

	story, err := engine.Generate(*metrics)
	if err != nil {
		s.logger.ErrorContext(ctx, "generate recap engine failed", "user_id", userID, "year", year, "err", err, "operation", "generate_recap")
		return recap.Recap{}, false, fmt.Errorf("generate recap: %w", err)
	}
	if len(story.Metrics) > recapMetricsLimit {
		s.logger.InfoContext(
			ctx,
			"generate recap metrics truncated",
			"user_id", userID,
			"year", year,
			"before", len(story.Metrics),
			"limit", recapMetricsLimit,
			"operation", "generate_recap",
		)
		story.Metrics = story.Metrics[:recapMetricsLimit]
	}
	story.UserID = userID
	story.Year = year
	story.Debug = recap.RecapDebug{
		GeneratorVersion: "v1",
		SeedProfile:      story.Role.Code + "_1",
	}

	existing, err := s.recaps.GetUserRecapByIDAndYear(ctx, userID, year)
	if err != nil {
		s.logger.ErrorContext(ctx, "generate recap existing lookup failed", "user_id", userID, "year", year, "err", err, "operation", "generate_recap")
		return recap.Recap{}, false, fmt.Errorf("get existing recap: %w", err)
	}

	if existing == nil {
		if err := s.recaps.Create(ctx, &story); err != nil {
			s.logger.ErrorContext(ctx, "generate recap create failed", "user_id", userID, "year", year, "err", err, "operation", "generate_recap")
			return recap.Recap{}, false, fmt.Errorf("create recap: %w", err)
		}

		s.logger.InfoContext(
			ctx,
			"generate recap created",
			"user_id", userID,
			"year", year,
			"recap_id", story.ID,
			"role", story.Role.Code,
			"metrics_count", len(story.Metrics),
			"achievements_count", len(story.Achievements),
			"action", story.Action.Type,
			"operation", "generate_recap",
		)
		return story, true, nil
	}

	story.ID = existing.ID
	story.CreatedAt = existing.CreatedAt
	if err := s.recaps.Update(ctx, &story); err != nil {
		s.logger.ErrorContext(ctx, "generate recap update failed", "user_id", userID, "year", year, "recap_id", story.ID, "err", err, "operation", "generate_recap")
		return recap.Recap{}, false, fmt.Errorf("update recap: %w", err)
	}

	s.logger.InfoContext(
		ctx,
		"generate recap updated",
		"user_id", userID,
		"year", year,
		"recap_id", story.ID,
		"role", story.Role.Code,
		"metrics_count", len(story.Metrics),
		"achievements_count", len(story.Achievements),
		"action", story.Action.Type,
		"operation", "generate_recap",
	)
	return story, false, nil
}

func (s *RecapService) GetUserRecap(ctx context.Context, userID int64, year int) (recap.Recap, error) {
	s.logger.InfoContext(ctx, "get user recap started", "user_id", userID, "year", year, "operation", "get_user_recap")

	yearly, err := s.recaps.GetUserRecapByIDAndYear(ctx, userID, year)
	if err != nil {
		s.logger.ErrorContext(ctx, "get user recap failed", "user_id", userID, "year", year, "err", err, "operation", "get_user_recap")
		return recap.Recap{}, fmt.Errorf("get recap: %w", err)
	}

	if yearly == nil {
		s.logger.WarnContext(ctx, "get user recap not found", "user_id", userID, "year", year, "operation", "get_user_recap")
		return recap.Recap{}, notFound("RECAP_NOT_FOUND", "recap not found")
	}

	story, err := newRecapFromYearlyRecap(*yearly)
	if err != nil {
		s.logger.ErrorContext(ctx, "get user recap unmarshal failed", "user_id", userID, "year", year, "recap_id", yearly.ID, "err", err, "operation", "get_user_recap")
		return recap.Recap{}, err
	}

	s.logger.InfoContext(
		ctx,
		"get user recap succeeded",
		"user_id", userID,
		"year", year,
		"recap_id", story.ID,
		"role", story.Role.Code,
		"operation", "get_user_recap",
	)
	return story, nil
}

func (s *RecapService) GetUserStats(ctx context.Context, userID int64, year int) (recap.YearMetrics, error) {
	s.logger.InfoContext(ctx, "get user stats started", "user_id", userID, "year", year, "operation", "get_user_stats")

	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		s.logger.WarnContext(ctx, "get user stats user lookup failed", "user_id", userID, "year", year, "err", err, "operation", "get_user_stats")
		return recap.YearMetrics{}, mapUserError(err)
	}

	metrics, err := s.metrics.GetByUserIDAndYear(ctx, *user, year)
	if err != nil {
		s.logger.ErrorContext(ctx, "get user stats failed", "user_id", userID, "year", year, "err", err, "operation", "get_user_stats")
		return recap.YearMetrics{}, fmt.Errorf("get user stats: %w", err)
	}

	s.logger.InfoContext(
		ctx,
		"get user stats succeeded",
		"user_id", userID,
		"year", year,
		"buys_count", metrics.BuysCount,
		"sells_count", metrics.SellsCount,
		"views_count", metrics.ViewsCount,
		"active_days", metrics.ActiveDays,
		"operation", "get_user_stats",
	)
	return *metrics, nil
}

func newRecapFromYearlyRecap(yearlyRecap entity.YearlyRecap) (recap.Recap, error) {
	var payload recap.YearlyRecapPayload
	if err := json.Unmarshal(yearlyRecap.Payload, &payload); err != nil {
		return recap.Recap{}, fmt.Errorf("unmarshal recap payload: %w", err)
	}

	return recap.Recap{
		ID:           yearlyRecap.ID,
		UserID:       yearlyRecap.UserID,
		Year:         yearlyRecap.Year,
		CreatedAt:    yearlyRecap.CreatedAt,
		Role:         payload.Role,
		Metrics:      payload.Metrics,
		Achievements: payload.Achievements,
		Action:       payload.Action,
		Debug:        payload.Debug,
	}, nil
}

func mapUserError(err error) error {
	if errors.Is(err, repository.ErrUserNotFound) {
		return notFound("USER_NOT_FOUND", "user not found")
	}

	return err
}
