package rules

import (
	"testing"

	"v1/internal/domain/entity"
	"v1/internal/domain/recap"
)

func floatPtr(v float64) *float64 {
	return &v
}

func condition(metric, operator string, value float64) recap.RuleNode {
	return recap.RuleNode{
		Type:     recap.RuleTypeCondition,
		Metric:   metric,
		Operator: operator,
		Value:    floatPtr(value),
	}
}

func TestEvaluateRule_ConditionOperators(t *testing.T) {
	stats := entity.UserStats{BuysCount: 5}

	tests := []struct {
		name     string
		operator string
		value    float64
		want     bool
	}{
		{name: "gte true", operator: ">=", value: 5, want: true},
		{name: "gte false", operator: ">=", value: 6, want: false},
		{name: "gt true", operator: ">", value: 4, want: true},
		{name: "gt false", operator: ">", value: 5, want: false},
		{name: "lte true", operator: "<=", value: 5, want: true},
		{name: "lte false", operator: "<=", value: 4, want: false},
		{name: "lt true", operator: "<", value: 6, want: true},
		{name: "lt false", operator: "<", value: 5, want: false},
		{name: "eq true", operator: "==", value: 5, want: true},
		{name: "eq false", operator: "==", value: 4, want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ok, err := EvaluateRule(condition("buys_count", tt.operator, tt.value), stats)
			if err != nil {
				t.Fatalf("EvaluateRule() error = %v", err)
			}
			if ok == nil {
				t.Fatal("EvaluateRule() returned nil evaluation")
			}

			if ok.IsComplete != tt.want {
				t.Fatalf("EvaluateRule().IsComplete = %v, want %v", ok.IsComplete, tt.want)
			}
		})
	}
}

func TestEvaluateRule_Metrics(t *testing.T) {
	stats := entity.UserStats{
		BuysCount:          1,
		SellsCount:         2,
		FavoritesCount:     3,
		ConversationsCount: 4,
		SpentAmount:        1500.5,
		MaxStreakDays:      7,
		MaxInactiveGapDays: 10,
		RatingSum:          9,
		ReviewsCount:       2,
	}

	tests := []struct {
		name   string
		metric string
		value  float64
		want   bool
	}{
		{name: "buys_count", metric: "buys_count", value: 1, want: true},
		{name: "sells_count", metric: "sells_count", value: 2, want: true},
		{name: "favorites_count", metric: "favorites_count", value: 3, want: true},
		{name: "conversations_count", metric: "conversations_count", value: 4, want: true},
		{name: "spent_amount", metric: "spent_amount", value: 1500.5, want: true},
		{name: "max_streak_days", metric: "max_streak_days", value: 7, want: true},
		{name: "max_inactive_gap_days", metric: "max_inactive_gap_days", value: 10, want: true},
		{name: "seller_rating", metric: "seller_rating", value: 4.5, want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ok, err := EvaluateRule(condition(tt.metric, "==", tt.value), stats)
			if err != nil {
				t.Fatalf("EvaluateRule() error = %v", err)
			}
			if ok == nil {
				t.Fatal("EvaluateRule() returned nil evaluation")
			}

			if !ok.IsComplete {
				t.Fatalf("EvaluateRule().IsComplete = false, want true for metric %s", tt.metric)
			}
		})
	}
}

func TestEvaluateRule_SellerRatingWithoutReviews(t *testing.T) {
	ok, err := EvaluateRule(condition("seller_rating", "==", 0), entity.UserStats{})
	if err != nil {
		t.Fatalf("EvaluateRule() error = %v", err)
	}
	if ok == nil {
		t.Fatal("EvaluateRule() returned nil evaluation")
	}

	if !ok.IsComplete {
		t.Fatal("EvaluateRule().IsComplete = false, want true for zero rating without reviews")
	}
}

func TestEvaluateRule_AllAndAny(t *testing.T) {
	stats := entity.UserStats{BuysCount: 5, SellsCount: 1}

	t.Run("all true", func(t *testing.T) {
		ok, err := EvaluateRule(recap.RuleNode{
			Type: recap.RuleTypeAll,
			Conditions: []recap.RuleNode{
				condition("buys_count", ">=", 5),
				condition("sells_count", ">=", 1),
			},
		}, stats)
		if err != nil {
			t.Fatalf("EvaluateRule() error = %v", err)
		}
		if ok == nil {
			t.Fatal("EvaluateRule() returned nil evaluation")
		}

		if !ok.IsComplete {
			t.Fatal("EvaluateRule().IsComplete = false, want true")
		}
	})

	t.Run("all false", func(t *testing.T) {
		ok, err := EvaluateRule(recap.RuleNode{
			Type: recap.RuleTypeAll,
			Conditions: []recap.RuleNode{
				condition("buys_count", ">=", 5),
				condition("sells_count", ">=", 2),
			},
		}, stats)
		if err != nil {
			t.Fatalf("EvaluateRule() error = %v", err)
		}
		if ok == nil {
			t.Fatal("EvaluateRule() returned nil evaluation")
		}

		if ok.IsComplete {
			t.Fatal("EvaluateRule().IsComplete = true, want false")
		}
	})

	t.Run("any true", func(t *testing.T) {
		ok, err := EvaluateRule(recap.RuleNode{
			Type: recap.RuleTypeAny,
			Conditions: []recap.RuleNode{
				condition("buys_count", ">=", 100),
				condition("sells_count", ">=", 1),
			},
		}, stats)
		if err != nil {
			t.Fatalf("EvaluateRule() error = %v", err)
		}
		if ok == nil {
			t.Fatal("EvaluateRule() returned nil evaluation")
		}

		if !ok.IsComplete {
			t.Fatal("EvaluateRule().IsComplete = false, want true")
		}
	})

	t.Run("any false", func(t *testing.T) {
		ok, err := EvaluateRule(recap.RuleNode{
			Type: recap.RuleTypeAny,
			Conditions: []recap.RuleNode{
				condition("buys_count", ">=", 100),
				condition("sells_count", ">=", 100),
			},
		}, stats)
		if err != nil {
			t.Fatalf("EvaluateRule() error = %v", err)
		}
		if ok == nil {
			t.Fatal("EvaluateRule() returned nil evaluation")
		}

		if ok.IsComplete {
			t.Fatal("EvaluateRule().IsComplete = true, want false")
		}
	})

	t.Run("nested all any", func(t *testing.T) {
		ok, err := EvaluateRule(recap.RuleNode{
			Type: recap.RuleTypeAll,
			Conditions: []recap.RuleNode{
				condition("buys_count", ">=", 5),
				{
					Type: recap.RuleTypeAny,
					Conditions: []recap.RuleNode{
						condition("sells_count", ">=", 100),
						condition("favorites_count", "==", 0),
					},
				},
			},
		}, stats)
		if err != nil {
			t.Fatalf("EvaluateRule() error = %v", err)
		}
		if ok == nil {
			t.Fatal("EvaluateRule() returned nil evaluation")
		}

		if !ok.IsComplete {
			t.Fatal("EvaluateRule().IsComplete = false, want true")
		}
	})
}

func TestEvaluateRule_Errors(t *testing.T) {
	stats := entity.UserStats{BuysCount: 1}

	t.Run("unknown type", func(t *testing.T) {
		_, err := EvaluateRule(recap.RuleNode{Type: "weird"}, stats)
		if err == nil {
			t.Fatal("expected error")
		}
	})

	t.Run("nil value", func(t *testing.T) {
		_, err := EvaluateRule(recap.RuleNode{
			Type:     recap.RuleTypeCondition,
			Metric:   "buys_count",
			Operator: ">=",
		}, stats)
		if err == nil {
			t.Fatal("expected error")
		}
	})

	t.Run("unknown operator", func(t *testing.T) {
		_, err := EvaluateRule(condition("buys_count", "!=", 1), stats)
		if err == nil {
			t.Fatal("expected error")
		}
	})

	t.Run("unknown metric", func(t *testing.T) {
		_, err := EvaluateRule(condition("unknown_metric", ">=", 1), stats)
		if err == nil {
			t.Fatal("expected error for unknown metric")
		}
	})
}
