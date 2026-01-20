package repository

import (
	"time"

	"github.com/Qindly/orange-mark-mind/internal/model"
	"gorm.io/gorm"
)

// ConversationRepository 对话数据访问层
type ConversationRepository struct {
	db *gorm.DB
}

// NewConversationRepository 创建对话仓库
func NewConversationRepository(db *gorm.DB) *ConversationRepository {
	return &ConversationRepository{db: db}
}

// Create 创建对话
func (r *ConversationRepository) Create(conv *model.Conversation) error {
	return r.db.Create(conv).Error
}

// FindByID 根据 ID 查找对话
func (r *ConversationRepository) FindByID(id int64) (*model.Conversation, error) {
	var conv model.Conversation
	err := r.db.First(&conv, id).Error
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

// FindByIDAndUserID 根据 ID 和用户 ID 查找对话
func (r *ConversationRepository) FindByIDAndUserID(id, userID int64) (*model.Conversation, error) {
	var conv model.Conversation
	err := r.db.Where("id = ? AND user_id = ? AND is_deleted = ?", id, userID, false).First(&conv).Error
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

// FindByUserID 获取用户的对话列表（不含已删除）
func (r *ConversationRepository) FindByUserID(userID int64, limit, offset int) ([]model.Conversation, error) {
	var convs []model.Conversation
	err := r.db.Where("user_id = ? AND is_deleted = ?", userID, false).
		Order("updated_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&convs).Error
	return convs, err
}

// FindDeletedByUserID 获取用户已删除的对话（回收站）
func (r *ConversationRepository) FindDeletedByUserID(userID int64) ([]model.Conversation, error) {
	var convs []model.Conversation
	err := r.db.Where("user_id = ? AND is_deleted = ?", userID, true).
		Order("deleted_at DESC").
		Find(&convs).Error
	return convs, err
}

// Search 搜索对话（全文搜索）
func (r *ConversationRepository) Search(userID int64, query string, limit int) ([]model.Conversation, error) {
	var convs []model.Conversation
	err := r.db.Where("user_id = ? AND is_deleted = ? AND search_vector @@ plainto_tsquery('simple', ?)", userID, false, query).
		Order("updated_at DESC").
		Limit(limit).
		Find(&convs).Error
	return convs, err
}

// Update 更新对话
func (r *ConversationRepository) Update(conv *model.Conversation) error {
	return r.db.Save(conv).Error
}

// UpdateTitle 更新对话标题
func (r *ConversationRepository) UpdateTitle(id int64, title string) error {
	return r.db.Model(&model.Conversation{}).Where("id = ?", id).Update("title", title).Error
}

// SoftDelete 软删除对话
func (r *ConversationRepository) SoftDelete(id, userID int64) error {
	now := time.Now()
	return r.db.Model(&model.Conversation{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"is_deleted": true,
			"deleted_at": now,
		}).Error
}

// Restore 恢复对话
func (r *ConversationRepository) Restore(id, userID int64) error {
	return r.db.Model(&model.Conversation{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"is_deleted": false,
			"deleted_at": nil,
		}).Error
}

// HardDelete 永久删除对话
func (r *ConversationRepository) HardDelete(id, userID int64) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Conversation{}).Error
}

// CountByUserID 统计用户对话数量
func (r *ConversationRepository) CountByUserID(userID int64) (int64, error) {
	var count int64
	err := r.db.Model(&model.Conversation{}).Where("user_id = ? AND is_deleted = ?", userID, false).Count(&count).Error
	return count, err
}
