package postgres

import (
	"context"
	"fmt"
	"v1/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func New(ctx context.Context, cfg config.Config) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{})

	if err != nil {
		return nil, fmt.Errorf("can't connect to postgres: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("can't get database connection: %w", err)
	}

	if err := sqlDB.PingContext(ctx); err != nil {
		_ = sqlDB.Close()
		return nil, fmt.Errorf("can't ping postgres: %w", err)
	}

	return db, nil
}
