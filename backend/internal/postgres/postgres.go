package postgres

import (
	"context"
	"fmt"
	"log/slog"
	"v1/internal/config"
	applog "v1/internal/logger"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func New(ctx context.Context, cfg config.Config, logger *slog.Logger) (*gorm.DB, error) {
	logger = applog.WithComponent(logger, "postgres")

	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{})

	if err != nil {
		logger.ErrorContext(ctx, "postgres open failed", "err", err, "operation", "connect_database")
		return nil, fmt.Errorf("can't connect to postgres: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		logger.ErrorContext(ctx, "postgres connection handle failed", "err", err, "operation", "connect_database")
		return nil, fmt.Errorf("can't get database connection: %w", err)
	}

	if err := sqlDB.PingContext(ctx); err != nil {
		_ = sqlDB.Close()
		logger.ErrorContext(ctx, "postgres ping failed", "err", err, "operation", "connect_database")
		return nil, fmt.Errorf("can't ping postgres: %w", err)
	}

	return db, nil
}
