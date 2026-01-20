package repository

import (
	"github.com/Qindly/orange-mark-mind/internal/model"
	"gorm.io/gorm"
)

// MessageRepository 消息数据访问层
type MessageRepository struct {
	db *gorm.DB
}

// NewMessageRepository 创建消息仓库
func NewMessageRepository(db *gorm.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

// Create 创建消息
func (r *MessageRepository) Create(msg *model.Message) error {
	return r.db.Create(msg).Error
}

// FindByConversationID 获取对话的所有消息
func (r *MessageRepository) FindByConversationID(conversationID int64) ([]model.Message, error) {
	var messages []model.Message
	err := r.db.Where("conversation_id = ?", conversationID).
		Order("created_at ASC").
		Find(&messages).Error
	return messages, err
}

// FindRecentByConversationID 获取对话最近的 N 条消息
func (r *MessageRepository) FindRecentByConversationID(conversationID int64, limit int) ([]model.Message, error) {
	var messages []model.Message
	err := r.db.Where("conversation_id = ?", conversationID).
		Order("created_at DESC").
		Limit(limit).
		Find(&messages).Error
	// Reverse to chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	return messages, err
}

// FindByID 根据 ID 查找消息
func (r *MessageRepository) FindByID(id int64) (*model.Message, error) {
	var msg model.Message
	err := r.db.First(&msg, id).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

// Update 更新消息
func (r *MessageRepository) Update(msg *model.Message) error {
	return r.db.Save(msg).Error
}

// UpdateContent 更新消息内容
func (r *MessageRepository) UpdateContent(id int64, content string) error {
	return r.db.Model(&model.Message{}).Where("id = ?", id).Update("content", content).Error
}

// Delete 删除消息
func (r *MessageRepository) Delete(id int64) error {
	return r.db.Delete(&model.Message{}, id).Error
}

// DeleteByConversationID 删除对话的所有消息
func (r *MessageRepository) DeleteByConversationID(conversationID int64) error {
	return r.db.Where("conversation_id = ?", conversationID).Delete(&model.Message{}).Error
}

// CountByConversationID 统计对话消息数量
func (r *MessageRepository) CountByConversationID(conversationID int64) (int64, error) {
	var count int64
	err := r.db.Model(&model.Message{}).Where("conversation_id = ?", conversationID).Count(&count).Error
	return count, err
}

// GetLastMessage 获取对话的最后一条消息
func (r *MessageRepository) GetLastMessage(conversationID int64) (*model.Message, error) {
	var msg model.Message
	err := r.db.Where("conversation_id = ?", conversationID).
		Order("created_at DESC").
		First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

// GetLastAssistantMessage 获取对话的最后一条 AI 消息
func (r *MessageRepository) GetLastAssistantMessage(conversationID int64) (*model.Message, error) {
	var msg model.Message
	err := r.db.Where("conversation_id = ? AND role = ?", conversationID, model.MessageRoleAssistant).
		Order("created_at DESC").
		First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}
