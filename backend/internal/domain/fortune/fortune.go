package fortune

const TypeFortune = "fortune"

type Fortune struct {
	UserID int64
	Year   int
	Title  string
	Text   string
	Type   string
}
