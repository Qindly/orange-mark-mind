package service

import (
	"errors"

	"github.com/Qindly/orange-mark-mind/internal/model"
	"github.com/Qindly/orange-mark-mind/internal/repository"
	"gorm.io/gorm"
)

// AdminService 管理员服务
type AdminService struct {
	userRepo   *repository.UserRepository
	folderRepo *repository.FolderRepository
	docRepo    *repository.DocumentRepository
}

// NewAdminService 创建管理员服务
func NewAdminService(userRepo *repository.UserRepository, folderRepo *repository.FolderRepository, docRepo *repository.DocumentRepository) *AdminService {
	return &AdminService{
		userRepo:   userRepo,
		folderRepo: folderRepo,
		docRepo:    docRepo,
	}
}

// UserListResponse 用户列表响应
type UserListResponse struct {
	Users    []model.UserResponse `json:"users"`
	Total    int64                `json:"total"`
	Page     int                  `json:"page"`
	PageSize int                  `json:"page_size"`
}

// GetUsers 获取用户列表
func (s *AdminService) GetUsers(page, pageSize int, search, role, status string) (*UserListResponse, error) {
	// 参数校验
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	users, total, err := s.userRepo.FindAllWithPagination(page, pageSize, search, role, status)
	if err != nil {
		return nil, err
	}

	// 转换为响应格式
	userResponses := make([]model.UserResponse, len(users))
	for i, user := range users {
		userResponses[i] = user.ToResponse()
	}

	return &UserListResponse{
		Users:    userResponses,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// GetUserByID 获取单个用户
func (s *AdminService) GetUserByID(userID int64) (*model.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	response := user.ToResponse()
	return &response, nil
}

// UpdateUserRequest 更新用户请求
type UpdateUserRequest struct {
	Nickname *string `json:"nickname"`
	Role     *string `json:"role"`
	Status   *string `json:"status"`
}

// UpdateUser 更新用户信息
func (s *AdminService) UpdateUser(userID int64, currentUserID int64, req *UpdateUserRequest) (*model.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// 不能修改自己的角色
	if req.Role != nil && userID == currentUserID {
		return nil, errors.New("cannot change own role")
	}

	// 更新字段
	if req.Nickname != nil {
		user.Nickname = *req.Nickname
	}
	if req.Role != nil {
		// 验证角色值
		if *req.Role != "admin" && *req.Role != "user" {
			return nil, errors.New("invalid role")
		}
		user.Role = *req.Role
	}
	if req.Status != nil {
		// 验证状态值
		if *req.Status != "active" && *req.Status != "inactive" && *req.Status != "banned" {
			return nil, errors.New("invalid status")
		}
		user.Status = *req.Status
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	response := user.ToResponse()
	return &response, nil
}

// DeleteUser 删除用户
func (s *AdminService) DeleteUser(userID int64, currentUserID int64) error {
	// 不能删除自己
	if userID == currentUserID {
		return errors.New("cannot delete own account")
	}

	// 验证用户存在
	_, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return err
	}

	// 删除用户（级联删除由数据库处理）
	return s.userRepo.Delete(userID)
}
