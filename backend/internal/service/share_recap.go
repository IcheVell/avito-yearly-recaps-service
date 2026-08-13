package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"

	"v1/internal/domain/entity"
	"v1/internal/domain/recap"
	"v1/internal/engine"
)

type RecapReader interface {
	GetUserRecap(ctx context.Context, userID int64, year int) (recap.Recap, error)
}

type ShareRecapRepository interface {
	Create(
		ctx context.Context,
		token string,
		userID int64,
		year int,
		recapID int64,
		share *recap.ShareRecap,
	) (*entity.ShareRecap, error)
	GetByToken(ctx context.Context, token string) (*entity.ShareRecap, error)
}

type ShareRecapService struct {
	recaps RecapReader
	shares ShareRecapRepository
}

func NewShareRecapService(recaps RecapReader, shares ShareRecapRepository) *ShareRecapService {
	return &ShareRecapService{
		recaps: recaps,
		shares: shares,
	}
}

func (s *ShareRecapService) GenerateShareRecap(ctx context.Context, userID int64, year int) (string, error) {
	yearRecap, err := s.recaps.GetUserRecap(ctx, userID, year)
	if err != nil {
		return "", err
	}

	shareRecap, err := engine.GenerateShareRecap(yearRecap)
	if err != nil {
		return "", err
	}

	token, err := getShareToken()
	if err != nil {
		return "", err
	}

	if _, err := s.shares.Create(ctx, token, userID, year, yearRecap.ID, shareRecap); err != nil {
		return "", fmt.Errorf("save share recap: %w", err)
	}

	return "/share/" + token, nil
}

func (s *ShareRecapService) GetShareRecapByToken(ctx context.Context, token string) (*recap.ShareRecap, error) {
	if token == "" {
		return nil, notFound("SHARE_NOT_FOUND", "share not found")
	}

	row, err := s.shares.GetByToken(ctx, token)
	if err != nil {
		return nil, fmt.Errorf("get share recap: %w", err)
	}
	if row == nil {
		return nil, notFound("SHARE_NOT_FOUND", "share not found")
	}

	var share recap.ShareRecap
	if err := json.Unmarshal(row.Payload, &share); err != nil {
		return nil, fmt.Errorf("unmarshal share recap payload: %w", err)
	}

	return &share, nil
}

func getShareToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate share token: %w", err)
	}

	return fmt.Sprintf("%x", b), nil
}
