package repository

import (
	"github.com/Qindly/orange-mark-mind/internal/model"
	"gorm.io/gorm"
)

// AIConfigRepository AI 配置数据访问层
type AIConfigRepository struct {
	db *gorm.DB
}

// NewAIConfigRepository 创建 AI 配置仓库
func NewAIConfigRepository(db *gorm.DB) *AIConfigRepository {
	return &AIConfigRepository{db: db}
}

// Create 创建配置
func (r *AIConfigRepository) Create(config *model.AIConfig) error {
	return r.db.Create(config).Error
}

// FindByID 根据 ID 查找配置
func (r *AIConfigRepository) FindByID(id int64) (*model.AIConfig, error) {
	var config model.AIConfig
	err := r.db.First(&config, id).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

// FindByIDAndUserID 根据 ID 和用户 ID 查找配置
func (r *AIConfigRepository) FindByIDAndUserID(id, userID int64) (*model.AIConfig, error) {
	var config model.AIConfig
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

// FindByUserID 获取用户的所有配置
func (r *AIConfigRepository) FindByUserID(userID int64) ([]model.AIConfig, error) {
	var configs []model.AIConfig
	err := r.db.Where("user_id = ?", userID).Order("is_default DESC, created_at DESC").Find(&configs).Error
	return configs, err
}

// FindByUserIDAndName 根据用户 ID 和配置名称查找
func (r *AIConfigRepository) FindByUserIDAndName(userID int64, name string) (*model.AIConfig, error) {
	var config model.AIConfig
	err := r.db.Where("user_id = ? AND config_name = ?", userID, name).First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

// FindDefaultByUserID 获取用户默认配置
func (r *AIConfigRepository) FindDefaultByUserID(userID int64) (*model.AIConfig, error) {
	var config model.AIConfig
	err := r.db.Where("user_id = ? AND is_default = ?", userID, true).First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

// Update 更新配置
func (r *AIConfigRepository) Update(config *model.AIConfig) error {
	return r.db.Save(config).Error
}

// Delete 删除配置
func (r *AIConfigRepository) Delete(id int64) error {
	return r.db.Delete(&model.AIConfig{}, id).Error
}

// ClearDefaultByUserID 清除用户的默认配置标记
func (r *AIConfigRepository) ClearDefaultByUserID(userID int64) error {
	return r.db.Model(&model.AIConfig{}).
		Where("user_id = ? AND is_default = ?", userID, true).
		Update("is_default", false).Error
}

// CountByUserID 统计用户配置数量
func (r *AIConfigRepository) CountByUserID(userID int64) (int64, error) {
	var count int64
	err := r.db.Model(&model.AIConfig{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}
