package repository

import (
	"github.com/Qindly/orange-mark-mind/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// UserSettingRepository 用户设置数据访问层
type UserSettingRepository struct {
	db *gorm.DB
}

// NewUserSettingRepository 创建用户设置仓库
func NewUserSettingRepository(db *gorm.DB) *UserSettingRepository {
	return &UserSettingRepository{db: db}
}

// FindByUserIDAndKey 根据用户 ID 和设置键查找
func (r *UserSettingRepository) FindByUserIDAndKey(userID int64, key string) (*model.UserSetting, error) {
	var setting model.UserSetting
	err := r.db.Where("user_id = ? AND setting_key = ?", userID, key).First(&setting).Error
	if err != nil {
		return nil, err
	}
	return &setting, nil
}

// FindByUserID 获取用户的所有设置
func (r *UserSettingRepository) FindByUserID(userID int64) ([]model.UserSetting, error) {
	var settings []model.UserSetting
	err := r.db.Where("user_id = ?", userID).Find(&settings).Error
	return settings, err
}

// Upsert 创建或更新设置
func (r *UserSettingRepository) Upsert(setting *model.UserSetting) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "setting_key"}},
		DoUpdates: clause.AssignmentColumns([]string{"setting_value", "updated_at"}),
	}).Create(setting).Error
}

// Delete 删除设置
func (r *UserSettingRepository) Delete(userID int64, key string) error {
	return r.db.Where("user_id = ? AND setting_key = ?", userID, key).Delete(&model.UserSetting{}).Error
}
