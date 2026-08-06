package service

import (
	"context"
	"v1/internal/domain"
	"v1/internal/engine"
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
	GetUserRecapByIDAndYear(ctx context.Context, userID int64, year int) (*domain.YearlyRecap, error)
	GetUserAchievements(ctx context.Context, userID int64) ([]domain.YearAchievement, error)
}

type RecapService struct {
	userRepo   UserRepository
	metricRepo MetricsRepository
	recapRepo  RecapRepository
}

func NewRecapService(userRepo UserRepository, metricRepo MetricsRepository, recapRepo RecapRepository) *RecapService {
	return &RecapService{
		userRepo:   userRepo,
		metricRepo: metricRepo,
		recapRepo:  recapRepo,
	}
}

func (s *RecapService) GenerateRecap(ctx context.Context, userID int64, year int) (domain.Recap, bool, error) {
	user, err := s.userRepo.GetByID(ctx, userID)

	if err != nil {
		return domain.Recap{}, false, err
	}

	yearMetrics, err := s.metricRepo.GetByUserIDAndYear(ctx, *user, year)
	if err != nil {
		return domain.Recap{}, false, err
	}

	recap, err := engine.Generate(*yearMetrics)

	if err != nil {
		return domain.Recap{}, false, err
	}

	return recap, true, nil
}

/*
TODO: delete after change routes
*/
func (s *RecapService) GetRecap(ctx context.Context, recapID int64) (domain.Recap, error) {
	return domain.Recap{}, nil
}
