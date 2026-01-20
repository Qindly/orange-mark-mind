package service

import (
	"errors"

	"github.com/Qindly/orange-mark-mind/internal/model"
	"github.com/Qindly/orange-mark-mind/internal/repository"
	"gorm.io/gorm"
)

// UserSettingService 用户设置服务
type UserSettingService struct {
	repo *repository.UserSettingRepository
}

// NewUserSettingService 创建用户设置服务
func NewUserSettingService(repo *repository.UserSettingRepository) *UserSettingService {
	return &UserSettingService{repo: repo}
}

// UpdateSettingRequest 更新设置请求
type UpdateSettingRequest struct {
	Value string `json:"value" binding:"required"`
}

// GetSetting 获取指定设置
func (s *UserSettingService) GetSetting(userID int64, key string) (*model.UserSettingResponse, error) {
	setting, err := s.repo.FindByUserIDAndKey(userID, key)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 返回空值而不是错误
			return &model.UserSettingResponse{
				Key:   key,
				Value: "",
			}, nil
		}
		return nil, err
	}

	resp := setting.ToResponse()
	return &resp, nil
}

// GetAllSettings 获取用户所有设置
func (s *UserSettingService) GetAllSettings(userID int64) (map[string]string, error) {
	settings, err := s.repo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	result := make(map[string]string)
	for _, setting := range settings {
		result[setting.SettingKey] = setting.SettingValue
	}

	return result, nil
}

// UpdateSetting 更新设置
func (s *UserSettingService) UpdateSetting(userID int64, key string, value string) (*model.UserSettingResponse, error) {
	setting := &model.UserSetting{
		UserID:       userID,
		SettingKey:   key,
		SettingValue: value,
	}

	if err := s.repo.Upsert(setting); err != nil {
		return nil, err
	}

	return &model.UserSettingResponse{
		Key:   key,
		Value: value,
	}, nil
}

// DeleteSetting 删除设置
func (s *UserSettingService) DeleteSetting(userID int64, key string) error {
	return s.repo.Delete(userID, key)
}
