package engine

import (
	"testing"
	"v1/internal/domain/recap"
)

func TestGenerate_OK(t *testing.T) {
	var earned int64 = 10000
	m := recap.YearMetrics{
		UserID:        1,
		EarnedAmount:  &earned,
		MaxStreakDays: 10,
		ActiveDays:    50,
		ViewsCount:    100,
		SellsCount:    2,
		YearAchievements: []recap.YearAchievement{
			{Code: "diplomat", Name: "Дипломат", Description: "Торг удался", ImageURL: "diplomat.png"},
			{Code: "unbending", Name: "Несгибаемый", Description: "Держишь цену", ImageURL: "unbending.png"},
			{Code: "both_sides", Name: "Две стороны рынка", Description: "И покупаешь, и продаёшь", ImageURL: "both.png"},
			{Code: "extra", Name: "Лишняя", Description: "Не должна попасть", ImageURL: "extra.png"},
		},
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

	if len(recap.Achievements) != achievementsNum {
		t.Fatalf("achievements len = %d, want %d", len(recap.Achievements), achievementsNum)
	}
	if recap.Achievements[0].Code != "diplomat" {
		t.Fatalf("first achievement = %q, want diplomat", recap.Achievements[0].Code)
	}
	if recap.Achievements[0].Name == "" || recap.Achievements[0].Description == "" {
		t.Fatal("achievement name/description empty")
	}
	for _, a := range recap.Achievements {
		if a.Code == "extra" {
			t.Fatal("4th achievement should be truncated")
		}
	}
}
