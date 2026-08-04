package domain

import "time"

type Recap struct {
	ID           int64
	UserID       int64
	Year         int
	CreatedAt    time.Time
	Role         RecapRole
	Metrics      []RecapMetric
	Achievements []RecapAchievement
	Action       RecapAction
	Debug        RecapDebug
}

type RecapRole struct {
	Code                 string
	Title                string
	Subtitle             string
	Why                  string
	ActivitySharePercent int
}

type RecapMetric struct {
	Type       string
	Title      string
	Text       string
	Highlights []string
	Payload    map[string]any
}

type RecapAchievement struct {
	Code        string
	Name        string
	Description string
}

type RecapAction struct {
	Type   string
	Label  string
	Reason string
	Target RecapActionTarget
}

type RecapActionTarget struct {
	ListingIDs []int64
	CategoryID int64
}

type RecapDebug struct {
	GeneratorVersion string
	SeedProfile      string
}
