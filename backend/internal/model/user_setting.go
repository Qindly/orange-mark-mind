package model

import (
	"time"
)

// UserSetting 用户设置模型
type UserSetting struct {
	ID           int64     `gorm:"primaryKey" json:"id"`
	UserID       int64     `gorm:"not null;index" json:"user_id"`
	SettingKey   string    `gorm:"size:50;not null" json:"setting_key"`
	SettingValue string    `gorm:"type:text" json:"setting_value"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt    time.Time `gorm:"not null" json:"updated_at"`
}

// TableName 指定表名
func (UserSetting) TableName() string {
	return "user_settings"
}

// 常用设置键名常量
const (
	SettingKeyDefaultSummaryModel = "default_summary_model"
)

// UserSettingResponse API 响应结构
type UserSettingResponse struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// ToResponse 转换为响应结构
func (s *UserSetting) ToResponse() UserSettingResponse {
	return UserSettingResponse{
		Key:   s.SettingKey,
		Value: s.SettingValue,
	}
}
