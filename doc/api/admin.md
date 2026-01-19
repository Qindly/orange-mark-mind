# 管理员 API

管理员专用接口，需要 `admin` 权限。

> **权限要求**: 所有接口都需要管理员权限（`role: admin`）

---

## GET /api/v1/admin/users

获取用户列表，支持分页和搜索。

### 请求参数 (Query)

| 参数      | 类型   | 必填 | 说明                                     |
| :-------- | :----- | :--: | :--------------------------------------- |
| page      | number |  ❌  | 页码，默认 1                             |
| page_size | number |  ❌  | 每页数量，默认 10，最大 100              |
| search    | string |  ❌  | 搜索关键词（匹配用户名、昵称、邮箱）     |
| role      | string |  ❌  | 按角色筛选：`admin` 或 `user`            |
| status    | string |  ❌  | 按状态筛选：`active`/`inactive`/`banned` |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "nickname": "管理员",
        "avatar": "",
        "role": "admin",
        "status": "active",
        "created_at": "2026-01-18T00:00:00Z",
        "updated_at": "2026-01-18T00:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "page_size": 10
  }
}
```

**无权限 (403)**

```json
{
  "code": 4001,
  "message": "需要管理员权限"
}
```

---

## GET /api/v1/admin/users/:id

获取单个用户详情。

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "nickname": "管理员",
    "avatar": "",
    "role": "admin",
    "status": "active",
    "created_at": "2026-01-18T00:00:00Z",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

**用户不存在 (404)**

```json
{
  "code": 4002,
  "message": "用户不存在"
}
```

---

## PUT /api/v1/admin/users/:id

更新用户信息。

### 请求

```json
{
  "nickname": "新昵称",
  "role": "admin",
  "status": "active"
}
```

### 参数说明

| 参数     | 类型   | 必填 | 说明                                   |
| :------- | :----- | :--: | :------------------------------------- |
| nickname | string |  ❌  | 昵称                                   |
| role     | string |  ❌  | 角色：`admin` 或 `user`                |
| status   | string |  ❌  | 状态：`active`/`inactive`/`banned`     |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "nickname": "新昵称",
    "avatar": "",
    "role": "admin",
    "status": "active",
    "created_at": "2026-01-18T00:00:00Z",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

**不能修改自己的角色 (400)**

```json
{
  "code": 4003,
  "message": "不能修改自己的角色"
}
```

---

## DELETE /api/v1/admin/users/:id

删除用户。

> **注意**: 
> - 不能删除自己的账号
> - 删除用户会同时删除该用户的所有数据（知识库、文档等）

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "用户已删除"
  }
}
```

**不能删除自己 (400)**

```json
{
  "code": 4004,
  "message": "不能删除自己的账号"
}
```

**用户不存在 (404)**

```json
{
  "code": 4002,
  "message": "用户不存在"
}
```

---

## 错误码说明

| 错误码 | 说明               |
| :----- | :----------------- |
| 4001   | 需要管理员权限     |
| 4002   | 用户不存在         |
| 4003   | 不能修改自己的角色 |
| 4004   | 不能删除自己的账号 |

---

_最后更新: 2026-01-19_
