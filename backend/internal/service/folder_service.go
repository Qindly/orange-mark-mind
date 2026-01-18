package service

import (
	"errors"

	"github.com/Qindly/orange-mark-mind/internal/model"
	"github.com/Qindly/orange-mark-mind/internal/repository"
	"gorm.io/gorm"
)

// FolderService 知识库服务
type FolderService struct {
	folderRepo *repository.FolderRepository
}

// NewFolderService 创建知识库服务
func NewFolderService(folderRepo *repository.FolderRepository) *FolderService {
	return &FolderService{folderRepo: folderRepo}
}

// CreateFolderRequest 创建知识库请求
type CreateFolderRequest struct {
	Name        string  `json:"name" binding:"required,min=1,max=100"`
	Description *string `json:"description"`
	ParentID    *string `json:"parent_id"` // kb-{n} 格式
}

// UpdateFolderRequest 更新知识库请求
type UpdateFolderRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	ParentID    *string `json:"parent_id"`
	SortOrder   *int    `json:"sort_order"`
}

// Create 创建知识库
func (s *FolderService) Create(userID int64, req *CreateFolderRequest) (*model.Folder, error) {
	// 解析父级 ID
	var parentID *int64
	if req.ParentID != nil && *req.ParentID != "" {
		pid, err := model.ParseFolderID(*req.ParentID)
		if err != nil {
			return nil, errors.New("invalid parent_id format")
		}
		parentID = &pid

		// 验证父级是否存在且属于当前用户
		parent, err := s.folderRepo.FindByIDAndUserID(pid, userID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("parent folder not found")
			}
			return nil, err
		}
		if parent == nil {
			return nil, errors.New("parent folder not found")
		}
	}

	folder := &model.Folder{
		UserID:      userID,
		ParentID:    parentID,
		Name:        req.Name,
		Description: req.Description,
		SortOrder:   0,
	}

	if err := s.folderRepo.Create(folder); err != nil {
		return nil, err
	}

	// 触发 AfterFind 设置外部 ID
	folder.AfterFind()

	return folder, nil
}

// GetByID 根据 ID 获取知识库
func (s *FolderService) GetByID(externalID string, userID int64) (*model.Folder, error) {
	id, err := model.ParseFolderID(externalID)
	if err != nil {
		return nil, err
	}

	folder, err := s.folderRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("folder not found")
		}
		return nil, err
	}

	// 获取文档数量
	count, _ := s.folderRepo.CountDocumentsByFolderID(folder.ID)
	folder.DocumentCount = &count

	return folder, nil
}

// GetList 获取知识库列表（支持树形结构）
func (s *FolderService) GetList(userID int64, flat bool) ([]model.Folder, error) {
	if flat {
		// 扁平列表
		folders, err := s.folderRepo.FindByUserID(userID)
		if err != nil {
			return nil, err
		}
		// 为每个文件夹添加文档数量
		for i := range folders {
			count, _ := s.folderRepo.CountDocumentsByFolderID(folders[i].ID)
			folders[i].DocumentCount = &count
		}
		return folders, nil
	}

	// 树形结构
	return s.buildTree(userID)
}

// buildTree 构建树形结构
func (s *FolderService) buildTree(userID int64) ([]model.Folder, error) {
	// 获取所有文件夹
	allFolders, err := s.folderRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	// 为每个文件夹添加文档数量
	for i := range allFolders {
		count, _ := s.folderRepo.CountDocumentsByFolderID(allFolders[i].ID)
		allFolders[i].DocumentCount = &count
	}

	// 构建 ID 到文件夹的映射
	folderMap := make(map[int64]*model.Folder)
	for i := range allFolders {
		allFolders[i].Children = []model.Folder{}
		folderMap[allFolders[i].ID] = &allFolders[i]
	}

	// 构建树
	var rootFolders []model.Folder
	for i := range allFolders {
		folder := &allFolders[i]
		if folder.ParentID == nil {
			rootFolders = append(rootFolders, *folder)
		} else {
			if parent, ok := folderMap[*folder.ParentID]; ok {
				parent.Children = append(parent.Children, *folder)
			}
		}
	}

	// 如果没有文件夹，返回空数组
	if rootFolders == nil {
		rootFolders = []model.Folder{}
	}

	return rootFolders, nil
}

// Update 更新知识库
func (s *FolderService) Update(externalID string, userID int64, req *UpdateFolderRequest) (*model.Folder, error) {
	id, err := model.ParseFolderID(externalID)
	if err != nil {
		return nil, err
	}

	// 不允许修改默认知识库 (kb-0)
	if id == model.DefaultFolderID {
		return nil, errors.New("cannot modify default folder")
	}

	folder, err := s.folderRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("folder not found")
		}
		return nil, err
	}

	// 更新字段
	if req.Name != nil {
		folder.Name = *req.Name
	}
	if req.Description != nil {
		folder.Description = req.Description
	}
	if req.SortOrder != nil {
		folder.SortOrder = *req.SortOrder
	}
	if req.ParentID != nil {
		if *req.ParentID == "" {
			folder.ParentID = nil
		} else {
			pid, err := model.ParseFolderID(*req.ParentID)
			if err != nil {
				return nil, errors.New("invalid parent_id format")
			}
			// 不能设置自己为父级
			if pid == folder.ID {
				return nil, errors.New("cannot set self as parent")
			}
			folder.ParentID = &pid
		}
	}

	if err := s.folderRepo.Update(folder); err != nil {
		return nil, err
	}

	return folder, nil
}

// Delete 删除知识库
func (s *FolderService) Delete(externalID string, userID int64, deleteChildren bool) (int, error) {
	id, err := model.ParseFolderID(externalID)
	if err != nil {
		return 0, err
	}

	// 不允许删除默认知识库 (kb-0)
	if id == model.DefaultFolderID {
		return 0, errors.New("cannot delete default folder")
	}

	// 验证知识库存在
	folder, err := s.folderRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, errors.New("folder not found")
		}
		return 0, err
	}

	// 统计文档数量
	docCount, _ := s.folderRepo.CountDocumentsByFolderID(folder.ID)

	// 将文档移动到默认知识库
	if docCount > 0 {
		if err := s.folderRepo.MoveDocumentsToFolder(folder.ID, model.DefaultFolderID); err != nil {
			return 0, err
		}
	}

	// 删除知识库
	if err := s.folderRepo.Delete(id, userID); err != nil {
		return 0, err
	}

	return docCount, nil
}
