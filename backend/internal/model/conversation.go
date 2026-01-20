package model

import (
	"time"
)

// Conversation AI 对话模型
type Conversation struct {
	ID        int64      `gorm:"primaryKey" json:"id"`
	UserID    int64      `gorm:"not null;index" json:"user_id"`
	Title     string     `gorm:"size:200" json:"title"`
	IsDeleted bool       `gorm:"not null;default:false" json:"-"`
	DeletedAt *time.Time `json:"-"`
	CreatedAt time.Time  `gorm:"not null" json:"created_at"`
	UpdatedAt time.Time  `gorm:"not null" json:"updated_at"`
	// Messages loaded separately
	Messages []Message `gorm:"-" json:"messages,omitempty"`
}

// TableName 指定表名
func (Conversation) TableName() string {
	return "ai_conversations"
}

// Message AI 消息模型
type Message struct {
	ID             int64     `gorm:"primaryKey" json:"id"`
	ConversationID int64     `gorm:"not null;index" json:"conversation_id"`
	Role           string    `gorm:"size:20;not null" json:"role"` // user, assistant
	Content        string    `gorm:"type:text;not null" json:"content"`
	Model          string    `gorm:"size:100" json:"model,omitempty"` // Only for assistant
	CreatedAt      time.Time `gorm:"not null" json:"created_at"`
}

// TableName 指定表名
func (Message) TableName() string {
	return "ai_messages"
}

// MessageRole 消息角色常量
const (
	MessageRoleUser      = "user"
	MessageRoleAssistant = "assistant"
)

// ConversationListItem 对话列表项响应
type ConversationListItem struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ConversationDetail 对话详情响应
type ConversationDetail struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	Messages  []Message `json:"messages"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ToListItem 转换为列表项
func (c *Conversation) ToListItem() ConversationListItem {
	return ConversationListItem{
		ID:        c.ID,
		Title:     c.Title,
		UpdatedAt: c.UpdatedAt,
	}
}

// ToDetail 转换为详情
func (c *Conversation) ToDetail() ConversationDetail {
	return ConversationDetail{
		ID:        c.ID,
		Title:     c.Title,
		Messages:  c.Messages,
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}
}
