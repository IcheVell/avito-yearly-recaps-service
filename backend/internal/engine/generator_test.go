package engine

import (
	"testing"
	"v1/internal/domain"
)

func TestGenerate_OK(t *testing.T) {
	var earned int64 = 10000
	m := domain.YearMetrics{
		UserID:        1,
		EarnedAmount:  &earned,
		MaxStreakDays: 10,
		ActiveDays:    50,
		ViewsCount:    100,
		SellsCount:    2,
	}

	recap, err := Generate(m)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if recap.UserID != 1 {
		t.Fatalf("UserID = %d, want 1", recap.UserID)
	}
	if recap.Role.Code == "" {
		t.Fatal("empty role")
	}
	if len(recap.Metrics) == 0 || len(recap.Metrics) > 3 {
		t.Fatalf("metrics len = %d, want 1..3", len(recap.Metrics))
	}
	if recap.Action.Type == "" {
		t.Fatal("empty action")
	}
}
