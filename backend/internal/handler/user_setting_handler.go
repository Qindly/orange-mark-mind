package handler

import (
	"github.com/Qindly/orange-mark-mind/internal/service"
	"github.com/Qindly/orange-mark-mind/pkg/response"
	"github.com/gin-gonic/gin"
)

// UserSettingHandler 用户设置处理器
type UserSettingHandler struct {
	svc *service.UserSettingService
}

// NewUserSettingHandler 创建用户设置处理器
func NewUserSettingHandler(svc *service.UserSettingService) *UserSettingHandler {
	return &UserSettingHandler{svc: svc}
}

// GetAll 获取所有设置
// GET /api/v1/settings
func (h *UserSettingHandler) GetAll(c *gin.Context) {
	userID, _ := c.Get("user_id")

	settings, err := h.svc.GetAllSettings(userID.(int64))
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, settings)
}

// Get 获取指定设置
// GET /api/v1/settings/:key
func (h *UserSettingHandler) Get(c *gin.Context) {
	userID, _ := c.Get("user_id")
	key := c.Param("key")

	if key == "" {
		response.ErrorWithMessage(c, response.CodeParamError, "setting key is required")
		return
	}

	setting, err := h.svc.GetSetting(userID.(int64), key)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, setting)
}

// Update 更新设置
// PUT /api/v1/settings/:key
func (h *UserSettingHandler) Update(c *gin.Context) {
	userID, _ := c.Get("user_id")
	key := c.Param("key")

	if key == "" {
		response.ErrorWithMessage(c, response.CodeParamError, "setting key is required")
		return
	}

	var req service.UpdateSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	setting, err := h.svc.UpdateSetting(userID.(int64), key, req.Value)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, setting)
}

// Delete 删除设置
// DELETE /api/v1/settings/:key
func (h *UserSettingHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("user_id")
	key := c.Param("key")

	if key == "" {
		response.ErrorWithMessage(c, response.CodeParamError, "setting key is required")
		return
	}

	if err := h.svc.DeleteSetting(userID.(int64), key); err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "设置已删除"})
}
