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
		countCompleted := 0

		for _, condition := range rule.Conditions {
			newRule, err := EvaluateRule(condition, stats)
			if err != nil {
				return nil, err
			}

			if !newRule.IsComplete {
				mainRule.IsComplete = false
			} else {
				countCompleted++
			}

			mainRule.Children = append(mainRule.Children, *newRule)
		}

		if len(rule.Conditions) == 0 {
			return nil, fmt.Errorf("no conditions found for rule type %s", rule.Type)
		}

		mainRule.Progress = (float64(countCompleted) / float64(len(rule.Conditions))) * 100

		return mainRule, nil

	case recap.RuleTypeAny:
		if len(rule.Conditions) == 0 {
			return nil, fmt.Errorf("no conditions found for rule type %s", rule.Type)
		}

		mainRule.IsComplete = false

		var maxProgress float64

		for _, condition := range rule.Conditions {
			newRule, err := EvaluateRule(condition, stats)
			if err != nil {
				return nil, err
			}

			if newRule.IsComplete {
				mainRule.IsComplete = true
			}

			if newRule.Progress > maxProgress {
				maxProgress = newRule.Progress
			}

			mainRule.Children = append(mainRule.Children, *newRule)
		}

		mainRule.Progress = maxProgress

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

	case ">":
		ruleEvaluation.IsComplete = actual > expected

	case "<=":
		ruleEvaluation.IsComplete = actual <= expected

	case "<":
		ruleEvaluation.IsComplete = actual < expected

	case "==":
		ruleEvaluation.IsComplete = actual == expected

	default:
		return nil, fmt.Errorf("unknown operator: %s", rule.Operator)
	}

	ruleEvaluation.Progress = calculateProgress(ruleEvaluation)

	return ruleEvaluation, nil
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

func calculateProgress(rule *recap.RuleEvaluation) float64 {
	if rule == nil || rule.Condition == nil {
		return 0
	}

	if rule.IsComplete {
		return 100
	}

	actual := rule.Condition.Actual
	expected := rule.Condition.Expected

	var progress float64

	switch rule.Condition.Operator {
	case ">=":
		if expected == 0 {
			return 0
		}

		progress = actual / expected * 100

	case ">":
		if expected == 0 {
			return 0
		}

		progress = actual / expected * 100
		if progress >= 100 {
			progress = 99
		}

	case "<=":
		if actual == 0 {
			return 0
		}

		progress = expected / actual * 100

	case "<":
		if actual == 0 {
			return 0
		}

		progress = expected / actual * 100
		if progress >= 100 {
			progress = 99
		}

	case "==":
		if expected == 0 {
			return 0
		}

		if actual < expected {
			progress = actual / expected * 100
		} else {
			if actual == 0 {
				return 0
			}

			progress = expected / actual * 100
		}

	default:
		return 0
	}

	if progress < 0 {
		return 0
	}

	if progress > 100 {
		return 100
	}

	return progress
}
