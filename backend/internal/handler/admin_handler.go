package handler

import (
	"strconv"

	"github.com/Qindly/orange-mark-mind/internal/service"
	"github.com/Qindly/orange-mark-mind/pkg/response"
	"github.com/gin-gonic/gin"
)

// AdminHandler 管理员处理器
type AdminHandler struct {
	adminService *service.AdminService
}

// NewAdminHandler 创建管理员处理器
func NewAdminHandler(adminService *service.AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

// GetUsers 获取用户列表
// @Summary 获取用户列表
// @Tags Admin
// @Security BearerAuth
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(10)
// @Param search query string false "搜索关键词"
// @Param role query string false "角色筛选"
// @Param status query string false "状态筛选"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users [get]
func (h *AdminHandler) GetUsers(c *gin.Context) {
	// 获取分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	search := c.Query("search")
	role := c.Query("role")
	status := c.Query("status")

	result, err := h.adminService.GetUsers(page, pageSize, search, role, status)
	if err != nil {
		response.ErrorWithMsg(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, result)
}

// GetUserByID 获取单个用户
// @Summary 获取用户详情
// @Tags Admin
// @Security BearerAuth
// @Param id path int true "用户ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/{id} [get]
func (h *AdminHandler) GetUserByID(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		response.ErrorWithMsg(c, response.CodeBadRequest, "invalid user id")
		return
	}

	result, err := h.adminService.GetUserByID(userID)
	if err != nil {
		if err.Error() == "user not found" {
			response.ErrorWithMsg(c, response.CodeNotFound, "用户不存在")
			return
		}
		response.ErrorWithMsg(c, response.CodeInternalError, err.Error())
		return
	}

	response.Success(c, result)
}

// UpdateUser 更新用户
// @Summary 更新用户信息
// @Tags Admin
// @Security BearerAuth
// @Param id path int true "用户ID"
// @Param body body service.UpdateUserRequest true "更新内容"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/{id} [put]
func (h *AdminHandler) UpdateUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		response.ErrorWithMsg(c, response.CodeBadRequest, "invalid user id")
		return
	}

	// 获取当前用户ID
	currentUserID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, response.CodeUnauthorized)
		return
	}

	var req service.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorWithMsg(c, response.CodeBadRequest, "invalid request body")
		return
	}

	result, err := h.adminService.UpdateUser(userID, currentUserID.(int64), &req)
	if err != nil {
		switch err.Error() {
		case "user not found":
			response.ErrorWithMsg(c, response.CodeNotFound, "用户不存在")
		case "cannot change own role":
			response.ErrorWithMsg(c, response.CodeBadRequest, "不能修改自己的角色")
		case "invalid role":
			response.ErrorWithMsg(c, response.CodeBadRequest, "无效的角色值")
		case "invalid status":
			response.ErrorWithMsg(c, response.CodeBadRequest, "无效的状态值")
		default:
			response.ErrorWithMsg(c, response.CodeInternalError, err.Error())
		}
		return
	}

	response.Success(c, result)
}

// DeleteUser 删除用户
// @Summary 删除用户
// @Tags Admin
// @Security BearerAuth
// @Param id path int true "用户ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/{id} [delete]
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		response.ErrorWithMsg(c, response.CodeBadRequest, "invalid user id")
		return
	}

	// 获取当前用户ID
	currentUserID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, response.CodeUnauthorized)
		return
	}

	err = h.adminService.DeleteUser(userID, currentUserID.(int64))
	if err != nil {
		switch err.Error() {
		case "user not found":
			response.ErrorWithMsg(c, response.CodeNotFound, "用户不存在")
		case "cannot delete own account":
			response.ErrorWithMsg(c, response.CodeBadRequest, "不能删除自己的账号")
		default:
			response.ErrorWithMsg(c, response.CodeInternalError, err.Error())
		}
		return
	}

	response.Success(c, gin.H{"message": "用户已删除"})
}
