package handler

import (
	"strconv"
	"strings"

	"github.com/Qindly/orange-mark-mind/internal/service"
	"github.com/Qindly/orange-mark-mind/pkg/response"
	"github.com/gin-gonic/gin"
)

// DocumentHandler 文档处理器
type DocumentHandler struct {
	docService *service.DocumentService
}

// NewDocumentHandler 创建文档处理器
func NewDocumentHandler(docService *service.DocumentService) *DocumentHandler {
	return &DocumentHandler{docService: docService}
}

// Create 创建文档
// POST /api/v1/documents
func (h *DocumentHandler) Create(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req service.CreateDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	doc, err := h.docService.Create(userID.(int64), &req)
	if err != nil {
		if strings.Contains(err.Error(), "invalid") {
			response.ErrorWithMessage(c, response.CodeParamError, err.Error())
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, doc)
}

// GetByID 获取单个文档
// GET /api/v1/documents/:id
func (h *DocumentHandler) GetByID(c *gin.Context) {
	userID, _ := c.Get("user_id")
	docID := c.Param("id")

	doc, err := h.docService.GetByID(docID, userID.(int64))
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "invalid") {
			response.Error(c, response.CodeDocumentNotFound)
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, doc)
}

// GetList 获取文档列表
// GET /api/v1/documents
func (h *DocumentHandler) GetList(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// 解析查询参数
	folderID := c.Query("folder_id")

	var folderIDPtr *string
	if folderID != "" {
		folderIDPtr = &folderID
	}

	docs, err := h.docService.GetList(userID.(int64), folderIDPtr)
	if err != nil {
		if strings.Contains(err.Error(), "invalid") {
			response.ErrorWithMessage(c, response.CodeParamError, err.Error())
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, docs)
}

// GetRecent 获取最近文档
// GET /api/v1/documents/recent
func (h *DocumentHandler) GetRecent(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// 解析 limit 参数
	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	docs, err := h.docService.GetRecent(userID.(int64), limit)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, docs)
}

// GetFavorites 获取收藏文档
// GET /api/v1/documents/favorites
func (h *DocumentHandler) GetFavorites(c *gin.Context) {
	userID, _ := c.Get("user_id")

	docs, err := h.docService.GetFavorites(userID.(int64))
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, docs)
}

// GetTrash 获取回收站文档
// GET /api/v1/documents/trash
func (h *DocumentHandler) GetTrash(c *gin.Context) {
	userID, _ := c.Get("user_id")

	docs, err := h.docService.GetTrash(userID.(int64))
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, docs)
}

// Update 更新文档
// PUT /api/v1/documents/:id
func (h *DocumentHandler) Update(c *gin.Context) {
	userID, _ := c.Get("user_id")
	docID := c.Param("id")

	var req service.UpdateDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMessage(c, response.CodeParamError, err.Error())
		return
	}

	doc, err := h.docService.Update(docID, userID.(int64), &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "invalid") {
			response.Error(c, response.CodeDocumentNotFound)
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, doc)
}

// Delete 删除文档
// DELETE /api/v1/documents/:id
func (h *DocumentHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("user_id")
	docID := c.Param("id")

	// 解析查询参数
	permanent := c.Query("permanent") == "true"

	err := h.docService.Delete(docID, userID.(int64), permanent)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "invalid") {
			response.Error(c, response.CodeDocumentNotFound)
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	msg := "文档已移入回收站"
	if permanent {
		msg = "文档已永久删除"
	}
	response.Success(c, gin.H{"message": msg})
}

// Restore 恢复文档
// POST /api/v1/documents/:id/restore
func (h *DocumentHandler) Restore(c *gin.Context) {
	userID, _ := c.Get("user_id")
	docID := c.Param("id")

	err := h.docService.Restore(docID, userID.(int64))
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "invalid") {
			response.Error(c, response.CodeDocumentNotFound)
			return
		}
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "文档已恢复"})
}

// Search 搜索文档
// GET /api/v1/documents/search?q=关键词&limit=20
func (h *DocumentHandler) Search(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// 获取搜索关键词
	query := strings.TrimSpace(c.Query("q"))
	if query == "" {
		response.ErrorWithMessage(c, response.CodeParamError, "搜索关键词不能为空")
		return
	}
	if len(query) > 100 {
		response.ErrorWithMessage(c, response.CodeParamError, "搜索关键词过长")
		return
	}

	// 解析 limit 参数
	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	docs, err := h.docService.Search(userID.(int64), query, limit)
	if err != nil {
		response.ErrorWithMessage(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, docs)
}
