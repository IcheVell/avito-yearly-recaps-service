package repository

import (
	"context"
	"errors"
	"fmt"
	"os/user"

	"gorm.io/gorm"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetByID(ctx context.Context, id int64) (*user.User, error) {
	var user user.User

	err := r.db.WithContext(ctx).First(&user, id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}

		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}

	return &user, nil
}

func (r *UserRepository) List(ctx context.Context) ([]*user.User, error) {
	var users []*user.User

	err := r.db.WithContext(ctx).Order("username asc").Find(&users).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}

	return users, nil
}
