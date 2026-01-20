package service

import (
	"errors"

	"github.com/Qindly/orange-mark-mind/internal/model"
	"github.com/Qindly/orange-mark-mind/internal/repository"
	"gorm.io/gorm"
)

// TemplateService 模板服务
type TemplateService struct {
	templateRepo *repository.TemplateRepository
	docRepo      *repository.DocumentRepository
}

// NewTemplateService 创建模板服务
func NewTemplateService(templateRepo *repository.TemplateRepository, docRepo *repository.DocumentRepository) *TemplateService {
	return &TemplateService{
		templateRepo: templateRepo,
		docRepo:      docRepo,
	}
}

// CreateTemplateRequest 创建模板请求
type CreateTemplateRequest struct {
	Name        string  `json:"name" binding:"required,min=1,max=100"`
	Description *string `json:"description"`
	Icon        string  `json:"icon"`
	Content     *string `json:"content"`
}

// UpdateTemplateRequest 更新模板请求
type UpdateTemplateRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Icon        *string `json:"icon"`
	Content     *string `json:"content"`
}

// UseTemplateRequest 使用模板创建文档请求
type UseTemplateRequest struct {
	Title    string `json:"title"`
	FolderID string `json:"folder_id" binding:"required"`
}

// GetList 获取模板列表
func (s *TemplateService) GetList(userID int64) ([]model.Template, error) {
	templates, err := s.templateRepo.FindAll(userID)
	if err != nil {
		return nil, err
	}

	// 设置外部 ID
	for i := range templates {
		templates[i].AfterFind()
	}

	return templates, nil
}

// GetByID 根据 ID 获取模板
func (s *TemplateService) GetByID(externalID string, userID int64) (*model.Template, error) {
	id, err := model.ParseTemplateID(externalID)
	if err != nil {
		return nil, err
	}

	template, err := s.templateRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("template not found")
		}
		return nil, err
	}

	template.AfterFind()
	return template, nil
}

// Create 创建用户模板
func (s *TemplateService) Create(userID int64, req *CreateTemplateRequest) (*model.Template, error) {
	icon := "document"
	if req.Icon != "" {
		icon = req.Icon
	}

	template := &model.Template{
		UserID:      &userID,
		Name:        req.Name,
		Description: req.Description,
		Icon:        icon,
		Content:     req.Content,
		IsSystem:    false,
	}

	if err := s.templateRepo.Create(template); err != nil {
		return nil, err
	}

	template.AfterFind()
	return template, nil
}

// Update 更新用户模板
func (s *TemplateService) Update(externalID string, userID int64, req *UpdateTemplateRequest) (*model.Template, error) {
	id, err := model.ParseTemplateID(externalID)
	if err != nil {
		return nil, err
	}

	// 只能更新自己的模板
	template, err := s.templateRepo.FindUserTemplate(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("template not found or cannot be modified")
		}
		return nil, err
	}

	// 更新字段
	if req.Name != nil {
		template.Name = *req.Name
	}
	if req.Description != nil {
		template.Description = req.Description
	}
	if req.Icon != nil {
		template.Icon = *req.Icon
	}
	if req.Content != nil {
		template.Content = req.Content
	}

	if err := s.templateRepo.Update(template); err != nil {
		return nil, err
	}

	template.AfterFind()
	return template, nil
}

// Delete 删除用户模板
func (s *TemplateService) Delete(externalID string, userID int64) error {
	id, err := model.ParseTemplateID(externalID)
	if err != nil {
		return err
	}

	// 验证模板存在且属于用户
	_, err = s.templateRepo.FindUserTemplate(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("template not found or cannot be deleted")
		}
		return err
	}

	return s.templateRepo.Delete(id, userID)
}

// UseTemplate 使用模板创建文档
func (s *TemplateService) UseTemplate(externalID string, userID int64, req *UseTemplateRequest) (*model.Document, error) {
	id, err := model.ParseTemplateID(externalID)
	if err != nil {
		return nil, err
	}

	// 获取模板
	template, err := s.templateRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("template not found")
		}
		return nil, err
	}

	// 解析文件夹 ID
	folderID, err := model.ParseFolderID(req.FolderID)
	if err != nil {
		return nil, errors.New("invalid folder_id format")
	}

	// 设置文档标题
	title := req.Title
	if title == "" {
		title = template.Name
	}

	// 创建文档
	doc := &model.Document{
		UserID:   userID,
		FolderID: &folderID,
		Title:    title,
		Content:  template.Content,
	}

	if err := s.docRepo.Create(doc); err != nil {
		return nil, err
	}

	doc.AfterFind()

	// 获取文件夹名称
	if folderName, err := s.docRepo.GetFolderName(folderID); err == nil {
		doc.FolderName = &folderName
	}

	return doc, nil
}
