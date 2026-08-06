package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"v1/internal/domain"
	"v1/internal/engine"
	"v1/internal/repository"
)

type UserRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.User, error)
	ListProfiles(ctx context.Context) ([]domain.User, error)
}

type MetricsRepository interface {
	GetByUserIDAndYear(ctx context.Context, user domain.User, year int) (*domain.YearMetrics, error)
}

type RecapRepository interface {
	Create(ctx context.Context, recap *domain.Recap) error
	Update(ctx context.Context, recap *domain.Recap) error
	GetUserRecapByIDAndYear(ctx context.Context, userID int64, year int) (*domain.YearlyRecap, error)
	ListUserAchievements(ctx context.Context, userID int64) ([]domain.UserAchievement, error)
}

const recapMetricsLimit = 3

type RecapService struct {
	users   UserRepository
	metrics MetricsRepository
	recaps  RecapRepository
	logger  *slog.Logger
}

func NewRecapService(
	users UserRepository,
	metrics MetricsRepository,
	recaps RecapRepository,
	logger *slog.Logger,
) *RecapService {
	if logger == nil {
		logger = slog.Default()
	}

	return &RecapService{
		users:   users,
		metrics: metrics,
		recaps:  recaps,
		logger:  logger.With("component", "recap_service"),
	}
}

func (s *RecapService) GenerateRecap(ctx context.Context, userID int64, year int) (domain.Recap, bool, error) {
	s.logger.InfoContext(ctx, "generate recap", "user_id", userID, "year", year, "operation", "generate_recap")

	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return domain.Recap{}, false, mapUserError(err)
	}

	metrics, err := s.metrics.GetByUserIDAndYear(ctx, *user, year)
	if err != nil {
		return domain.Recap{}, false, fmt.Errorf("get user stats: %w", err)
	}

	recap, err := engine.Generate(*metrics)
	if err != nil {
		return domain.Recap{}, false, fmt.Errorf("generate recap: %w", err)
	}
	if len(recap.Metrics) > recapMetricsLimit {
		recap.Metrics = recap.Metrics[:recapMetricsLimit]
	}
	recap.UserID = userID
	recap.Year = year
	recap.Debug = domain.RecapDebug{
		GeneratorVersion: "v1",
		SeedProfile:      recap.Role.Code + "_1",
	}

	existing, err := s.recaps.GetUserRecapByIDAndYear(ctx, userID, year)
	if err != nil {
		return domain.Recap{}, false, fmt.Errorf("get existing recap: %w", err)
	}

	if existing == nil {
		if err := s.recaps.Create(ctx, &recap); err != nil {
			return domain.Recap{}, false, fmt.Errorf("create recap: %w", err)
		}

		return recap, true, nil
	}

	recap.ID = existing.ID
	recap.CreatedAt = existing.CreatedAt
	if err := s.recaps.Update(ctx, &recap); err != nil {
		return domain.Recap{}, false, fmt.Errorf("update recap: %w", err)
	}

	return recap, false, nil
}

func (s *RecapService) GetUserRecap(ctx context.Context, userID int64, year int) (domain.Recap, error) {
	recap, err := s.recaps.GetUserRecapByIDAndYear(ctx, userID, year)
	if err != nil {
		return domain.Recap{}, fmt.Errorf("get recap: %w", err)
	}

	if recap == nil {
		return domain.Recap{}, notFound("RECAP_NOT_FOUND", "recap not found")
	}

	return newRecapFromYearlyRecap(*recap)
}

func (s *RecapService) ListUserAchievements(ctx context.Context, userID int64) ([]domain.UserAchievement, error) {
	if _, err := s.users.GetByID(ctx, userID); err != nil {
		return nil, mapUserError(err)
	}

	return s.recaps.ListUserAchievements(ctx, userID)
}

func (s *RecapService) GetUserStats(ctx context.Context, userID int64, year int) (domain.YearMetrics, error) {
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return domain.YearMetrics{}, mapUserError(err)
	}

	metrics, err := s.metrics.GetByUserIDAndYear(ctx, *user, year)
	if err != nil {
		return domain.YearMetrics{}, fmt.Errorf("get user stats: %w", err)
	}

	return *metrics, nil
}

func newRecapFromYearlyRecap(yearlyRecap domain.YearlyRecap) (domain.Recap, error) {
	var payload domain.YearlyRecapPayload
	if err := json.Unmarshal(yearlyRecap.Payload, &payload); err != nil {
		return domain.Recap{}, fmt.Errorf("unmarshal recap payload: %w", err)
	}

	return domain.Recap{
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
