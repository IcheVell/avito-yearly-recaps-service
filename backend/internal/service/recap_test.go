package service

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"v1/internal/domain/entity"
	"v1/internal/domain/recap"
	"v1/internal/repository"

	"gorm.io/datatypes"
)

type fakeMetrics struct {
	metrics *recap.YearMetrics
	err     error
	calls   int
	userID  int64
	year    int
}

func (f *fakeMetrics) GetByUserIDAndYear(ctx context.Context, user entity.User, year int) (*recap.YearMetrics, error) {
	f.calls++
	f.userID = user.ID
	f.year = year
	if f.err != nil {
		return nil, f.err
	}
	if f.metrics == nil {
		return &recap.YearMetrics{UserID: user.ID}, nil
	}
	cp := *f.metrics
	cp.UserID = user.ID
	return &cp, nil
}

type fakeRecaps struct {
	existing    *entity.YearlyRecap
	getErr      error
	createErr   error
	updateErr   error
	createCalls int
	updateCalls int
	created     *recap.Recap
	updated     *recap.Recap
}

func (f *fakeRecaps) Create(ctx context.Context, story *recap.Recap) error {
	f.createCalls++
	if f.createErr != nil {
		return f.createErr
	}
	story.ID = 501
	story.CreatedAt = time.Date(2026, 2, 1, 12, 0, 0, 0, time.UTC)
	cp := *story
	f.created = &cp
	return nil
}

func (f *fakeRecaps) Update(ctx context.Context, story *recap.Recap) error {
	f.updateCalls++
	if f.updateErr != nil {
		return f.updateErr
	}
	cp := *story
	f.updated = &cp
	return nil
}

func (f *fakeRecaps) GetUserRecapByIDAndYear(ctx context.Context, userID int64, year int) (*entity.YearlyRecap, error) {
	if f.getErr != nil {
		return nil, f.getErr
	}
	return f.existing, nil
}

type fakeAchievementSync struct {
	err   error
	calls []int64
}

func (f *fakeAchievementSync) UpdateUserAchievements(ctx context.Context, userID int64) ([]*recap.AchievementEvaluation, error) {
	f.calls = append(f.calls, userID)
	return nil, f.err
}

func testYearMetrics() *recap.YearMetrics {
	var earned int64 = 10000
	return &recap.YearMetrics{
		EarnedAmount:  &earned,
		MaxStreakDays: 10,
		ActiveDays:    50,
		ViewsCount:    100,
		SellsCount:    2,
		YearAchievements: []recap.YearAchievement{
			{Code: "diplomat", Name: "Дипломат", Description: "Торг удался", ImageURL: "diplomat.png"},
		},
	}
}

func TestGenerateRecap_CreatesWhenMissing(t *testing.T) {
	users := fakeUsers{user: &entity.User{ID: 910001, Username: "alina", CreatedAt: time.Date(2018, 4, 12, 0, 0, 0, 0, time.UTC)}}
	metrics := &fakeMetrics{metrics: testYearMetrics()}
	recaps := &fakeRecaps{}
	achievements := &fakeAchievementSync{}

	svc := NewRecapService(users, metrics, recaps, achievements, testLogger())
	story, created, err := svc.GenerateRecap(context.Background(), 910001, 2026)
	if err != nil {
		t.Fatalf("GenerateRecap() error = %v", err)
	}
	if !created {
		t.Fatal("created = false, want true")
	}
	if story.ID != 501 {
		t.Fatalf("ID = %d, want 501", story.ID)
	}
	if story.UserID != 910001 || story.Year != 2026 {
		t.Fatalf("UserID/Year = %d/%d, want 910001/2026", story.UserID, story.Year)
	}
	if story.Role.Code == "" {
		t.Fatal("empty role")
	}
	if story.Debug.GeneratorVersion != "v1" {
		t.Fatalf("GeneratorVersion = %q, want v1", story.Debug.GeneratorVersion)
	}
	if len(achievements.calls) != 1 || achievements.calls[0] != 910001 {
		t.Fatalf("achievement sync calls = %v, want [910001]", achievements.calls)
	}
	if metrics.calls != 1 || metrics.year != 2026 {
		t.Fatalf("metrics calls=%d year=%d", metrics.calls, metrics.year)
	}
	if recaps.createCalls != 1 || recaps.updateCalls != 0 {
		t.Fatalf("create/update calls = %d/%d", recaps.createCalls, recaps.updateCalls)
	}
	if len(story.Metrics) > recapMetricsLimit {
		t.Fatalf("metrics len = %d, want <= %d", len(story.Metrics), recapMetricsLimit)
	}
}

func TestGenerateRecap_UpdatesWhenExists(t *testing.T) {
	existingAt := time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC)
	users := fakeUsers{user: &entity.User{ID: 1, CreatedAt: time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)}}
	metrics := &fakeMetrics{metrics: testYearMetrics()}
	recaps := &fakeRecaps{
		existing: &entity.YearlyRecap{
			ID:        77,
			UserID:    1,
			Year:      2026,
			CreatedAt: existingAt,
		},
	}
	achievements := &fakeAchievementSync{}

	svc := NewRecapService(users, metrics, recaps, achievements, testLogger())
	story, created, err := svc.GenerateRecap(context.Background(), 1, 2026)
	if err != nil {
		t.Fatalf("GenerateRecap() error = %v", err)
	}
	if created {
		t.Fatal("created = true, want false")
	}
	if story.ID != 77 {
		t.Fatalf("ID = %d, want 77", story.ID)
	}
	if !story.CreatedAt.Equal(existingAt) {
		t.Fatalf("CreatedAt = %v, want %v", story.CreatedAt, existingAt)
	}
	if recaps.createCalls != 0 || recaps.updateCalls != 1 {
		t.Fatalf("create/update calls = %d/%d", recaps.createCalls, recaps.updateCalls)
	}
}

func TestGenerateRecap_SyncsAchievementsBeforeGenerate(t *testing.T) {
	users := fakeUsers{user: &entity.User{ID: 5, CreatedAt: time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)}}
	metrics := &fakeMetrics{metrics: testYearMetrics()}
	recaps := &fakeRecaps{}
	achievements := &fakeAchievementSync{err: errors.New("sync failed")}

	svc := NewRecapService(users, metrics, recaps, achievements, testLogger())
	_, _, err := svc.GenerateRecap(context.Background(), 5, 2026)
	if err == nil {
		t.Fatal("expected sync error")
	}
	if metrics.calls != 0 {
		t.Fatalf("metrics should not be called after sync failure, calls=%d", metrics.calls)
	}
	if recaps.createCalls != 0 {
		t.Fatal("create should not be called after sync failure")
	}
}

func TestGenerateRecap_UserNotFound(t *testing.T) {
	svc := NewRecapService(
		fakeUsers{err: repository.ErrUserNotFound},
		&fakeMetrics{},
		&fakeRecaps{},
		&fakeAchievementSync{},
		testLogger(),
	)

	_, _, err := svc.GenerateRecap(context.Background(), 999, 2026)
	var httpErr HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatalf("error type = %T, want HTTPError", err)
	}
	if httpErr.ErrorCode() != "USER_NOT_FOUND" {
		t.Fatalf("ErrorCode = %q, want USER_NOT_FOUND", httpErr.ErrorCode())
	}
}

func TestGetUserRecap_OK(t *testing.T) {
	payload, err := json.Marshal(recap.YearlyRecapPayload{
		Role: recap.RecapRole{Code: "buyer", Name: "Покупатель"},
		Debug: recap.RecapDebug{
			GeneratorVersion: "v1",
			SeedProfile:      "buyer_1",
		},
	})
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}

	recaps := &fakeRecaps{
		existing: &entity.YearlyRecap{
			ID:        9,
			UserID:    3,
			Year:      2026,
			CreatedAt: time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC),
			Payload:   datatypes.JSON(payload),
		},
	}

	svc := NewRecapService(fakeUsers{}, &fakeMetrics{}, recaps, &fakeAchievementSync{}, testLogger())
	story, err := svc.GetUserRecap(context.Background(), 3, 2026)
	if err != nil {
		t.Fatalf("GetUserRecap() error = %v", err)
	}
	if story.ID != 9 || story.Role.Code != "buyer" {
		t.Fatalf("story = %+v", story)
	}
}

func TestGetUserRecap_NotFound(t *testing.T) {
	svc := NewRecapService(fakeUsers{}, &fakeMetrics{}, &fakeRecaps{}, &fakeAchievementSync{}, testLogger())
	_, err := svc.GetUserRecap(context.Background(), 3, 2026)
	var httpErr HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatalf("error type = %T, want HTTPError", err)
	}
	if httpErr.ErrorCode() != "RECAP_NOT_FOUND" {
		t.Fatalf("ErrorCode = %q, want RECAP_NOT_FOUND", httpErr.ErrorCode())
	}
}
