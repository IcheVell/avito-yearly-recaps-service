package repository

import (
	"context"
	"errors"
	"fmt"
	"v1/internal/domain"

	"gorm.io/gorm"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	var user domain.User

	err := r.db.WithContext(ctx).First(&user, id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}

		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}

	return &user, nil
}

func (r *UserRepository) ListProfiles(ctx context.Context) ([]domain.User, error) {
	var users []domain.User

	err := r.db.
		WithContext(ctx).
		Order("username ASC").
		Find(&users).
		Error

	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}

	return users, nil
}
