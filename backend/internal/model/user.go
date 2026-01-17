package model

import (
	"time"
)

// User 用户模型
type User struct {
	ID           int64     `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Email        string    `gorm:"uniqueIndex;size:100;not null" json:"email"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"` // json:"-" 不返回密码
	Nickname     string    `gorm:"size:50" json:"nickname"`
	Avatar       string    `gorm:"size:255" json:"avatar"`
	Role         string    `gorm:"size:20;not null;default:user" json:"role"`
	Status       string    `gorm:"size:20;not null;default:active" json:"status"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt    time.Time `gorm:"not null" json:"updated_at"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// UserRole 用户角色常量
const (
	RoleUser  = "user"
	RoleAdmin = "admin"
)

// UserStatus 用户状态常量
const (
	StatusActive   = "active"
	StatusDisabled = "disabled"
)

// IsActive 检查用户是否激活
func (u *User) IsActive() bool {
	return u.Status == StatusActive
}

// IsAdmin 检查用户是否是管理员
func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}
