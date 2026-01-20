package service

import (
	"errors"

	"github.com/Qindly/orange-mark-mind/internal/model"
	"github.com/Qindly/orange-mark-mind/internal/repository"
	"github.com/Qindly/orange-mark-mind/pkg/utils"
	"gorm.io/gorm"
)

// AIConfigService AI 配置服务
type AIConfigService struct {
	repo          *repository.AIConfigRepository
	encryptionKey string
}

// NewAIConfigService 创建 AI 配置服务
func NewAIConfigService(repo *repository.AIConfigRepository, encryptionKey string) *AIConfigService {
	return &AIConfigService{
		repo:          repo,
		encryptionKey: encryptionKey,
	}
}

// CreateAIConfigRequest 创建配置请求
type CreateAIConfigRequest struct {
	ConfigName      string   `json:"config_name" binding:"required,min=1,max=50"`
	ProviderType    string   `json:"provider_type" binding:"required"`
	BaseURL         string   `json:"base_url" binding:"required,url"`
	APIKey          string   `json:"api_key" binding:"required,min=1"`
	AvailableModels []string `json:"available_models" binding:"required,min=1"`
}

// UpdateAIConfigRequest 更新配置请求
type UpdateAIConfigRequest struct {
	ConfigName      *string  `json:"config_name"`
	ProviderType    *string  `json:"provider_type"`
	BaseURL         *string  `json:"base_url"`
	APIKey          *string  `json:"api_key"`
	AvailableModels []string `json:"available_models"`
}

// Create 创建配置
func (s *AIConfigService) Create(userID int64, req *CreateAIConfigRequest) (*model.AIConfigResponse, error) {
	// 验证提供商类型
	if !model.IsValidProviderType(req.ProviderType) {
		return nil, errors.New("invalid provider_type")
	}

	// 检查配置名称是否已存在
	_, err := s.repo.FindByUserIDAndName(userID, req.ConfigName)
	if err == nil {
		return nil, errors.New("config name already exists")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// 加密 API Key
	encryptedKey, err := utils.EncryptAESGCM(req.APIKey, s.encryptionKey)
	if err != nil {
		return nil, errors.New("failed to encrypt api key")
	}

	config := &model.AIConfig{
		UserID:          userID,
		ConfigName:      req.ConfigName,
		ProviderType:    model.AIProviderType(req.ProviderType),
		BaseURL:         req.BaseURL,
		APIKeyEncrypted: encryptedKey,
	}
	config.SetAvailableModels(req.AvailableModels)

	// 如果是用户第一个配置，设为默认
	count, _ := s.repo.CountByUserID(userID)
	if count == 0 {
		config.IsDefault = true
	}

	if err := s.repo.Create(config); err != nil {
		return nil, err
	}

	resp := config.ToResponse(utils.MaskAPIKey(req.APIKey))
	return &resp, nil
}

// GetByID 根据 ID 获取配置
func (s *AIConfigService) GetByID(id, userID int64) (*model.AIConfigResponse, error) {
	config, err := s.repo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("config not found")
		}
		return nil, err
	}

	// 解密并脱敏 API Key
	maskedKey := s.getMaskedKey(config.APIKeyEncrypted)
	resp := config.ToResponse(maskedKey)
	return &resp, nil
}

// GetByUserID 获取用户所有配置
func (s *AIConfigService) GetByUserID(userID int64) ([]model.AIConfigResponse, error) {
	configs, err := s.repo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	responses := make([]model.AIConfigResponse, len(configs))
	for i, config := range configs {
		maskedKey := s.getMaskedKey(config.APIKeyEncrypted)
		responses[i] = config.ToResponse(maskedKey)
	}

	return responses, nil
}

// Update 更新配置
func (s *AIConfigService) Update(id, userID int64, req *UpdateAIConfigRequest) (*model.AIConfigResponse, error) {
	config, err := s.repo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("config not found")
		}
		return nil, err
	}

	// 更新字段
	if req.ConfigName != nil {
		// 检查新名称是否与其他配置冲突
		existing, err := s.repo.FindByUserIDAndName(userID, *req.ConfigName)
		if err == nil && existing.ID != id {
			return nil, errors.New("config name already exists")
		}
		config.ConfigName = *req.ConfigName
	}

	if req.ProviderType != nil {
		if !model.IsValidProviderType(*req.ProviderType) {
			return nil, errors.New("invalid provider_type")
		}
		config.ProviderType = model.AIProviderType(*req.ProviderType)
	}

	if req.BaseURL != nil {
		config.BaseURL = *req.BaseURL
	}

	if req.APIKey != nil && *req.APIKey != "" {
		encryptedKey, err := utils.EncryptAESGCM(*req.APIKey, s.encryptionKey)
		if err != nil {
			return nil, errors.New("failed to encrypt api key")
		}
		config.APIKeyEncrypted = encryptedKey
	}

	if req.AvailableModels != nil {
		config.SetAvailableModels(req.AvailableModels)
	}

	if err := s.repo.Update(config); err != nil {
		return nil, err
	}

	maskedKey := s.getMaskedKey(config.APIKeyEncrypted)
	resp := config.ToResponse(maskedKey)
	return &resp, nil
}

// Delete 删除配置
func (s *AIConfigService) Delete(id, userID int64) error {
	config, err := s.repo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("config not found")
		}
		return err
	}

	// 不允许删除默认配置（如果还有其他配置）
	if config.IsDefault {
		count, _ := s.repo.CountByUserID(userID)
		if count > 1 {
			return errors.New("cannot delete default config, please set another config as default first")
		}
	}

	return s.repo.Delete(id)
}

// SetDefault 设为默认配置
func (s *AIConfigService) SetDefault(id, userID int64) (*model.AIConfigResponse, error) {
	config, err := s.repo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("config not found")
		}
		return nil, err
	}

	// 清除其他默认配置
	if err := s.repo.ClearDefaultByUserID(userID); err != nil {
		return nil, err
	}

	// 设置当前配置为默认
	config.IsDefault = true
	if err := s.repo.Update(config); err != nil {
		return nil, err
	}

	maskedKey := s.getMaskedKey(config.APIKeyEncrypted)
	resp := config.ToResponse(maskedKey)
	return &resp, nil
}

// getMaskedKey 解密并脱敏 API Key
func (s *AIConfigService) getMaskedKey(encryptedKey string) string {
	decrypted, err := utils.DecryptAESGCM(encryptedKey, s.encryptionKey)
	if err != nil {
		return "****"
	}
	return utils.MaskAPIKey(decrypted)
}
