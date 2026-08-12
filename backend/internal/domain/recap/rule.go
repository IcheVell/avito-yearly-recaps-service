package recap

type RuleType string

const (
	RuleTypeCondition RuleType = "condition"
	RuleTypeAll       RuleType = "all"
	RuleTypeAny       RuleType = "any"
)

type RuleNode struct {
	Type RuleType `json:"type"`

	Metric   string   `json:"metric,omitempty"`
	Operator string   `json:"operator,omitempty"`
	Value    *float64 `json:"value,omitempty"`

	Conditions []RuleNode `json:"conditions,omitempty"`
}

type Rule struct {
	ID       int64
	Code     string
	RuleNode RuleNode
}

type AchievementEvaluation struct {
	Code       string
	Evaluation RuleEvaluation
}
type RuleEvaluation struct {
	Type       RuleType
	IsComplete bool
	Progress   float64 // value in percents from 0 to 100

	Condition *ConditionEvaluation
	Children  []RuleEvaluation
}
type ConditionEvaluation struct {
	Metric   string
	Operator string
	Actual   float64
	Expected float64
}
