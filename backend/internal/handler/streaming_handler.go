package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/Qindly/orange-mark-mind/internal/model"
	"github.com/Qindly/orange-mark-mind/internal/repository"
	"github.com/Qindly/orange-mark-mind/internal/service"
	"github.com/Qindly/orange-mark-mind/pkg/response"
	"github.com/gin-gonic/gin"
)

// StreamingHandler 流式对话处理器
type StreamingHandler struct {
	convSvc       *service.ConversationService
	aiConfigRepo  *repository.AIConfigRepository
	aiClient      *service.AIClient
	encryptionKey string
}

// NewStreamingHandler 创建流式处理器
func NewStreamingHandler(
	convSvc *service.ConversationService,
	aiConfigRepo *repository.AIConfigRepository,
	aiClient *service.AIClient,
	encryptionKey string,
) *StreamingHandler {
	return &StreamingHandler{
		convSvc:       convSvc,
		aiConfigRepo:  aiConfigRepo,
		aiClient:      aiClient,
		encryptionKey: encryptionKey,
	}
}

// StreamMessageRequest 流式消息请求
type StreamMessageRequest struct {
	Content   string  `json:"content" binding:"required"`
	Model     string  `json:"model" binding:"required"`
	ConfigID  int64   `json:"config_id"`
	DocIDs    []int64 `json:"doc_ids"`
	FolderIDs []int64 `json:"folder_ids"`
}

// StreamMessage 发送消息并流式返回 AI 响应
// POST /api/v1/conversations/:id/messages/stream
func (h *StreamingHandler) StreamMessage(c *gin.Context) {
	userID, _ := c.Get("user_id")

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, "invalid id")
		return
	}

	var req StreamMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	// Verify conversation exists and belongs to user
	conv, err := h.convSvc.GetByID(id, userID.(int64))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.ErrorWithMessage(c, response.CodeNotFound, "对话不存在")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	// Get AI config
	var config *model.AIConfig
	if req.ConfigID > 0 {
		config, err = h.aiConfigRepo.FindByIDAndUserID(req.ConfigID, userID.(int64))
	} else {
		config, err = h.aiConfigRepo.FindDefaultByUserID(userID.(int64))
	}
	if err != nil {
		response.ErrorWithMessage(c, response.CodeBadRequest, "请先配置 AI 提供商")
		return
	}

	// Add user message
	_, err = h.convSvc.AddUserMessage(id, req.Content)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	// Get recent messages for context
	contextRounds := 6 // Default, can be read from user settings later
	messages, err := h.convSvc.GetRecentMessages(id, contextRounds)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	// Convert to AI client format
	chatMessages := make([]service.ChatMessage, len(messages))
	for i, msg := range messages {
		chatMessages[i] = service.ChatMessage{
			Role:    msg.Role,
			Content: msg.Content,
		}
	}

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	ctx, cancel := context.WithCancel(c.Request.Context())
	defer cancel()

	// Stream AI response
	fullContent, err := h.aiClient.StreamChat(
		ctx,
		config,
		chatMessages,
		req.Model,
		h.encryptionKey,
		func(chunk service.StreamChunk) error {
			data, _ := json.Marshal(chunk)
			_, writeErr := c.Writer.WriteString(fmt.Sprintf("data: %s\n\n", data))
			if writeErr != nil {
				return writeErr
			}
			c.Writer.Flush()
			return nil
		},
	)

	if err != nil {
		// Send error as SSE event
		errChunk := service.StreamChunk{Error: err.Error(), Done: true}
		data, _ := json.Marshal(errChunk)
		c.Writer.WriteString(fmt.Sprintf("data: %s\n\n", data))
		c.Writer.Flush()
		return
	}

	// Save AI message
	msg, err := h.convSvc.AddAssistantMessage(id, fullContent, req.Model)
	if err != nil {
		return
	}

	// Auto-generate title if this is the first exchange and no title
	if conv.Title == "" && len(messages) <= 2 {
		// TODO: Generate title using summary model
		_ = msg // Suppress unused warning
	}

	c.Status(http.StatusOK)
}

// StreamRegenerate 重新生成最后一条 AI 消息
// POST /api/v1/conversations/:id/messages/regenerate/stream
func (h *StreamingHandler) StreamRegenerate(c *gin.Context) {
	userID, _ := c.Get("user_id")

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, "invalid id")
		return
	}

	// Verify conversation exists and belongs to user
	_, err = h.convSvc.GetByID(id, userID.(int64))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.ErrorWithMessage(c, response.CodeNotFound, "对话不存在")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	// Delete last assistant message
	lastMsg, err := h.convSvc.RegenerateLastResponse(id)
	if err != nil {
		if strings.Contains(err.Error(), "no assistant message") {
			response.ErrorWithMessage(c, response.CodeBadRequest, "没有可重新生成的消息")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	// Get AI config
	config, err := h.aiConfigRepo.FindDefaultByUserID(userID.(int64))
	if err != nil {
		response.ErrorWithMessage(c, response.CodeBadRequest, "请先配置 AI 提供商")
		return
	}

	// Get recent messages for context
	contextRounds := 6
	messages, err := h.convSvc.GetRecentMessages(id, contextRounds)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	// Convert to AI client format
	chatMessages := make([]service.ChatMessage, len(messages))
	for i, msg := range messages {
		chatMessages[i] = service.ChatMessage{
			Role:    msg.Role,
			Content: msg.Content,
		}
	}

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	ctx, cancel := context.WithCancel(c.Request.Context())
	defer cancel()

	// Stream AI response
	fullContent, err := h.aiClient.StreamChat(
		ctx,
		config,
		chatMessages,
		lastMsg.Model,
		h.encryptionKey,
		func(chunk service.StreamChunk) error {
			data, _ := json.Marshal(chunk)
			_, writeErr := c.Writer.WriteString(fmt.Sprintf("data: %s\n\n", data))
			if writeErr != nil {
				return writeErr
			}
			c.Writer.Flush()
			return nil
		},
	)

	if err != nil {
		errChunk := service.StreamChunk{Error: err.Error(), Done: true}
		data, _ := json.Marshal(errChunk)
		c.Writer.WriteString(fmt.Sprintf("data: %s\n\n", data))
		c.Writer.Flush()
		return
	}

	// Save AI message
	_, _ = h.convSvc.AddAssistantMessage(id, fullContent, lastMsg.Model)

	c.Status(http.StatusOK)
}
