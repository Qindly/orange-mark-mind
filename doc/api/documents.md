# 文档接口文档

> `/api/v1/documents` - 文档管理相关接口

## ID 格式规范

| 实体   | ID 格式        | 示例          |
| :----- | :------------- | :------------ |
| 文档   | `doc-{number}` | `doc-1`       |
| 知识库 | `kb-{number}`  | `kb-1`        |

> **重要**: 所有 ID 均为字符串类型，前端路由直接使用完整 ID，例如 `/{folderId}/{docId}` → `/kb-1/doc-1`

---

## 概览

| 接口                     | 方法   | 认证 | 说明           |
| :----------------------- | :----- | :--: | :------------- |
| `/documents`             | GET    |  ✅  | 获取文档列表   |
| `/documents`             | POST   |  ✅  | 创建文档       |
| `/documents/:id`         | GET    |  ✅  | 获取文档详情   |
| `/documents/:id`         | PUT    |  ✅  | 更新文档       |
| `/documents/:id`         | DELETE |  ✅  | 删除文档       |
| `/documents/search`      | GET    |  ✅  | 搜索文档       |
| `/documents/recent`      | GET    |  ✅  | 获取最近文档   |
| `/documents/favorites`   | GET    |  ✅  | 获取收藏文档   |
| `/documents/trash`       | GET    |  ✅  | 获取回收站文档 |
| `/documents/:id/restore` | POST   |  ✅  | 恢复文档       |

---

## 数据模型

### Document

```typescript
interface Document {
  id: string;           // 格式: "doc-{number}"
  user_id: number;
  folder_id: string;    // 格式: "kb-{number}"
  folder_name?: string; // 所属知识库名称
  title: string;
  content?: string;     // Markdown 内容
  is_favorited: boolean;
  is_deleted: boolean;
  deleted_at?: string;  // ISO 8601 格式
  sort_order: number;
  created_at: string;   // ISO 8601 格式
  updated_at: string;   // ISO 8601 格式
}
```

---

## GET /api/v1/documents

获取当前用户的文档列表。

### 请求参数 (Query)

| 参数         | 类型    | 必填 | 说明                                          |
| :----------- | :------ | :--: | :-------------------------------------------- |
| folder_id    | string  |  ❌  | 知识库 ID (kb-{n})，不传则获取所有文档        |
| is_favorited | boolean |  ❌  | 是否只获取收藏文档                            |
| is_deleted   | boolean |  ❌  | 是否获取回收站文档，默认 false                |
| search       | string  |  ❌  | 搜索关键词                                    |
| page         | number  |  ❌  | 页码，默认 1                                  |
| page_size    | number  |  ❌  | 每页数量，默认 20，最大 100                   |
| sort_by      | string  |  ❌  | 排序字段：`updated_at`/`created_at`/`title`   |
| sort_order   | string  |  ❌  | 排序方向：`asc`/`desc`，默认 `desc`           |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "doc-1",
        "user_id": 1,
        "folder_id": "kb-1",
        "folder_name": "前端知识库",
        "title": "JavaScript 基础",
        "is_favorited": false,
        "is_deleted": false,
        "sort_order": 0,
        "created_at": "2026-01-18T00:00:00Z",
        "updated_at": "2026-01-18T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5
  }
}
```

---

## POST /api/v1/documents

创建新文档。

### 请求

```json
{
  "title": "新文档",
  "content": "# 标题\n\n内容...",
  "folder_id": "kb-1"
}
```

### 参数说明

| 参数      | 类型   | 必填 | 说明                         |
| :-------- | :----- | :--: | :--------------------------- |
| title     | string |  ✅  | 文档标题，1-200 字符         |
| content   | string |  ❌  | Markdown 内容                |
| folder_id | string |  ✅  | 所属知识库 ID (kb-{n})       |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "doc-10",
    "user_id": 1,
    "folder_id": "kb-1",
    "title": "新文档",
    "content": "# 标题\n\n内容...",
    "is_favorited": false,
    "is_deleted": false,
    "sort_order": 0,
    "created_at": "2026-01-18T00:00:00Z",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

---

## GET /api/v1/documents/:id

获取单个文档详情（含完整内容）。

> `:id` 格式为 `doc-{number}`，例如 `doc-1`

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "doc-1",
    "user_id": 1,
    "folder_id": "kb-1",
    "folder_name": "前端知识库",
    "title": "JavaScript 基础",
    "content": "# JavaScript 基础\n\n## 变量声明\n\n...",
    "is_favorited": true,
    "is_deleted": false,
    "sort_order": 0,
    "created_at": "2026-01-18T00:00:00Z",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

**文档不存在 (404)**

```json
{
  "code": 3001,
  "message": "文档不存在"
}
```

---

## GET /api/v1/documents/search

全局搜索文档，在标题和内容中进行模糊匹配。

### 请求参数 (Query)

| 参数  | 类型   | 必填 | 说明                               |
| :---- | :----- | :--: | :--------------------------------- |
| q     | string |  ✅  | 搜索关键词，1-100 字符             |
| limit | number |  ❌  | 返回数量，默认 20，最大 100        |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "doc-1",
      "user_id": 1,
      "folder_id": "kb-1",
      "folder_name": "前端知识库",
      "title": "JavaScript 基础",
      "is_favorited": false,
      "is_deleted": false,
      "sort_order": 0,
      "created_at": "2026-01-18T00:00:00Z",
      "updated_at": "2026-01-18T00:00:00Z"
    }
  ]
}
```

**关键词为空 (400)**

```json
{
  "code": 1001,
  "message": "搜索关键词不能为空"
}
```

**关键词过长 (400)**

```json
{
  "code": 1001,
  "message": "搜索关键词过长"
}
```

---

## PUT /api/v1/documents/:id

更新文档。

### 请求

```json
{
  "title": "更新后的标题",
  "content": "更新后的内容...",
  "folder_id": "kb-2",
  "is_favorited": true
}
```

### 参数说明

| 参数         | 类型    | 必填 | 说明               |
| :----------- | :------ | :--: | :----------------- |
| title        | string  |  ❌  | 文档标题           |
| content      | string  |  ❌  | Markdown 内容      |
| folder_id    | string  |  ❌  | 所属知识库 (kb-{n}) |
| is_favorited | boolean |  ❌  | 收藏状态           |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "doc-1",
    "title": "更新后的标题",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

---

## DELETE /api/v1/documents/:id

删除文档（软删除，移入回收站）。

### 请求参数 (Query)

| 参数      | 类型    | 必填 | 说明                         |
| :-------- | :------ | :--: | :--------------------------- |
| permanent | boolean |  ❌  | 是否永久删除，默认 false     |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "文档已移入回收站"
  }
}
```

---

## GET /api/v1/documents/recent

获取当前用户最近编辑/浏览的文档。

### 请求参数 (Query)

| 参数  | 类型   | 必填 | 说明             |
| :---- | :----- | :--: | :--------------- |
| limit | number |  ❌  | 数量，默认 20    |
| type  | string |  ❌  | `edited`/`viewed` |

### 响应

同 GET /api/v1/documents 的 items 格式。

---

## GET /api/v1/documents/favorites

获取收藏的文档列表。

### 响应

同 GET /api/v1/documents 格式。

---

## GET /api/v1/documents/trash

获取回收站中的文档。

### 响应

同 GET /api/v1/documents 格式，文档包含 `deleted_at` 字段。

---

## POST /api/v1/documents/:id/restore

从回收站恢复文档。

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "文档已恢复"
  }
}
```

---

_最后更新: 2026-01-19_
