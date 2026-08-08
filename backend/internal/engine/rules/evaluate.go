package rules

import (
	"fmt"

	"v1/internal/domain/entity"
	"v1/internal/domain/recap"
)

// EvaluateRule checks whether a rule tree is satisfied by the given user stats.
func EvaluateRule(rule recap.RuleNode, stats entity.UserStats) (bool, error) {
	switch rule.Type {
	case recap.RuleTypeCondition:
		return evaluateCondition(rule, stats)

	case recap.RuleTypeAll:
		for _, condition := range rule.Conditions {
			ok, err := EvaluateRule(condition, stats)
			if err != nil {
				return false, err
			}

			if !ok {
				return false, nil
			}
		}

		return true, nil

	case recap.RuleTypeAny:
		for _, condition := range rule.Conditions {
			ok, err := EvaluateRule(condition, stats)
			if err != nil {
				return false, err
			}

			if ok {
				return true, nil
			}
		}

		return false, nil

	default:
		return false, fmt.Errorf("unknown rule type: %s", rule.Type)
	}
}

func evaluateCondition(rule recap.RuleNode, stats entity.UserStats) (bool, error) {
	if rule.Value == nil {
		return false, fmt.Errorf("rule value is nil")
	}

	actual, err := getMetricValue(stats, rule.Metric)
	if err != nil {
		return false, err
	}

	expected := *rule.Value

	switch rule.Operator {
	case ">=":
		return actual >= expected, nil

	case ">":
		return actual > expected, nil

	case "<=":
		return actual <= expected, nil

	case "<":
		return actual < expected, nil

	case "==":
		return actual == expected, nil

	default:
		return false, fmt.Errorf("unknown operator: %s", rule.Operator)
	}
}

func getMetricValue(stats entity.UserStats, metric string) (float64, error) {
	switch metric {
	case "buys_count":
		return float64(stats.BuysCount), nil

	case "sells_count":
		return float64(stats.SellsCount), nil

	case "favorites_count":
		return float64(stats.FavoritesCount), nil

	case "conversations_count":
		return float64(stats.ConversationsCount), nil

	case "spent_amount":
		return float64(stats.SpentAmount), nil

	case "max_streak_days":
		return float64(stats.MaxStreakDays), nil

	case "max_inactive_gap_days":
		return float64(stats.MaxInactiveGapDays), nil

	case "seller_rating":
		if stats.ReviewsCount == 0 {
			return 0, nil
		}

		return float64(stats.RatingSum) / float64(stats.ReviewsCount), nil

	default:
		return 0, fmt.Errorf("unknown metric: %s", metric)
	}
}
