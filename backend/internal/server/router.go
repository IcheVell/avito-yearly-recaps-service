package server

import (
	"log/slog"
	"net/http"

	"v1/internal/api"
	"v1/internal/config"
	"v1/internal/repository"
	"v1/internal/service"

	"gorm.io/gorm"
)

func newRouter(cfg config.Config, db *gorm.DB, logger *slog.Logger) http.Handler {
	userRepo := repository.NewUserRepository(db, logger)
	metricsRepo := repository.NewMetricsRepository(db, logger)
	recapRepo := repository.NewRecapRepository(db, logger)
	achievementsRepo := repository.NewAchievementsRepository(db, logger)
	userStatsRepo := repository.NewUserStatsRepository(db, logger)

	achievementsService := service.NewAchievementService(achievementsRepo, userRepo, userStatsRepo, logger)
	recapService := service.NewRecapService(userRepo, metricsRepo, recapRepo, achievementsService, logger)

	return api.NewRouter(api.Dependencies{
		Profiles:     userRepo,
		Recaps:       recapService,
		Achievements: achievementsService,
		Stats:        recapService,
		CurrentYear:  cfg.RecapYear,
		Logger:       logger,
	})
}
