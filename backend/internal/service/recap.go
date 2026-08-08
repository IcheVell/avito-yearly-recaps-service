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
	if logger == nil {
		logger = slog.Default()
	}

	return &RecapService{
		users:              users,
		metrics:            metrics,
		recaps:             recaps,
		AchievementService: achievements,
		logger:             logger.With("component", "recap_service"),
	}
}

func (s *RecapService) GenerateRecap(ctx context.Context, userID int64, year int) (recap.Recap, bool, error) {
	s.logger.InfoContext(ctx, "generate recap", "user_id", userID, "year", year, "operation", "generate_recap")

	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return recap.Recap{}, false, mapUserError(err)
	}

	if err := s.AchievementService.UpdateUserAchievements(ctx, userID); err != nil {
		return recap.Recap{}, false, err
	}

	metrics, err := s.metrics.GetByUserIDAndYear(ctx, *user, year)
	if err != nil {
		return recap.Recap{}, false, fmt.Errorf("get user stats: %w", err)
	}

	story, err := engine.Generate(*metrics)
	if err != nil {
		return recap.Recap{}, false, fmt.Errorf("generate recap: %w", err)
	}
	if len(story.Metrics) > recapMetricsLimit {
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
		return recap.Recap{}, false, fmt.Errorf("get existing recap: %w", err)
	}

	if existing == nil {
		if err := s.recaps.Create(ctx, &story); err != nil {
			return recap.Recap{}, false, fmt.Errorf("create recap: %w", err)
		}

		return story, true, nil
	}

	story.ID = existing.ID
	story.CreatedAt = existing.CreatedAt
	if err := s.recaps.Update(ctx, &story); err != nil {
		return recap.Recap{}, false, fmt.Errorf("update recap: %w", err)
	}

	return story, false, nil
}

func (s *RecapService) GetUserRecap(ctx context.Context, userID int64, year int) (recap.Recap, error) {
	yearly, err := s.recaps.GetUserRecapByIDAndYear(ctx, userID, year)
	if err != nil {
		return recap.Recap{}, fmt.Errorf("get recap: %w", err)
	}

	if yearly == nil {
		return recap.Recap{}, notFound("RECAP_NOT_FOUND", "recap not found")
	}

	return newRecapFromYearlyRecap(*yearly)
}

func (s *RecapService) GetUserStats(ctx context.Context, userID int64, year int) (recap.YearMetrics, error) {
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return recap.YearMetrics{}, mapUserError(err)
	}

	metrics, err := s.metrics.GetByUserIDAndYear(ctx, *user, year)
	if err != nil {
		return recap.YearMetrics{}, fmt.Errorf("get user stats: %w", err)
	}

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
