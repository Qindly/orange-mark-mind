package model

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// Folder 知识库/文件夹模型
type Folder struct {
	ID          int64     `gorm:"primaryKey" json:"-"`                     // 内部 ID
	FolderID    string    `gorm:"-" json:"id"`                             // 外部 ID (kb-{n})
	UserID      int64     `gorm:"not null;index" json:"user_id"`           // 所属用户
	ParentID    *int64    `gorm:"index" json:"-"`                          // 父文件夹 ID
	ParentIDStr *string   `gorm:"-" json:"parent_id"`                      // 父文件夹外部 ID
	Name        string    `gorm:"size:100;not null" json:"name"`           // 名称
	Description *string   `gorm:"size:500" json:"description,omitempty"`   // 描述
	SortOrder   int       `gorm:"default:0" json:"sort_order"`             // 排序
	CreatedAt   time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time `gorm:"not null" json:"updated_at"`

	// 关联字段（非数据库字段）
	Children      []Folder `gorm:"-" json:"children,omitempty"`       // 子文件夹
	DocumentCount *int     `gorm:"-" json:"document_count,omitempty"` // 文档数量
}

// TableName 指定表名
func (Folder) TableName() string {
	return "folders"
}

// 默认知识库 ID
const DefaultFolderID int64 = 0

// ToExternalID 转换为外部 ID 格式 (kb-{n})
func (f *Folder) ToExternalID() string {
	return fmt.Sprintf("kb-%d", f.ID)
}

// AfterFind GORM 钩子：查询后自动设置外部 ID
func (f *Folder) AfterFind() error {
	f.FolderID = f.ToExternalID()
	if f.ParentID != nil {
		parentIDStr := fmt.Sprintf("kb-%d", *f.ParentID)
		f.ParentIDStr = &parentIDStr
	}
	return nil
}

// ParseFolderID 解析外部 ID 为内部 ID
// 输入: "kb-1" 输出: 1, nil
func ParseFolderID(externalID string) (int64, error) {
	if !strings.HasPrefix(externalID, "kb-") {
		return 0, fmt.Errorf("invalid folder ID format: %s", externalID)
	}
	idStr := strings.TrimPrefix(externalID, "kb-")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid folder ID: %s", externalID)
	}
	return id, nil
}
