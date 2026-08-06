package main

import (
	"context"
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
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("component", "app")
	slog.SetDefault(logger)

	cfg, err := config.NewConfig()
	if err != nil {
		logger.Error("config load failed", "err", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	db, err := postgres.New(ctx, cfg)
	if err != nil {
		logger.Error("database connection failed", "err", err)
		os.Exit(1)
	}

	logger.Info("database connected", "operation", "connect_database")

	userRepo := repository.NewUserRepository(db)
	metricsRepo := repository.NewMetricsRepository(db)
	recapRepo := repository.NewRecapRepository(db)

	recapService := service.NewRecapService(userRepo, metricsRepo, recapRepo)

	deps := api.Dependencies{Profiles: userRepo, Recaps: recapService, Logger: logger}

	router := api.NewRouter(deps)

	server := &http.Server{Addr: ":8080", Handler: router}

	server.ListenAndServe()
}
