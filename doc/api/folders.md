# 文件夹接口文档

> `/api/v1/folders` - 文件夹（知识库）管理相关接口

## 概览

| 接口             | 方法   | 认证 | 说明           |
| :--------------- | :----- | :--: | :------------- |
| `/folders`       | GET    |  ✅  | 获取文件夹列表 |
| `/folders`       | POST   |  ✅  | 创建文件夹     |
| `/folders/:id`   | GET    |  ✅  | 获取文件夹详情 |
| `/folders/:id`   | PUT    |  ✅  | 更新文件夹     |
| `/folders/:id`   | DELETE |  ✅  | 删除文件夹     |

---

## GET /api/v1/folders

获取当前用户的文件夹列表（树形结构）。

### 请求参数 (Query)

| 参数      | 类型    | 必填 | 说明                                |
| :-------- | :------ | :--: | :---------------------------------- |
| parent_id | number  |  ❌  | 父文件夹 ID，不传则获取根目录文件夹 |
| flat      | boolean |  ❌  | 是否返回扁平列表，默认 false        |

### 响应

**成功 (200) - 树形结构**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "parent_id": null,
      "name": "前端知识库",
      "sort_order": 0,
      "document_count": 10,
      "created_at": "2026-01-18T00:00:00Z",
      "updated_at": "2026-01-18T00:00:00Z",
      "children": [
        {
          "id": 3,
          "user_id": 1,
          "parent_id": 1,
          "name": "JavaScript",
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

创建新文件夹。

### 请求

```json
{
  "name": "新知识库",
  "parent_id": null
}
```

### 参数说明

| 参数      | 类型   | 必填 | 说明                                |
| :-------- | :----- | :--: | :---------------------------------- |
| name      | string |  ✅  | 文件夹名称，1-100 字符              |
| parent_id | number |  ❌  | 父文件夹 ID，不传则为根目录文件夹   |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 10,
    "user_id": 1,
    "parent_id": null,
    "name": "新知识库",
    "sort_order": 0,
    "document_count": 0,
    "created_at": "2026-01-18T00:00:00Z",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

---

## GET /api/v1/folders/:id

获取单个文件夹详情。

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": 1,
    "parent_id": null,
    "name": "前端知识库",
    "sort_order": 0,
    "document_count": 10,
    "created_at": "2026-01-18T00:00:00Z",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

**文件夹不存在 (404)**

```json
{
  "code": 3002,
  "message": "文件夹不存在"
}
```

---

## PUT /api/v1/folders/:id

更新文件夹。

### 请求

```json
{
  "name": "更新后的名称",
  "parent_id": 2,
  "sort_order": 1
}
```

### 参数说明

| 参数       | 类型   | 必填 | 说明               |
| :--------- | :----- | :--: | :----------------- |
| name       | string |  ❌  | 文件夹名称         |
| parent_id  | number |  ❌  | 父文件夹 ID        |
| sort_order | number |  ❌  | 排序顺序           |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "更新后的名称",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

---

## DELETE /api/v1/folders/:id

删除文件夹。

> **注意**: 删除文件夹时，其下的文档会移动到「未分类」。

### 请求参数 (Query)

| 参数            | 类型    | 必填 | 说明                               |
| :-------------- | :------ | :--: | :--------------------------------- |
| delete_children | boolean |  ❌  | 是否同时删除子文件夹，默认 false   |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "文件夹已删除",
    "affected_documents": 5
  }
}
```

---

_最后更新: 2026-01-18_
