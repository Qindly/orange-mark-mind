-- ============================================================================
-- Migration: 000016_seed_demo_user7_data
-- Description: 为用户 ID 7 添加"展示"知识库和文档
-- Author: Orange Mark Mind
-- Created: 2026-01-20
-- ============================================================================

-- 用户 7 的"展示"知识库（使用动态 ID，避免冲突）
INSERT INTO folders (user_id, parent_id, name, description, sort_order, created_at, updated_at) VALUES
(7, NULL, '展示', '用于展示 Orange Mark Mind 功能的知识库', 0, NOW(), NOW());

-- 用户 7 的"展示"文档（使用动态 ID，引用刚创建的知识库）
INSERT INTO documents (user_id, folder_id, title, content, is_favorited, is_deleted, sort_order, created_at, updated_at) VALUES
(7, (SELECT id FROM folders WHERE user_id = 7 AND name = '展示' LIMIT 1), '展示', '# 欢迎来到 Orange Mark Mind

这是一个功能展示文档，让我们一起探索 Orange Mark Mind 的强大功能吧！

## 核心功能介绍

### 📝 Markdown 渲染

Orange Mark Mind 支持完整的 Markdown 语法：

- **粗体文字** 和 *斜体文字*
- `行内代码` 和代码块
- 有序列表和无序列表
- [链接](https://example.com)

### 💻 代码高亮

支持多种编程语言的语法高亮：

```javascript
// JavaScript 示例
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet("Orange Mark Mind");
```

```python
# Python 示例
def greet(name):
    print(f"Hello, {name}!")

greet("Orange Mark Mind")
```

```go
// Go 示例
package main

import "fmt"

func main() {
    fmt.Println("Hello, Orange Mark Mind!")
}
```

### 📚 标题自动生成

文档中的标题会自动生成目录导航，方便快速定位到不同章节。

### 📁 知识库 CRUD

- **创建** 新的知识库来组织您的文档
- **查看** 知识库中的所有文档
- **更新** 知识库名称和描述
- **删除** 不需要的知识库

### 📄 文档 CRUD

- **创建** 新文档记录您的想法
- **查看** 文档内容，支持实时预览
- **更新** 文档内容，自动保存
- **删除** 文档（移入回收站）

### 👤 用户管理

通过右上角的用户下拉框：

- 访问**设置**页面配置个人偏好
- 进入**管理面板**管理系统（管理员）
- 查看个人信息

### ⭐ 收藏功能

点击文档旁边的星标即可收藏重要文档，方便快速访问。

### 🗑️ 回收站

删除的文档会进入回收站，支持：

- **恢复** 误删的文档
- **永久删除** 不需要的文档
- **清空回收站** 一键清理

---

## 开始使用

现在，开始创建您的第一个知识库吧！

> 💡 提示：使用左侧导航栏可以快速切换不同的知识库和文档。

---

*感谢使用 Orange Mark Mind！*
', false, false, 0, NOW(), NOW());
