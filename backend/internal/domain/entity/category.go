package entity

type Category struct {
	ID       int64
	Name     string
	ParentID *int64

	Parent *Category
}
