package service

import (
	"context"
	"errors"
	"log/slog"
	"testing"
	"time"

	"v1/internal/domain/entity"
	"v1/internal/domain/recap"
	applog "v1/internal/logger"
	"v1/internal/repository"
)

func testLogger() *slog.Logger {
	return applog.NewDiscard()
}

func float64Ptr(v float64) *float64 {
	return &v
}

type fakeUsers struct {
	user *entity.User
	err  error
}

func (f fakeUsers) GetByID(ctx context.Context, id int64) (*entity.User, error) {
	if f.err != nil {
		return nil, f.err
	}
	if f.user == nil {
		return nil, repository.ErrUserNotFound
	}
	if f.user.ID != id {
		return nil, repository.ErrUserNotFound
	}
	return f.user, nil
}

func (f fakeUsers) ListProfiles(ctx context.Context) ([]entity.User, error) {
	if f.user == nil {
		return nil, nil
	}
	return []entity.User{*f.user}, nil
}

type fakeUserStats struct {
	stats        *entity.UserStats
	getErr       error
	updateErr    error
	updateCalls  int
	lastFrom     time.Time
	lastTo       time.Time
	reloadAfter  *entity.UserStats
	getCallCount int
}

func (f *fakeUserStats) GetByUserID(ctx context.Context, userID int64) (*entity.UserStats, error) {
	f.getCallCount++
	if f.getErr != nil {
		return nil, f.getErr
	}
	if f.getCallCount > 1 && f.reloadAfter != nil {
		cp := *f.reloadAfter
		return &cp, nil
	}
	if f.stats == nil {
		return nil, repository.ErrUserStatsNotFound
	}
	cp := *f.stats
	return &cp, nil
}

func (f *fakeUserStats) Update(ctx context.Context, userID int64, from time.Time, to time.Time) error {
	f.updateCalls++
	f.lastFrom = from
	f.lastTo = to
	return f.updateErr
}

type fakeAchievementsRepo struct {
	rules       []recap.Rule
	rulesErr    error
	addErr      error
	addedIDs    []int64
	earned      []entity.UserAchievement
	locked      []entity.Achievement
	listErr     error
	listCalls   int
	listUserIDs []int64
}

func (f *fakeAchievementsRepo) ListUserAchievements(ctx context.Context, userID int64) ([]entity.UserAchievement, []entity.Achievement, error) {
	f.listCalls++
	f.listUserIDs = append(f.listUserIDs, userID)
	if f.listErr != nil {
		return nil, nil, f.listErr
	}
	return f.earned, f.locked, nil
}

func (f *fakeAchievementsRepo) AddAchievementToUser(ctx context.Context, userID int64, achievementID int64) error {
	if f.addErr != nil {
		return f.addErr
	}
	f.addedIDs = append(f.addedIDs, achievementID)
	return nil
}

func (f *fakeAchievementsRepo) GetRulesForAchievements(ctx context.Context) ([]recap.Rule, error) {
	if f.rulesErr != nil {
		return nil, f.rulesErr
	}
	return f.rules, nil
}

func TestUpdateUserAchievements_AwardsMatchingRules(t *testing.T) {
	processedAt := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	users := fakeUsers{user: &entity.User{ID: 42, Username: "alina"}}
	statsRepo := &fakeUserStats{
		stats: &entity.UserStats{
			UserID:      42,
			BuysCount:   5,
			SellsCount:  0,
			ProcessedAt: processedAt,
		},
		reloadAfter: &entity.UserStats{
			UserID:      42,
			BuysCount:   5,
			SellsCount:  2,
			ProcessedAt: processedAt.Add(time.Hour),
		},
	}
	achievements := &fakeAchievementsRepo{
		rules: []recap.Rule{
			{
				ID: 100,
				RuleNode: recap.RuleNode{
					Type:     recap.RuleTypeCondition,
					Metric:   "buys_count",
					Operator: ">=",
					Value:    float64Ptr(5),
				},
			},
			{
				ID: 200,
				RuleNode: recap.RuleNode{
					Type:     recap.RuleTypeCondition,
					Metric:   "sells_count",
					Operator: ">=",
					Value:    float64Ptr(10),
				},
			},
			{
				ID: 300,
				RuleNode: recap.RuleNode{
					Type:     recap.RuleTypeCondition,
					Metric:   "sells_count",
					Operator: ">=",
					Value:    float64Ptr(2),
				},
			},
		},
	}

	svc := NewAchievementService(achievements, users, statsRepo, testLogger())
	evaluations, err := svc.UpdateUserAchievements(context.Background(), 42)
	if err != nil {
		t.Fatalf("UpdateUserAchievements() error = %v", err)
	}
	if len(evaluations) != 3 {
		t.Fatalf("evaluations len = %d, want 3", len(evaluations))
	}

	if statsRepo.updateCalls != 1 {
		t.Fatalf("stats Update calls = %d, want 1", statsRepo.updateCalls)
	}
	if !statsRepo.lastFrom.Equal(processedAt) {
		t.Fatalf("Update from = %v, want %v", statsRepo.lastFrom, processedAt)
	}
	if len(achievements.addedIDs) != 2 || achievements.addedIDs[0] != 100 || achievements.addedIDs[1] != 300 {
		t.Fatalf("addedIDs = %v, want [100 300]", achievements.addedIDs)
	}
}

func TestUpdateUserAchievements_UserNotFound(t *testing.T) {
	svc := NewAchievementService(
		&fakeAchievementsRepo{},
		fakeUsers{err: repository.ErrUserNotFound},
		&fakeUserStats{},
		testLogger(),
	)

	_, err := svc.UpdateUserAchievements(context.Background(), 1)
	var httpErr HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatalf("error type = %T, want HTTPError", err)
	}
	if httpErr.ErrorCode() != "USER_NOT_FOUND" {
		t.Fatalf("ErrorCode = %q, want USER_NOT_FOUND", httpErr.ErrorCode())
	}
}

func TestListUserAchievements_SyncsThenLists(t *testing.T) {
	users := fakeUsers{user: &entity.User{ID: 7}}
	statsRepo := &fakeUserStats{
		stats: &entity.UserStats{UserID: 7, BuysCount: 1, ProcessedAt: time.Now().UTC()},
	}
	achievements := &fakeAchievementsRepo{
		rules: []recap.Rule{{
			ID: 11,
			RuleNode: recap.RuleNode{
				Type:     recap.RuleTypeCondition,
				Metric:   "buys_count",
				Operator: ">=",
				Value:    float64Ptr(1),
			},
		}},
		earned: []entity.UserAchievement{{UserID: 7, AchievementID: 11}},
		locked: []entity.Achievement{{ID: 12, Code: "locked"}},
	}

	svc := NewAchievementService(achievements, users, statsRepo, testLogger())
	earned, locked, evaluations, err := svc.ListUserAchievements(context.Background(), 7)
	if err != nil {
		t.Fatalf("ListUserAchievements() error = %v", err)
	}
	if achievements.listCalls != 1 {
		t.Fatalf("listCalls = %d, want 1", achievements.listCalls)
	}
	if len(achievements.addedIDs) != 1 || achievements.addedIDs[0] != 11 {
		t.Fatalf("addedIDs = %v, want [11]", achievements.addedIDs)
	}
	if len(earned) != 1 || earned[0].AchievementID != 11 {
		t.Fatalf("earned = %+v", earned)
	}
	if len(locked) != 1 || locked[0].ID != 12 {
		t.Fatalf("locked = %+v", locked)
	}
	if len(evaluations) != 1 {
		t.Fatalf("evaluations len = %d, want 1", len(evaluations))
	}
}
