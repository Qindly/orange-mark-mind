package repository

import (
	"github.com/Qindly/orange-mark-mind/internal/model"
	"gorm.io/gorm"
)

// FolderRepository 知识库数据访问层
type FolderRepository struct {
	db *gorm.DB
}

// NewFolderRepository 创建知识库仓库
func NewFolderRepository(db *gorm.DB) *FolderRepository {
	return &FolderRepository{db: db}
}

// Create 创建知识库
func (r *FolderRepository) Create(folder *model.Folder) error {
	return r.db.Create(folder).Error
}

// FindByID 根据内部 ID 查找知识库
func (r *FolderRepository) FindByID(id int64) (*model.Folder, error) {
	var folder model.Folder
	err := r.db.First(&folder, id).Error
	if err != nil {
		return nil, err
	}
	return &folder, nil
}

// FindByIDAndUserID 根据 ID 和用户 ID 查找知识库
func (r *FolderRepository) FindByIDAndUserID(id, userID int64) (*model.Folder, error) {
	var folder model.Folder
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&folder).Error
	if err != nil {
		return nil, err
	}
	return &folder, nil
}

// FindByUserID 获取用户的所有知识库
func (r *FolderRepository) FindByUserID(userID int64) ([]model.Folder, error) {
	var folders []model.Folder
	err := r.db.Where("user_id = ?", userID).
		Order("sort_order ASC, created_at ASC").
		Find(&folders).Error
	return folders, err
}

// FindRootByUserID 获取用户的根级知识库（parent_id 为空）
func (r *FolderRepository) FindRootByUserID(userID int64) ([]model.Folder, error) {
	var folders []model.Folder
	err := r.db.Where("user_id = ? AND parent_id IS NULL", userID).
		Order("sort_order ASC, created_at ASC").
		Find(&folders).Error
	return folders, err
}

// FindByParentID 获取指定父级下的子知识库
func (r *FolderRepository) FindByParentID(parentID, userID int64) ([]model.Folder, error) {
	var folders []model.Folder
	err := r.db.Where("parent_id = ? AND user_id = ?", parentID, userID).
		Order("sort_order ASC, created_at ASC").
		Find(&folders).Error
	return folders, err
}

// Update 更新知识库
func (r *FolderRepository) Update(folder *model.Folder) error {
	return r.db.Save(folder).Error
}

// Delete 删除知识库
func (r *FolderRepository) Delete(id, userID int64) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Folder{}).Error
}

// CountDocumentsByFolderID 统计知识库下的文档数量
func (r *FolderRepository) CountDocumentsByFolderID(folderID int64) (int, error) {
	var count int64
	err := r.db.Table("documents").
		Where("folder_id = ? AND is_deleted = false", folderID).
		Count(&count).Error
	return int(count), err
}

// MoveDocumentsToFolder 将文档移动到指定知识库
func (r *FolderRepository) MoveDocumentsToFolder(fromFolderID, toFolderID int64) error {
	return r.db.Table("documents").
		Where("folder_id = ?", fromFolderID).
		Update("folder_id", toFolderID).Error
}

// ExistsByNameAndUserID 检查同名知识库是否存在
func (r *FolderRepository) ExistsByNameAndUserID(name string, userID int64, excludeID *int64) (bool, error) {
	query := r.db.Model(&model.Folder{}).Where("name = ? AND user_id = ?", name, userID)
	if excludeID != nil {
		query = query.Where("id != ?", *excludeID)
	}
	var count int64
	err := query.Count(&count).Error
	return count > 0, err
}

// DeleteDocumentsByFolderID 删除知识库下的所有文档（软删除）
func (r *FolderRepository) DeleteDocumentsByFolderID(folderID int64) error {
	return r.db.Table("documents").
		Where("folder_id = ?", folderID).
		Update("is_deleted", true).Error
}
