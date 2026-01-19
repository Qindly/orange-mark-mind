package repository

import (
	"time"

	"github.com/Qindly/orange-mark-mind/internal/model"
	"gorm.io/gorm"
)

// DocumentRepository 文档数据访问层
type DocumentRepository struct {
	db *gorm.DB
}

// NewDocumentRepository 创建文档仓库
func NewDocumentRepository(db *gorm.DB) *DocumentRepository {
	return &DocumentRepository{db: db}
}

// Create 创建文档
func (r *DocumentRepository) Create(doc *model.Document) error {
	return r.db.Create(doc).Error
}

// FindByID 根据内部 ID 查找文档
func (r *DocumentRepository) FindByID(id int64) (*model.Document, error) {
	var doc model.Document
	err := r.db.First(&doc, id).Error
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

// FindByIDAndUserID 根据 ID 和用户 ID 查找文档
func (r *DocumentRepository) FindByIDAndUserID(id, userID int64) (*model.Document, error) {
	var doc model.Document
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&doc).Error
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

// FindByUserID 获取用户的所有文档（不包含已删除）
func (r *DocumentRepository) FindByUserID(userID int64, includeDeleted bool) ([]model.Document, error) {
	var docs []model.Document
	query := r.db.Where("user_id = ?", userID)
	if !includeDeleted {
		query = query.Where("is_deleted = false")
	}
	err := query.Order("updated_at DESC").Find(&docs).Error
	return docs, err
}

// FindByFolderID 获取文件夹下的文档
func (r *DocumentRepository) FindByFolderID(folderID, userID int64) ([]model.Document, error) {
	var docs []model.Document
	err := r.db.Where("folder_id = ? AND user_id = ? AND is_deleted = false", folderID, userID).
		Order("sort_order ASC, updated_at DESC").
		Find(&docs).Error
	return docs, err
}

// FindRecent 获取最近更新的文档
func (r *DocumentRepository) FindRecent(userID int64, limit int) ([]model.Document, error) {
	var docs []model.Document
	err := r.db.Where("user_id = ? AND is_deleted = false", userID).
		Order("updated_at DESC").
		Limit(limit).
		Find(&docs).Error
	return docs, err
}

// FindFavorites 获取收藏的文档
func (r *DocumentRepository) FindFavorites(userID int64) ([]model.Document, error) {
	var docs []model.Document
	err := r.db.Where("user_id = ? AND is_favorited = true AND is_deleted = false", userID).
		Order("updated_at DESC").
		Find(&docs).Error
	return docs, err
}

// FindDeleted 获取回收站文档
func (r *DocumentRepository) FindDeleted(userID int64) ([]model.Document, error) {
	var docs []model.Document
	err := r.db.Where("user_id = ? AND is_deleted = true", userID).
		Order("deleted_at DESC").
		Find(&docs).Error
	return docs, err
}

// Update 更新文档
func (r *DocumentRepository) Update(doc *model.Document) error {
	doc.UpdatedAt = time.Now()
	return r.db.Save(doc).Error
}

// SoftDelete 软删除文档
func (r *DocumentRepository) SoftDelete(id, userID int64) error {
	now := time.Now()
	return r.db.Model(&model.Document{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"is_deleted": true,
			"deleted_at": now,
			"updated_at": now,
		}).Error
}

// Restore 恢复文档
func (r *DocumentRepository) Restore(id, userID int64) error {
	return r.db.Model(&model.Document{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"is_deleted": false,
			"deleted_at": nil,
			"updated_at": time.Now(),
		}).Error
}

// PermanentDelete 永久删除文档
func (r *DocumentRepository) PermanentDelete(id, userID int64) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Document{}).Error
}

// GetFolderName 获取文件夹名称
func (r *DocumentRepository) GetFolderName(folderID int64) (string, error) {
	var folder struct {
		Name string
	}
	err := r.db.Table("folders").Select("name").Where("id = ?", folderID).First(&folder).Error
	return folder.Name, err
}

// Search 搜索文档（标题和内容）
func (r *DocumentRepository) Search(userID int64, query string, limit int) ([]model.Document, error) {
	var docs []model.Document
	searchPattern := "%" + query + "%"
	err := r.db.Where("user_id = ? AND is_deleted = false AND (title ILIKE ? OR content ILIKE ?)",
		userID, searchPattern, searchPattern).
		Order("updated_at DESC").
		Limit(limit).
		Find(&docs).Error
	return docs, err
}
