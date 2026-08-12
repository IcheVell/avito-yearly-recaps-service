package rules

import (
	"fmt"

	"v1/internal/domain/entity"
	"v1/internal/domain/recap"
)

func EvaluateRule(rule recap.RuleNode, stats entity.UserStats) (*recap.RuleEvaluation, error) {
	mainRule := &recap.RuleEvaluation{
		Type:      rule.Type,
		Condition: nil,
		Children:  make([]recap.RuleEvaluation, 0, len(rule.Conditions)),
	}

	if rule.Type == recap.RuleTypeAll {
		mainRule.IsComplete = true
	}

	if rule.Type == recap.RuleTypeAny {
		mainRule.IsComplete = false
	}

	switch rule.Type {
	case recap.RuleTypeCondition:
		return evaluateCondition(rule, stats)

	case recap.RuleTypeAll:
		for _, condition := range rule.Conditions {
			newRule, err := EvaluateRule(condition, stats)
			if err != nil {
				return nil, err
			}

			if !newRule.IsComplete {
				mainRule.IsComplete = false
			}

			mainRule.Children = append(mainRule.Children, *newRule)
		}

		return mainRule, nil

	case recap.RuleTypeAny:
		for _, condition := range rule.Conditions {
			newRule, err := EvaluateRule(condition, stats)
			if err != nil {
				return nil, err
			}

			if newRule.IsComplete {
				mainRule.IsComplete = true
			}

			mainRule.Children = append(mainRule.Children, *newRule)
		}

		return mainRule, nil

	default:
		return nil, fmt.Errorf("unknown rule type: %s", rule.Type)
	}
}

func evaluateCondition(rule recap.RuleNode, stats entity.UserStats) (*recap.RuleEvaluation, error) {
	if rule.Value == nil {
		return nil, fmt.Errorf("rule value is nil")
	}

	actual, err := getMetricValue(stats, rule.Metric)
	if err != nil {
		return nil, err
	}

	expected := *rule.Value

	ruleEvaluation := &recap.RuleEvaluation{
		Type: recap.RuleTypeCondition,
		Condition: &recap.ConditionEvaluation{
			Metric:   rule.Metric,
			Operator: rule.Operator,
			Actual:   actual,
			Expected: expected,
		},
		Children: make([]recap.RuleEvaluation, 0),
	}

	switch rule.Operator {
	case ">=":
		ruleEvaluation.IsComplete = actual >= expected
		return ruleEvaluation, nil

	case ">":
		ruleEvaluation.IsComplete = actual > expected
		return ruleEvaluation, nil

	case "<=":
		ruleEvaluation.IsComplete = actual <= expected
		return ruleEvaluation, nil

	case "<":
		ruleEvaluation.IsComplete = actual < expected
		return ruleEvaluation, nil

	case "==":
		ruleEvaluation.IsComplete = actual == expected
		return ruleEvaluation, nil

	default:
		return nil, fmt.Errorf("unknown operator: %s", rule.Operator)
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
		return stats.SpentAmount, nil

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
