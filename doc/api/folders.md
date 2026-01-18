# 知识库接口文档

> `/api/v1/folders` - 知识库（文件夹）管理相关接口

## ID 格式规范

| 实体   | ID 格式        | 示例          |
| :----- | :------------- | :------------ |
| 知识库 | `kb-{number}`  | `kb-1`        |

> **特殊 ID**: `kb-0` 为默认知识库，所有未分类文档都属于此知识库

---

## 概览

| 接口             | 方法   | 认证 | 说明           |
| :--------------- | :----- | :--: | :------------- |
| `/folders`       | GET    |  ✅  | 获取知识库列表 |
| `/folders`       | POST   |  ✅  | 创建知识库     |
| `/folders/:id`   | GET    |  ✅  | 获取知识库详情 |
| `/folders/:id`   | PUT    |  ✅  | 更新知识库     |
| `/folders/:id`   | DELETE |  ✅  | 删除知识库     |

---

## 数据模型

### Folder (知识库)

```typescript
interface Folder {
  id: string;             // 格式: "kb-{number}"
  user_id: number;
  parent_id?: string;     // 父知识库 ID，可选
  name: string;           // 知识库名称
  description?: string;   // 知识库简介
  sort_order: number;     // 排序顺序
  children?: Folder[];    // 子知识库列表（树形结构时返回）
  document_count?: number;// 文档数量
  created_at: string;     // ISO 8601 格式
  updated_at: string;     // ISO 8601 格式
}
```

---

## GET /api/v1/folders

获取当前用户的知识库列表（可选树形结构）。

### 请求参数 (Query)

| 参数      | 类型    | 必填 | 说明                                |
| :-------- | :------ | :--: | :---------------------------------- |
| parent_id | string  |  ❌  | 父知识库 ID，不传则获取根目录       |
| flat      | boolean |  ❌  | 是否返回扁平列表，默认 false        |

### 响应

**成功 (200) - 树形结构**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "kb-0",
      "user_id": 1,
      "parent_id": null,
      "name": "默认知识库",
      "description": "未分类的文档都在这里",
      "sort_order": -1,
      "document_count": 1,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z",
      "children": []
    },
    {
      "id": "kb-1",
      "user_id": 1,
      "parent_id": null,
      "name": "前端知识库",
      "description": "前端相关技术文档和学习笔记",
      "sort_order": 0,
      "document_count": 10,
      "created_at": "2026-01-18T00:00:00Z",
      "updated_at": "2026-01-18T00:00:00Z",
      "children": [
        {
          "id": "kb-3",
          "user_id": 1,
          "parent_id": "kb-1",
          "name": "JavaScript",
          "description": null,
          "sort_order": 0,
          "document_count": 5,
          "created_at": "2026-01-18T00:00:00Z",
          "updated_at": "2026-01-18T00:00:00Z",
          "children": []
        }
      ]
    }
  ]
}
```

---

## POST /api/v1/folders

创建新知识库。

### 请求

```json
{
  "name": "新知识库",
  "description": "知识库简介（可选）",
  "parent_id": null
}
```

### 参数说明

| 参数        | 类型   | 必填 | 说明                                |
| :---------- | :----- | :--: | :---------------------------------- |
| name        | string |  ✅  | 知识库名称，1-100 字符              |
| description | string |  ❌  | 知识库简介                          |
| parent_id   | string |  ❌  | 父知识库 ID，不传则为根目录         |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "kb-10",
    "user_id": 1,
    "parent_id": null,
    "name": "新知识库",
    "description": "知识库简介（可选）",
    "sort_order": 0,
    "document_count": 0,
    "created_at": "2026-01-18T00:00:00Z",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

---

## GET /api/v1/folders/:id

获取单个知识库详情。

> `:id` 格式为 `kb-{number}`，例如 `kb-1`

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "kb-1",
    "user_id": 1,
    "parent_id": null,
    "name": "前端知识库",
    "description": "前端相关技术文档和学习笔记",
    "sort_order": 0,
    "document_count": 10,
    "created_at": "2026-01-18T00:00:00Z",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

**知识库不存在 (404)**

```json
{
  "code": 3002,
  "message": "知识库不存在"
}
```

---

## PUT /api/v1/folders/:id

更新知识库。

### 请求

```json
{
  "name": "更新后的名称",
  "description": "更新后的简介",
  "parent_id": "kb-2",
  "sort_order": 1
}
```

### 参数说明

| 参数        | 类型   | 必填 | 说明               |
| :---------- | :----- | :--: | :----------------- |
| name        | string |  ❌  | 知识库名称         |
| description | string |  ❌  | 知识库简介         |
| parent_id   | string |  ❌  | 父知识库 ID        |
| sort_order  | number |  ❌  | 排序顺序           |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "kb-1",
    "name": "更新后的名称",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

---

## DELETE /api/v1/folders/:id

删除知识库。

> **注意**: 
> - 删除知识库时，其下的文档会移动到默认知识库 (`kb-0`)
> - 默认知识库 (`kb-0`) 不可删除

### 请求参数 (Query)

| 参数            | 类型    | 必填 | 说明                               |
| :-------------- | :------ | :--: | :--------------------------------- |
| delete_children | boolean |  ❌  | 是否同时删除子知识库，默认 false   |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "知识库已删除",
    "affected_documents": 5
  }
}
```

**不能删除默认知识库 (400)**

```json
{
  "code": 3003,
  "message": "默认知识库不可删除"
}
```

---

_最后更新: 2026-01-18_
