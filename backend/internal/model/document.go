package model

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// Document 文档模型
type Document struct {
	ID          int64      `gorm:"primaryKey" json:"-"`                       // 内部 ID
	DocumentID  string     `gorm:"-" json:"id"`                               // 外部 ID (doc-{n})
	UserID      int64      `gorm:"not null;index" json:"user_id"`             // 所属用户
	FolderID    *int64     `gorm:"index" json:"-"`                            // 所属文件夹 ID
	FolderIDStr *string    `gorm:"-" json:"folder_id"`                        // 所属文件夹外部 ID
	FolderName  *string    `gorm:"-" json:"folder_name,omitempty"`            // 所属文件夹名称
	Title       string     `gorm:"size:200;not null;default:'无标题文档'" json:"title"` // 标题
	Content     *string    `gorm:"type:text" json:"content,omitempty"`        // Markdown 内容
	IsFavorited bool       `gorm:"default:false" json:"is_favorited"`         // 是否收藏
	IsDeleted   bool       `gorm:"default:false" json:"is_deleted"`           // 是否软删除
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`                      // 删除时间
	SortOrder   int        `gorm:"default:0" json:"sort_order"`               // 排序
	CreatedAt   time.Time  `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"not null" json:"updated_at"`
}

// TableName 指定表名
func (Document) TableName() string {
	return "documents"
}

// ToExternalID 转换为外部 ID 格式 (doc-{n})
func (d *Document) ToExternalID() string {
	return fmt.Sprintf("doc-%d", d.ID)
}

// AfterFind GORM 钩子：查询后自动设置外部 ID
func (d *Document) AfterFind() error {
	d.DocumentID = d.ToExternalID()
	if d.FolderID != nil {
		folderIDStr := fmt.Sprintf("kb-%d", *d.FolderID)
		d.FolderIDStr = &folderIDStr
	}
	return nil
}

// ParseDocumentID 解析外部 ID 为内部 ID
// 输入: "doc-1" 输出: 1, nil
func ParseDocumentID(externalID string) (int64, error) {
	if !strings.HasPrefix(externalID, "doc-") {
		return 0, fmt.Errorf("invalid document ID format: %s", externalID)
	}
	idStr := strings.TrimPrefix(externalID, "doc-")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid document ID: %s", externalID)
	}
	return id, nil
}
