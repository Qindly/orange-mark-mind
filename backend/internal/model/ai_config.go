package model

import (
	"encoding/json"
	"time"
)

// AIProviderType 提供商类型
type AIProviderType string

const (
	ProviderOpenAICompatible AIProviderType = "openai_compatible"
	ProviderAnthropic        AIProviderType = "anthropic"
	ProviderGemini           AIProviderType = "gemini"
)

// AIConfig AI 配置模型
type AIConfig struct {
	ID              int64          `gorm:"primaryKey" json:"id"`
	UserID          int64          `gorm:"not null;index" json:"user_id"`
	ConfigName      string         `gorm:"size:50;not null" json:"config_name"`
	ProviderType    AIProviderType `gorm:"size:30;not null" json:"provider_type"`
	BaseURL         string         `gorm:"size:255;not null" json:"base_url"`
	APIKeyEncrypted string         `gorm:"column:api_key_encrypted;size:500;not null" json:"-"`
	AvailableModels string         `gorm:"type:text" json:"-"` // JSON 数组存储
	IsDefault       bool           `gorm:"not null;default:false" json:"is_default"`
	CreatedAt       time.Time      `gorm:"not null" json:"created_at"`
	UpdatedAt       time.Time      `gorm:"not null" json:"updated_at"`
}

// TableName 指定表名
func (AIConfig) TableName() string {
	return "user_ai_configs"
}

// GetAvailableModels 获取可用模型列表
func (c *AIConfig) GetAvailableModels() []string {
	if c.AvailableModels == "" {
		return []string{}
	}
	var models []string
	if err := json.Unmarshal([]byte(c.AvailableModels), &models); err != nil {
		return []string{}
	}
	return models
}

// SetAvailableModels 设置可用模型列表
func (c *AIConfig) SetAvailableModels(models []string) {
	if models == nil {
		models = []string{}
	}
	data, _ := json.Marshal(models)
	c.AvailableModels = string(data)
}

// AIConfigResponse API 响应结构（不包含敏感信息）
type AIConfigResponse struct {
	ID              int64    `json:"id"`
	ConfigName      string   `json:"config_name"`
	ProviderType    string   `json:"provider_type"`
	BaseURL         string   `json:"base_url"`
	APIKeyMasked    string   `json:"api_key_masked"`
	AvailableModels []string `json:"available_models"`
	IsDefault       bool     `json:"is_default"`
	CreatedAt       string   `json:"created_at"`
	UpdatedAt       string   `json:"updated_at"`
}

// ToResponse 转换为响应结构
func (c *AIConfig) ToResponse(maskedKey string) AIConfigResponse {
	return AIConfigResponse{
		ID:              c.ID,
		ConfigName:      c.ConfigName,
		ProviderType:    string(c.ProviderType),
		BaseURL:         c.BaseURL,
		APIKeyMasked:    maskedKey,
		AvailableModels: c.GetAvailableModels(),
		IsDefault:       c.IsDefault,
		CreatedAt:       c.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:       c.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// IsValidProviderType 验证提供商类型
func IsValidProviderType(pt string) bool {
	switch AIProviderType(pt) {
	case ProviderOpenAICompatible, ProviderAnthropic, ProviderGemini:
		return true
	default:
		return false
	}
}
