package repository

import (
	"time"

	"github.com/Qindly/orange-mark-mind/internal/model"
	"gorm.io/gorm"
)

// TemplateRepository 模板数据访问层
type TemplateRepository struct {
	db *gorm.DB
}

// NewTemplateRepository 创建模板仓库
func NewTemplateRepository(db *gorm.DB) *TemplateRepository {
	return &TemplateRepository{db: db}
}

// Create 创建模板
func (r *TemplateRepository) Create(template *model.Template) error {
	return r.db.Create(template).Error
}

// FindByID 根据内部 ID 查找模板
func (r *TemplateRepository) FindByID(id int64) (*model.Template, error) {
	var template model.Template
	err := r.db.First(&template, id).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

// FindByIDAndUserID 根据 ID 验证模板所有权（用户模板或系统模板）
func (r *TemplateRepository) FindByIDAndUserID(id, userID int64) (*model.Template, error) {
	var template model.Template
	// 用户可访问自己的模板和系统模板
	err := r.db.Where("id = ? AND (user_id = ? OR is_system = true)", id, userID).First(&template).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

// FindUserTemplate 查找用户自己的模板（不含系统模板）
func (r *TemplateRepository) FindUserTemplate(id, userID int64) (*model.Template, error) {
	var template model.Template
	err := r.db.Where("id = ? AND user_id = ? AND is_system = false", id, userID).First(&template).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

// FindAll 获取所有可用模板（系统模板 + 用户模板）
func (r *TemplateRepository) FindAll(userID int64) ([]model.Template, error) {
	var templates []model.Template
	err := r.db.Where("is_system = true OR user_id = ?", userID).
		Order("is_system DESC, sort_order ASC, created_at DESC").
		Find(&templates).Error
	return templates, err
}

// FindSystemTemplates 获取系统模板
func (r *TemplateRepository) FindSystemTemplates() ([]model.Template, error) {
	var templates []model.Template
	err := r.db.Where("is_system = true").
		Order("sort_order ASC").
		Find(&templates).Error
	return templates, err
}

// FindUserTemplates 获取用户模板
func (r *TemplateRepository) FindUserTemplates(userID int64) ([]model.Template, error) {
	var templates []model.Template
	err := r.db.Where("user_id = ? AND is_system = false", userID).
		Order("sort_order ASC, created_at DESC").
		Find(&templates).Error
	return templates, err
}

// Update 更新模板
func (r *TemplateRepository) Update(template *model.Template) error {
	template.UpdatedAt = time.Now()
	return r.db.Save(template).Error
}

// Delete 删除模板
func (r *TemplateRepository) Delete(id, userID int64) error {
	// 只能删除自己的模板，不能删除系统模板
	return r.db.Where("id = ? AND user_id = ? AND is_system = false", id, userID).
		Delete(&model.Template{}).Error
}
