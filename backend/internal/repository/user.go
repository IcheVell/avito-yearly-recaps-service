package repository

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"v1/internal/domain/entity"
	applog "v1/internal/logger"

	"gorm.io/gorm"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepository struct {
	db     *gorm.DB
	logger *slog.Logger
}

func NewUserRepository(db *gorm.DB, logger *slog.Logger) *UserRepository {
	return &UserRepository{
		db:     db,
		logger: applog.WithComponent(logger, "user_repository"),
	}
}

func (r *UserRepository) GetByID(ctx context.Context, id int64) (*entity.User, error) {
	var user entity.User

	err := r.db.WithContext(ctx).First(&user, id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}

		r.logger.ErrorContext(ctx, "get user failed", "user_id", id, "err", err, "operation", "get_user")
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}

	return &user, nil
}

func (r *UserRepository) ListProfiles(ctx context.Context) ([]entity.User, error) {
	var users []entity.User

	err := r.db.WithContext(ctx).Order("username asc").Find(&users).Error

	if err != nil {
		r.logger.ErrorContext(ctx, "list profiles failed", "err", err, "operation", "list_profiles")
		return nil, fmt.Errorf("failed to get users: %w", err)
	}

	return users, nil
}
