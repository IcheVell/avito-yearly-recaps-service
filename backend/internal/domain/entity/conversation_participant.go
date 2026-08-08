package entity

type ConversationParticipant struct {
	UserID         int64 `gorm:"primaryKey;autoIncrement:false"`
	ConversationID int64 `gorm:"primaryKey;autoIncrement:false"`

	User         User
	Conversation Conversation
}
