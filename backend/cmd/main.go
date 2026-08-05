package main

import (
	"context"
	"log/slog"
	"os"
	"time"
	"v1/internal/config"
	"v1/internal/postgres"
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

	_, err = postgres.New(ctx, cfg)
	if err != nil {
		logger.Error("database connection failed", "err", err)
		os.Exit(1)
	}

	logger.Info("database connected", "operation", "connect_database")
}
