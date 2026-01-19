package service

import (
	"errors"

	"github.com/Qindly/orange-mark-mind/internal/model"
	"github.com/Qindly/orange-mark-mind/internal/repository"
	"gorm.io/gorm"
)

// DocumentService 文档服务
type DocumentService struct {
	docRepo *repository.DocumentRepository
}

// NewDocumentService 创建文档服务
func NewDocumentService(docRepo *repository.DocumentRepository) *DocumentService {
	return &DocumentService{docRepo: docRepo}
}

// CreateDocumentRequest 创建文档请求
type CreateDocumentRequest struct {
	Title    string  `json:"title" binding:"required,min=1,max=200"`
	Content  *string `json:"content"`
	FolderID string  `json:"folder_id" binding:"required"` // kb-{n} 格式
}

// UpdateDocumentRequest 更新文档请求
type UpdateDocumentRequest struct {
	Title       *string `json:"title"`
	Content     *string `json:"content"`
	FolderID    *string `json:"folder_id"`
	IsFavorited *bool   `json:"is_favorited"`
}

// Create 创建文档
func (s *DocumentService) Create(userID int64, req *CreateDocumentRequest) (*model.Document, error) {
	// 解析文件夹 ID
	folderID, err := model.ParseFolderID(req.FolderID)
	if err != nil {
		return nil, errors.New("invalid folder_id format")
	}

	doc := &model.Document{
		UserID:   userID,
		FolderID: &folderID,
		Title:    req.Title,
		Content:  req.Content,
	}

	if err := s.docRepo.Create(doc); err != nil {
		return nil, err
	}

	// 触发 AfterFind 设置外部 ID
	doc.AfterFind()

	// 获取文件夹名称
	if folderName, err := s.docRepo.GetFolderName(folderID); err == nil {
		doc.FolderName = &folderName
	}

	return doc, nil
}

// GetByID 根据 ID 获取文档
func (s *DocumentService) GetByID(externalID string, userID int64) (*model.Document, error) {
	id, err := model.ParseDocumentID(externalID)
	if err != nil {
		return nil, err
	}

	doc, err := s.docRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("document not found")
		}
		return nil, err
	}

	// 设置外部 ID
	doc.AfterFind()

	// 获取文件夹名称
	if doc.FolderID != nil {
		if folderName, err := s.docRepo.GetFolderName(*doc.FolderID); err == nil {
			doc.FolderName = &folderName
		}
	}

	return doc, nil
}

// GetList 获取文档列表
func (s *DocumentService) GetList(userID int64, folderID *string) ([]model.Document, error) {
	var docs []model.Document
	var err error

	if folderID != nil && *folderID != "" {
		// 指定文件夹
		fid, parseErr := model.ParseFolderID(*folderID)
		if parseErr != nil {
			return nil, errors.New("invalid folder_id format")
		}
		docs, err = s.docRepo.FindByFolderID(fid, userID)
	} else {
		// 所有文档
		docs, err = s.docRepo.FindByUserID(userID, false)
	}

	if err != nil {
		return nil, err
	}

	// 设置外部 ID 和文件夹名称
	for i := range docs {
		docs[i].AfterFind()
		if docs[i].FolderID != nil {
			if folderName, err := s.docRepo.GetFolderName(*docs[i].FolderID); err == nil {
				docs[i].FolderName = &folderName
			}
		}
	}

	return docs, nil
}

// GetRecent 获取最近文档
func (s *DocumentService) GetRecent(userID int64, limit int) ([]model.Document, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	docs, err := s.docRepo.FindRecent(userID, limit)
	if err != nil {
		return nil, err
	}

	// 设置外部 ID 和文件夹名称
	for i := range docs {
		docs[i].AfterFind()
		if docs[i].FolderID != nil {
			if folderName, err := s.docRepo.GetFolderName(*docs[i].FolderID); err == nil {
				docs[i].FolderName = &folderName
			}
		}
	}

	return docs, nil
}

// GetFavorites 获取收藏文档
func (s *DocumentService) GetFavorites(userID int64) ([]model.Document, error) {
	docs, err := s.docRepo.FindFavorites(userID)
	if err != nil {
		return nil, err
	}

	// 设置外部 ID 和文件夹名称
	for i := range docs {
		docs[i].AfterFind()
		if docs[i].FolderID != nil {
			if folderName, err := s.docRepo.GetFolderName(*docs[i].FolderID); err == nil {
				docs[i].FolderName = &folderName
			}
		}
	}

	return docs, nil
}

// GetTrash 获取回收站文档
func (s *DocumentService) GetTrash(userID int64) ([]model.Document, error) {
	docs, err := s.docRepo.FindDeleted(userID)
	if err != nil {
		return nil, err
	}

	// 设置外部 ID 和文件夹名称
	for i := range docs {
		docs[i].AfterFind()
		if docs[i].FolderID != nil {
			if folderName, err := s.docRepo.GetFolderName(*docs[i].FolderID); err == nil {
				docs[i].FolderName = &folderName
			}
		}
	}

	return docs, nil
}

// Update 更新文档
func (s *DocumentService) Update(externalID string, userID int64, req *UpdateDocumentRequest) (*model.Document, error) {
	id, err := model.ParseDocumentID(externalID)
	if err != nil {
		return nil, err
	}

	doc, err := s.docRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("document not found")
		}
		return nil, err
	}

	// 更新字段
	if req.Title != nil {
		doc.Title = *req.Title
	}
	if req.Content != nil {
		doc.Content = req.Content
	}
	if req.IsFavorited != nil {
		doc.IsFavorited = *req.IsFavorited
	}
	if req.FolderID != nil {
		fid, parseErr := model.ParseFolderID(*req.FolderID)
		if parseErr != nil {
			return nil, errors.New("invalid folder_id format")
		}
		doc.FolderID = &fid
	}

	if err := s.docRepo.Update(doc); err != nil {
		return nil, err
	}

	// 设置外部 ID
	doc.AfterFind()

	return doc, nil
}

// Delete 删除文档（软删除）
func (s *DocumentService) Delete(externalID string, userID int64, permanent bool) error {
	id, err := model.ParseDocumentID(externalID)
	if err != nil {
		return err
	}

	// 验证文档存在
	_, err = s.docRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("document not found")
		}
		return err
	}

	if permanent {
		return s.docRepo.PermanentDelete(id, userID)
	}
	return s.docRepo.SoftDelete(id, userID)
}

// Restore 恢复文档
func (s *DocumentService) Restore(externalID string, userID int64) error {
	id, err := model.ParseDocumentID(externalID)
	if err != nil {
		return err
	}

	// 验证文档存在
	_, err = s.docRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("document not found")
		}
		return err
	}

	return s.docRepo.Restore(id, userID)
}

// Search 搜索文档
func (s *DocumentService) Search(userID int64, query string, limit int) ([]model.Document, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	docs, err := s.docRepo.Search(userID, query, limit)
	if err != nil {
		return nil, err
	}

	// 设置外部 ID 和文件夹名称
	for i := range docs {
		docs[i].AfterFind()
		if docs[i].FolderID != nil {
			if folderName, err := s.docRepo.GetFolderName(*docs[i].FolderID); err == nil {
				docs[i].FolderName = &folderName
			}
		}
	}

	return docs, nil
}
