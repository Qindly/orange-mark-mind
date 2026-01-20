package service

import (
	"errors"

	"github.com/Qindly/orange-mark-mind/internal/model"
	"github.com/Qindly/orange-mark-mind/internal/repository"
	"gorm.io/gorm"
)

// ConversationService 对话服务
type ConversationService struct {
	convRepo *repository.ConversationRepository
	msgRepo  *repository.MessageRepository
}

// NewConversationService 创建对话服务
func NewConversationService(convRepo *repository.ConversationRepository, msgRepo *repository.MessageRepository) *ConversationService {
	return &ConversationService{
		convRepo: convRepo,
		msgRepo:  msgRepo,
	}
}

// CreateConversationRequest 创建对话请求
type CreateConversationRequest struct {
	Title string `json:"title"`
}

// SendMessageRequest 发送消息请求
type SendMessageRequest struct {
	Content   string  `json:"content" binding:"required"`
	Model     string  `json:"model" binding:"required"`
	DocIDs    []int64 `json:"doc_ids"`    // RAG: 引用的文档 ID
	FolderIDs []int64 `json:"folder_ids"` // RAG: 引用的知识库 ID
}

// UpdateConversationRequest 更新对话请求
type UpdateConversationRequest struct {
	Title string `json:"title" binding:"required"`
}

// Create 创建对话
func (s *ConversationService) Create(userID int64, req *CreateConversationRequest) (*model.ConversationDetail, error) {
	conv := &model.Conversation{
		UserID: userID,
		Title:  req.Title,
	}

	if err := s.convRepo.Create(conv); err != nil {
		return nil, err
	}

	detail := conv.ToDetail()
	return &detail, nil
}

// GetList 获取对话列表
func (s *ConversationService) GetList(userID int64, limit, offset int) ([]model.ConversationListItem, error) {
	convs, err := s.convRepo.FindByUserID(userID, limit, offset)
	if err != nil {
		return nil, err
	}

	items := make([]model.ConversationListItem, len(convs))
	for i, conv := range convs {
		items[i] = conv.ToListItem()
	}

	return items, nil
}

// GetByID 获取对话详情
func (s *ConversationService) GetByID(id, userID int64) (*model.ConversationDetail, error) {
	conv, err := s.convRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("conversation not found")
		}
		return nil, err
	}

	// Load messages
	messages, err := s.msgRepo.FindByConversationID(id)
	if err != nil {
		return nil, err
	}
	conv.Messages = messages

	detail := conv.ToDetail()
	return &detail, nil
}

// UpdateTitle 更新对话标题
func (s *ConversationService) UpdateTitle(id, userID int64, title string) error {
	conv, err := s.convRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("conversation not found")
		}
		return err
	}

	conv.Title = title
	return s.convRepo.Update(conv)
}

// Delete 软删除对话
func (s *ConversationService) Delete(id, userID int64) error {
	_, err := s.convRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("conversation not found")
		}
		return err
	}

	return s.convRepo.SoftDelete(id, userID)
}

// Restore 恢复对话
func (s *ConversationService) Restore(id, userID int64) error {
	return s.convRepo.Restore(id, userID)
}

// GetTrash 获取回收站
func (s *ConversationService) GetTrash(userID int64) ([]model.ConversationListItem, error) {
	convs, err := s.convRepo.FindDeletedByUserID(userID)
	if err != nil {
		return nil, err
	}

	items := make([]model.ConversationListItem, len(convs))
	for i, conv := range convs {
		items[i] = conv.ToListItem()
	}

	return items, nil
}

// Search 搜索对话
func (s *ConversationService) Search(userID int64, query string, limit int) ([]model.ConversationListItem, error) {
	if limit <= 0 {
		limit = 20
	}

	convs, err := s.convRepo.Search(userID, query, limit)
	if err != nil {
		return nil, err
	}

	items := make([]model.ConversationListItem, len(convs))
	for i, conv := range convs {
		items[i] = conv.ToListItem()
	}

	return items, nil
}

// AddUserMessage 添加用户消息
func (s *ConversationService) AddUserMessage(conversationID int64, content string) (*model.Message, error) {
	msg := &model.Message{
		ConversationID: conversationID,
		Role:           model.MessageRoleUser,
		Content:        content,
	}

	if err := s.msgRepo.Create(msg); err != nil {
		return nil, err
	}

	return msg, nil
}

// AddAssistantMessage 添加 AI 消息
func (s *ConversationService) AddAssistantMessage(conversationID int64, content, modelName string) (*model.Message, error) {
	msg := &model.Message{
		ConversationID: conversationID,
		Role:           model.MessageRoleAssistant,
		Content:        content,
		Model:          modelName,
	}

	if err := s.msgRepo.Create(msg); err != nil {
		return nil, err
	}

	return msg, nil
}

// UpdateMessage 更新消息内容
func (s *ConversationService) UpdateMessage(msgID int64, content string) error {
	return s.msgRepo.UpdateContent(msgID, content)
}

// GetRecentMessages 获取最近的消息用于上下文
func (s *ConversationService) GetRecentMessages(conversationID int64, limit int) ([]model.Message, error) {
	return s.msgRepo.FindRecentByConversationID(conversationID, limit)
}

// GetLastAssistantMessage 获取最后一条 AI 消息
func (s *ConversationService) GetLastAssistantMessage(conversationID int64) (*model.Message, error) {
	return s.msgRepo.GetLastAssistantMessage(conversationID)
}

// RegenerateLastResponse 重新生成最后一条 AI 回复
func (s *ConversationService) RegenerateLastResponse(conversationID int64) (*model.Message, error) {
	// 获取最后一条 AI 消息
	lastMsg, err := s.msgRepo.GetLastAssistantMessage(conversationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("no assistant message to regenerate")
		}
		return nil, err
	}

	// 删除最后一条 AI 消息
	if err := s.msgRepo.Delete(lastMsg.ID); err != nil {
		return nil, err
	}

	return lastMsg, nil
}
