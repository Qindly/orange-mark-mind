package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/Qindly/orange-mark-mind/internal/config"
	"github.com/Qindly/orange-mark-mind/internal/model"
	"github.com/Qindly/orange-mark-mind/internal/repository"
	"github.com/Qindly/orange-mark-mind/pkg/utils"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// AuthService 认证服务
type AuthService struct {
	userRepo    *repository.UserRepository
	redisClient *redis.Client
	config      *config.Config
}

// NewAuthService 创建认证服务
func NewAuthService(userRepo *repository.UserRepository, redisClient *redis.Client, cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo:    userRepo,
		redisClient: redisClient,
		config:      cfg,
	}
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=50"`
	Nickname string `json:"nickname"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"` // 可以是用户名或邮箱
	Password string `json:"password" binding:"required"`
}

// RefreshRequest 刷新 Token 请求
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// AuthResponse 认证响应
type AuthResponse struct {
	User      *model.User     `json:"user"`
	TokenPair *utils.TokenPair `json:"tokens"`
}

// RefreshTokenMeta Refresh Token 元数据（存储在 Redis）
type RefreshTokenMeta struct {
	UserID    int64  `json:"user_id"`
	Username  string `json:"username"`
	CreatedAt int64  `json:"created_at"`
}

// Register 用户注册
func (s *AuthService) Register(req *RegisterRequest) (*model.User, error) {
	// 检查用户名是否存在
	exists, err := s.userRepo.ExistsByUsername(req.Username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("username already exists")
	}

	// 检查邮箱是否存在
	exists, err = s.userRepo.ExistsByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("email already exists")
	}

	// 加密密码
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// 创建用户
	user := &model.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: passwordHash,
		Nickname:     req.Nickname,
		Role:         model.RoleUser,
		Status:       model.StatusActive,
	}

	if user.Nickname == "" {
		user.Nickname = user.Username
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}

// Login 用户登录
func (s *AuthService) Login(req *LoginRequest) (*AuthResponse, error) {
	// 查找用户（支持用户名或邮箱登录）
	user, err := s.userRepo.FindByUsernameOrEmail(req.Username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	// 检查用户状态
	if !user.IsActive() {
		return nil, errors.New("user is disabled")
	}

	// 验证密码
	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid credentials")
	}

	// 生成 Token 对
	tokenPair, err := utils.GenerateTokenPair(
		user.ID,
		user.Username,
		user.Role,
		s.config.JWTSecret,
		s.config.JWTAccessTokenExpire,
		s.config.JWTRefreshTokenExpire,
	)
	if err != nil {
		return nil, err
	}

	// 将 Refresh Token 存入 Redis
	if err := s.storeRefreshToken(user.ID, user.Username, tokenPair.RefreshToken); err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:      user,
		TokenPair: tokenPair,
	}, nil
}

// Refresh 刷新 Token
func (s *AuthService) Refresh(refreshToken string) (*utils.TokenPair, error) {
	// 解析 Refresh Token
	claims, err := utils.ParseToken(refreshToken, s.config.JWTSecret)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	// 验证 Token 类型
	if claims.TokenType != utils.RefreshToken {
		return nil, errors.New("invalid token type")
	}

	// 检查 Token 是否在 Redis 中存在
	tokenHash := utils.SHA256Hash(refreshToken)
	key := fmt.Sprintf("rt:%d:%s", claims.UserID, tokenHash)
	
	ctx := context.Background()
	exists, err := s.redisClient.Exists(ctx, key).Result()
	if err != nil {
		return nil, err
	}
	if exists == 0 {
		return nil, errors.New("refresh token not found or expired")
	}

	// 查找用户确认状态
	user, err := s.userRepo.FindByID(claims.UserID)
	if err != nil {
		return nil, err
	}
	if !user.IsActive() {
		return nil, errors.New("user is disabled")
	}

	// 删除旧的 Refresh Token
	s.redisClient.Del(ctx, key)

	// 生成新的 Token 对
	tokenPair, err := utils.GenerateTokenPair(
		user.ID,
		user.Username,
		user.Role,
		s.config.JWTSecret,
		s.config.JWTAccessTokenExpire,
		s.config.JWTRefreshTokenExpire,
	)
	if err != nil {
		return nil, err
	}

	// 存储新的 Refresh Token
	if err := s.storeRefreshToken(user.ID, user.Username, tokenPair.RefreshToken); err != nil {
		return nil, err
	}

	return tokenPair, nil
}

// Logout 登出（注销当前 Token）
func (s *AuthService) Logout(accessToken, refreshToken string) error {
	ctx := context.Background()

	// 解析 Access Token 获取用户信息
	claims, err := utils.ParseToken(accessToken, s.config.JWTSecret)
	if err != nil {
		return errors.New("invalid access token")
	}

	// 将 Access Token 加入黑名单
	atHash := utils.SHA256Hash(accessToken)
	blacklistKey := fmt.Sprintf("blacklist:at:%s", atHash)
	
	// 计算 AT 剩余有效期
	ttl := time.Until(claims.ExpiresAt.Time)
	if ttl > 0 {
		s.redisClient.Set(ctx, blacklistKey, "1", ttl)
	}

	// 删除 Refresh Token
	if refreshToken != "" {
		rtHash := utils.SHA256Hash(refreshToken)
		rtKey := fmt.Sprintf("rt:%d:%s", claims.UserID, rtHash)
		s.redisClient.Del(ctx, rtKey)
	}

	return nil
}

// LogoutAll 登出所有设备
func (s *AuthService) LogoutAll(userID int64, currentAccessToken string) error {
	ctx := context.Background()

	// 将当前 Access Token 加入黑名单
	if currentAccessToken != "" {
		claims, err := utils.ParseToken(currentAccessToken, s.config.JWTSecret)
		if err == nil {
			atHash := utils.SHA256Hash(currentAccessToken)
			blacklistKey := fmt.Sprintf("blacklist:at:%s", atHash)
			ttl := time.Until(claims.ExpiresAt.Time)
			if ttl > 0 {
				s.redisClient.Set(ctx, blacklistKey, "1", ttl)
			}
		}
	}

	// 删除该用户所有的 Refresh Token
	pattern := fmt.Sprintf("rt:%d:*", userID)
	iter := s.redisClient.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		s.redisClient.Del(ctx, iter.Val())
	}

	return nil
}

// IsAccessTokenBlacklisted 检查 Access Token 是否在黑名单中
func (s *AuthService) IsAccessTokenBlacklisted(accessToken string) (bool, error) {
	ctx := context.Background()
	atHash := utils.SHA256Hash(accessToken)
	blacklistKey := fmt.Sprintf("blacklist:at:%s", atHash)
	
	exists, err := s.redisClient.Exists(ctx, blacklistKey).Result()
	if err != nil {
		return false, err
	}
	return exists > 0, nil
}

// ChangePasswordRequest 修改密码请求
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6,max=50"`
}

// ChangePassword 修改密码
func (s *AuthService) ChangePassword(userID int64, req *ChangePasswordRequest) error {
	// 查找用户
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return err
	}

	// 检查用户状态
	if !user.IsActive() {
		return errors.New("user is disabled")
	}

	// 验证旧密码
	if !utils.CheckPassword(req.OldPassword, user.PasswordHash) {
		return errors.New("incorrect old password")
	}

	// 加密新密码
	newPasswordHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	// 更新密码
	user.PasswordHash = newPasswordHash
	if err := s.userRepo.Update(user); err != nil {
		return err
	}

	return nil
}

// storeRefreshToken 存储 Refresh Token 到 Redis
func (s *AuthService) storeRefreshToken(userID int64, username, refreshToken string) error {
	ctx := context.Background()
	tokenHash := utils.SHA256Hash(refreshToken)
	key := fmt.Sprintf("rt:%d:%s", userID, tokenHash)

	meta := RefreshTokenMeta{
		UserID:    userID,
		Username:  username,
		CreatedAt: time.Now().Unix(),
	}

	metaJSON, err := json.Marshal(meta)
	if err != nil {
		return err
	}

	return s.redisClient.Set(ctx, key, metaJSON, s.config.JWTRefreshTokenExpire).Err()
}
