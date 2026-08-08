package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"time"
	"v1/internal/api"
	"v1/internal/config"
	"v1/internal/postgres"
	"v1/internal/repository"
	"v1/internal/service"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	appLogger := logger.With("component", "app")
	slog.SetDefault(appLogger)

	cfg, err := config.NewConfig()
	if err != nil {
		appLogger.Error("config load failed", "err", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	db, err := postgres.New(ctx, cfg)
	if err != nil {
		appLogger.Error("database connection failed", "err", err)
		os.Exit(1)
	}

	appLogger.Info("database connected", "operation", "connect_database")

	userRepo := repository.NewUserRepository(db)
	metricsRepo := repository.NewMetricsRepository(db)
	recapRepo := repository.NewRecapRepository(db)
	achievementsRepo := repository.NewAchievementsRepository(db)
	userStatsRepo := repository.NewUserStatsRepository(db)
	recapService := service.NewRecapService(userRepo, metricsRepo, recapRepo, logger)
	achievementsService := service.NewAchievementService(achievementsRepo, userRepo, userStatsRepo, logger)

	router := api.NewRouter(api.Dependencies{
		Profiles:     userRepo,
		Recaps:       recapService,
		Achievements: achievementsService,
		Stats:        recapService,
		CurrentYear:  cfg.RecapYear,
		Logger:       logger,
	})

	server := &http.Server{
		Addr:              ":8080",
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	appLogger.Info("http server started", "addr", server.Addr, "operation", "start_http_server")
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		appLogger.Error("http server failed", "err", err)
		os.Exit(1)
	}
}
