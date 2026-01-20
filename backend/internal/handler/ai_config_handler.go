package handler

import (
	"strconv"
	"strings"

	"github.com/Qindly/orange-mark-mind/internal/service"
	"github.com/Qindly/orange-mark-mind/pkg/response"
	"github.com/gin-gonic/gin"
)

// AIConfigHandler AI 配置处理器
type AIConfigHandler struct {
	svc *service.AIConfigService
}

// NewAIConfigHandler 创建 AI 配置处理器
func NewAIConfigHandler(svc *service.AIConfigService) *AIConfigHandler {
	return &AIConfigHandler{svc: svc}
}

// GetList 获取配置列表
// GET /api/v1/ai-configs
func (h *AIConfigHandler) GetList(c *gin.Context) {
	userID, _ := c.Get("user_id")

	configs, err := h.svc.GetByUserID(userID.(int64))
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, configs)
}

// Create 创建配置
// POST /api/v1/ai-configs
func (h *AIConfigHandler) Create(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req service.CreateAIConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	config, err := h.svc.Create(userID.(int64), &req)
	if err != nil {
		if strings.Contains(err.Error(), "already exists") {
			response.ErrorWithMessage(c, response.CodeBadRequest, "配置名称已存在")
			return
		}
		if strings.Contains(err.Error(), "invalid") {
			response.ErrorWithMessage(c, response.CodeParamError, err.Error())
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, config)
}

// Update 更新配置
// PUT /api/v1/ai-configs/:id
func (h *AIConfigHandler) Update(c *gin.Context) {
	userID, _ := c.Get("user_id")

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, "invalid id")
		return
	}

	var req service.UpdateAIConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	config, err := h.svc.Update(id, userID.(int64), &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.Error(c, response.CodeAIConfigNotFound)
			return
		}
		if strings.Contains(err.Error(), "already exists") {
			response.ErrorWithMessage(c, response.CodeBadRequest, "配置名称已存在")
			return
		}
		if strings.Contains(err.Error(), "invalid") {
			response.ErrorWithMessage(c, response.CodeParamError, err.Error())
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, config)
}

// Delete 删除配置
// DELETE /api/v1/ai-configs/:id
func (h *AIConfigHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("user_id")

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, "invalid id")
		return
	}

	err = h.svc.Delete(id, userID.(int64))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.Error(c, response.CodeAIConfigNotFound)
			return
		}
		if strings.Contains(err.Error(), "cannot delete default") {
			response.ErrorWithMessage(c, response.CodeBadRequest, "默认配置不可删除，请先设置其他配置为默认")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "配置已删除"})
}

// SetDefault 设为默认配置
// PUT /api/v1/ai-configs/:id/default
func (h *AIConfigHandler) SetDefault(c *gin.Context) {
	userID, _ := c.Get("user_id")

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, "invalid id")
		return
	}

	config, err := h.svc.SetDefault(id, userID.(int64))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.Error(c, response.CodeAIConfigNotFound)
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, config)
}
