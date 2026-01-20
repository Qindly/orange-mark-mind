package model

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// Template 模板模型
type Template struct {
	ID          int64     `gorm:"primaryKey" json:"-"`                      // 内部 ID
	TemplateID  string    `gorm:"-" json:"id"`                              // 外部 ID (tpl-{n})
	UserID      *int64    `gorm:"index" json:"user_id,omitempty"`           // 所属用户，NULL 表示系统模板
	Name        string    `gorm:"size:100;not null" json:"name"`            // 模板名称
	Description *string   `gorm:"size:500" json:"description,omitempty"`    // 描述
	Icon        string    `gorm:"size:50;default:'document'" json:"icon"`   // 图标标识
	Content     *string   `gorm:"type:text" json:"content,omitempty"`       // Markdown 内容
	IsSystem    bool      `gorm:"default:false" json:"is_system"`           // 是否系统模板
	SortOrder   int       `gorm:"default:0" json:"sort_order"`              // 排序
	CreatedAt   time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time `gorm:"not null" json:"updated_at"`
}

// TableName 指定表名
func (Template) TableName() string {
	return "templates"
}

// ToExternalID 转换为外部 ID 格式 (tpl-{n})
func (t *Template) ToExternalID() string {
	return fmt.Sprintf("tpl-%d", t.ID)
}

// AfterFind GORM 钩子：查询后自动设置外部 ID
func (t *Template) AfterFind() error {
	t.TemplateID = t.ToExternalID()
	return nil
}

// ParseTemplateID 解析外部 ID 为内部 ID
// 输入: "tpl-1" 输出: 1, nil
func ParseTemplateID(externalID string) (int64, error) {
	if !strings.HasPrefix(externalID, "tpl-") {
		return 0, fmt.Errorf("invalid template ID format: %s", externalID)
	}
	idStr := strings.TrimPrefix(externalID, "tpl-")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid template ID: %s", externalID)
	}
	return id, nil
}
