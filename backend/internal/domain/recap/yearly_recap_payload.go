package recap

type YearlyRecapPayload struct {
	Role         RecapRole          `json:"role"`
	Metrics      []RecapMetric      `json:"metrics"`
	Achievements []RecapAchievement `json:"achievements"`
	Action       RecapAction        `json:"action"`
	Debug        RecapDebug         `json:"debug"`
}
