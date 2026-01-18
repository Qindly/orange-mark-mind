package handler

import (
	"strings"

	"github.com/Qindly/orange-mark-mind/internal/service"
	"github.com/Qindly/orange-mark-mind/pkg/response"
	"github.com/gin-gonic/gin"
)

// FolderHandler 知识库处理器
type FolderHandler struct {
	folderService *service.FolderService
}

// NewFolderHandler 创建知识库处理器
func NewFolderHandler(folderService *service.FolderService) *FolderHandler {
	return &FolderHandler{folderService: folderService}
}

// Create 创建知识库
// POST /api/v1/folders
func (h *FolderHandler) Create(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req service.CreateFolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	folder, err := h.folderService.Create(userID.(int64), &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.Error(c, response.CodeFolderNotFound)
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, folder)
}

// GetByID 获取单个知识库
// GET /api/v1/folders/:id
func (h *FolderHandler) GetByID(c *gin.Context) {
	userID, _ := c.Get("user_id")
	folderID := c.Param("id")

	folder, err := h.folderService.GetByID(folderID, userID.(int64))
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "invalid") {
			response.Error(c, response.CodeFolderNotFound)
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, folder)
}

// GetList 获取知识库列表
// GET /api/v1/folders
func (h *FolderHandler) GetList(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// 解析查询参数
	flat := c.Query("flat") == "true"

	folders, err := h.folderService.GetList(userID.(int64), flat)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, folders)
}

// Update 更新知识库
// PUT /api/v1/folders/:id
func (h *FolderHandler) Update(c *gin.Context) {
	userID, _ := c.Get("user_id")
	folderID := c.Param("id")

	var req service.UpdateFolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	folder, err := h.folderService.Update(folderID, userID.(int64), &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "invalid") {
			response.Error(c, response.CodeFolderNotFound)
			return
		}
		if strings.Contains(err.Error(), "cannot") {
			response.ErrorWithMessage(c, response.CodeParamError, err.Error())
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, folder)
}

// Delete 删除知识库
// DELETE /api/v1/folders/:id
func (h *FolderHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("user_id")
	folderID := c.Param("id")

	// 解析查询参数
	// deleteChildren := c.Query("delete_children") == "true"

	affectedDocs, err := h.folderService.Delete(folderID, userID.(int64), false)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "invalid") {
			response.Error(c, response.CodeFolderNotFound)
			return
		}
		if strings.Contains(err.Error(), "cannot delete default") {
			response.ErrorWithMessage(c, response.CodeParamError, "默认知识库不可删除")
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, gin.H{
		"message":            "知识库已删除",
		"affected_documents": affectedDocs,
	})
}
