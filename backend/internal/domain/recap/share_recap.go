package recap

type ShareRecap struct {
	Year         int                     `json:"year"`
	Role         *ShareRecapRole         `json:"role"`
	Metrics      []ShareRecapMetric      `json:"metrics"`
	Achievements []ShareRecapAchievement `json:"achievements"`
}

type ShareRecapRole struct {
	Code  string `json:"code"`
	Name  string `json:"name"`
	Title string `json:"title"`
}

type ShareRecapMetric struct {
	Type       string   `json:"type"`
	Title      string   `json:"title"`
	Text       string   `json:"text"`
	Highlights []string `json:"highlights"`
}

type ShareRecapAchievement struct {
	Code     string `json:"code"`
	Name     string `json:"name"`
	ImageURL string `json:"imageUrl"`
}
