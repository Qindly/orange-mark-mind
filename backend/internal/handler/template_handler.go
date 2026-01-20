package handler

import (
	"strings"

	"github.com/Qindly/orange-mark-mind/internal/service"
	"github.com/Qindly/orange-mark-mind/pkg/response"
	"github.com/gin-gonic/gin"
)

// TemplateHandler 模板处理器
type TemplateHandler struct {
	templateService *service.TemplateService
}

// NewTemplateHandler 创建模板处理器
func NewTemplateHandler(templateService *service.TemplateService) *TemplateHandler {
	return &TemplateHandler{templateService: templateService}
}

// GetList 获取模板列表
// GET /api/v1/templates
func (h *TemplateHandler) GetList(c *gin.Context) {
	userID, _ := c.Get("user_id")

	templates, err := h.templateService.GetList(userID.(int64))
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, templates)
}

// GetByID 获取单个模板
// GET /api/v1/templates/:id
func (h *TemplateHandler) GetByID(c *gin.Context) {
	userID, _ := c.Get("user_id")
	templateID := c.Param("id")

	template, err := h.templateService.GetByID(templateID, userID.(int64))
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "invalid") {
			response.ErrorWithMessage(c, response.CodeNotFound, "模板不存在")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, template)
}

// Create 创建用户模板
// POST /api/v1/templates
func (h *TemplateHandler) Create(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req service.CreateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	template, err := h.templateService.Create(userID.(int64), &req)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, template)
}

// Update 更新用户模板
// PUT /api/v1/templates/:id
func (h *TemplateHandler) Update(c *gin.Context) {
	userID, _ := c.Get("user_id")
	templateID := c.Param("id")

	var req service.UpdateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	template, err := h.templateService.Update(templateID, userID.(int64), &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "cannot be modified") {
			response.ErrorWithMessage(c, response.CodeNotFound, "模板不存在或无法修改")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, template)
}

// Delete 删除用户模板
// DELETE /api/v1/templates/:id
func (h *TemplateHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("user_id")
	templateID := c.Param("id")

	err := h.templateService.Delete(templateID, userID.(int64))
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "cannot be deleted") {
			response.ErrorWithMessage(c, response.CodeNotFound, "模板不存在或无法删除")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "模板已删除"})
}

// UseTemplate 使用模板创建文档
// POST /api/v1/templates/:id/use
func (h *TemplateHandler) UseTemplate(c *gin.Context) {
	userID, _ := c.Get("user_id")
	templateID := c.Param("id")

	var req service.UseTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	doc, err := h.templateService.UseTemplate(templateID, userID.(int64), &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.ErrorWithMessage(c, response.CodeNotFound, "模板不存在")
			return
		}
		if strings.Contains(err.Error(), "invalid") {
			response.ErrorWithMessage(c, response.CodeParamError, err.Error())
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, doc)
}
