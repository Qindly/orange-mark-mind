package handler

import (
	"strconv"
	"strings"

	"github.com/Qindly/orange-mark-mind/internal/service"
	"github.com/Qindly/orange-mark-mind/pkg/response"
	"github.com/gin-gonic/gin"
)

// ConversationHandler 对话处理器
type ConversationHandler struct {
	svc *service.ConversationService
}

// NewConversationHandler 创建对话处理器
func NewConversationHandler(svc *service.ConversationService) *ConversationHandler {
	return &ConversationHandler{svc: svc}
}

// GetList 获取对话列表
// GET /api/v1/conversations
func (h *ConversationHandler) GetList(c *gin.Context) {
	userID, _ := c.Get("user_id")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if limit <= 0 || limit > 100 {
		limit = 50
	}

	convs, err := h.svc.GetList(userID.(int64), limit, offset)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, convs)
}

// Create 创建对话
// POST /api/v1/conversations
func (h *ConversationHandler) Create(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req service.CreateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Allow empty body for creating untitled conversation
		req = service.CreateConversationRequest{}
	}

	conv, err := h.svc.Create(userID.(int64), &req)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, conv)
}

// GetByID 获取对话详情
// GET /api/v1/conversations/:id
func (h *ConversationHandler) GetByID(c *gin.Context) {
	userID, _ := c.Get("user_id")

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, "invalid id")
		return
	}

	conv, err := h.svc.GetByID(id, userID.(int64))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.ErrorWithMessage(c, response.CodeNotFound, "对话不存在")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, conv)
}

// Update 更新对话（标题）
// PUT /api/v1/conversations/:id
func (h *ConversationHandler) Update(c *gin.Context) {
	userID, _ := c.Get("user_id")

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, "invalid id")
		return
	}

	var req service.UpdateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	if err := h.svc.UpdateTitle(id, userID.(int64), req.Title); err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.ErrorWithMessage(c, response.CodeNotFound, "对话不存在")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "标题已更新"})
}

// Delete 删除对话（软删除）
// DELETE /api/v1/conversations/:id
func (h *ConversationHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("user_id")

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, "invalid id")
		return
	}

	if err := h.svc.Delete(id, userID.(int64)); err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.ErrorWithMessage(c, response.CodeNotFound, "对话不存在")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "对话已移入回收站"})
}

// Restore 恢复对话
// POST /api/v1/conversations/:id/restore
func (h *ConversationHandler) Restore(c *gin.Context) {
	userID, _ := c.Get("user_id")

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, "invalid id")
		return
	}

	if err := h.svc.Restore(id, userID.(int64)); err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "对话已恢复"})
}

// GetTrash 获取回收站
// GET /api/v1/conversations/trash
func (h *ConversationHandler) GetTrash(c *gin.Context) {
	userID, _ := c.Get("user_id")

	convs, err := h.svc.GetTrash(userID.(int64))
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, convs)
}

// Search 搜索对话
// GET /api/v1/conversations/search
func (h *ConversationHandler) Search(c *gin.Context) {
	userID, _ := c.Get("user_id")

	query := c.Query("q")
	if query == "" {
		response.ErrorWithMessage(c, response.CodeParamError, "搜索关键词不能为空")
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	convs, err := h.svc.Search(userID.(int64), query, limit)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, convs)
}

// SendMessage 发送消息
// POST /api/v1/conversations/:id/messages
func (h *ConversationHandler) SendMessage(c *gin.Context) {
	userID, _ := c.Get("user_id")

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, "invalid id")
		return
	}

	var req service.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	// Verify conversation exists and belongs to user
	_, err = h.svc.GetByID(id, userID.(int64))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.ErrorWithMessage(c, response.CodeNotFound, "对话不存在")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	// Add user message
	userMsg, err := h.svc.AddUserMessage(id, req.Content)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	// TODO: Call AI API to get response (streaming)
	// For now, return the user message
	response.Success(c, userMsg)
}

// RegenerateMessage 重新生成消息
// POST /api/v1/conversations/:id/messages/:msgId/regenerate
func (h *ConversationHandler) RegenerateMessage(c *gin.Context) {
	userID, _ := c.Get("user_id")

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, "invalid conversation id")
		return
	}

	// Verify conversation exists and belongs to user
	_, err = h.svc.GetByID(id, userID.(int64))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.ErrorWithMessage(c, response.CodeNotFound, "对话不存在")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	// Delete the last assistant message
	_, err = h.svc.RegenerateLastResponse(id)
	if err != nil {
		if strings.Contains(err.Error(), "no assistant message") {
			response.ErrorWithMessage(c, response.CodeBadRequest, "没有可重新生成的消息")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	// TODO: Call AI API to regenerate response (streaming)
	response.Success(c, gin.H{"message": "正在重新生成..."})
}
