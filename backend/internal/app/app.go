package app

import (
	"context"
	"os"
	"time"

	"v1/internal/config"
	applog "v1/internal/logger"
	"v1/internal/postgres"
	"v1/internal/server"
)

func Run(ctx context.Context) error {
	config.LoadEnv()

	logger, err := applog.NewFromEnv()
	if err != nil {
		_, _ = os.Stderr.WriteString("logger init failed: " + err.Error() + "\n")
		return err
	}

	appLogger := applog.WithComponent(logger, "app")
	applog.SetDefault(logger)

	cfg, err := config.NewConfig()
	if err != nil {
		appLogger.Error("config load failed", "err", err)
		return err
	}

	startupCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	db, err := postgres.New(startupCtx, cfg, logger)
	if err != nil {
		appLogger.Error("database connection failed", "err", err)
		return err
	}

	appLogger.Info("database connected", "operation", "connect_database")
	appLogger.Info(
		"recap year configured",
		"recap_year", cfg.RecapYear,
		"operation", "load_config",
	)

	if err := server.Run(cfg, db, logger); err != nil {
		return err
	}

	return nil
}
