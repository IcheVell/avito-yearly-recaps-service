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
	RuleNode RuleNode
}
