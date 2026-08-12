package recap

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
	Code                 string `json:"code"`
	Name                 string `json:"name"`
	Title                string `json:"title"`
	Subtitle             string `json:"subtitle"`
	Why                  string `json:"why"`
	ActivitySharePercent int    `json:"activitySharePercent"`
}

type RecapMetric struct {
	Type       string         `json:"type"`
	Title      string         `json:"title"`
	Text       string         `json:"text"`
	Highlights []string       `json:"highlights"`
	Payload    map[string]any `json:"payload"`
}

type RecapAchievement struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageURL    string `json:"imageUrl"`
}

type RecapAction struct {
	Type   string
	Label  string
	Reason string
	Target RecapActionTarget
}

type RecapActionTarget struct {
	ListingIDs   []int64
	CategoryID   int64
	CategoryName string
	Listings     []RecapActionListing
}

type RecapActionListing struct {
	ID           int64
	Name         string
	ImageURL     string
	Price        *int64
	Status       string
	CategoryID   int64
	CategoryName string
	ViewsCount   int
	UpdatedAt    *time.Time
	City         string
}

type RecapDebug struct {
	GeneratorVersion string
	SeedProfile      string
}
