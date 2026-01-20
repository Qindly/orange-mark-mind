# 用户设置接口文档

> `/api/v1/settings` - 用户偏好设置管理

## 概览

| 接口              | 方法   | 认证 | 说明             |
| :---------------- | :----- | :--: | :--------------- |
| `/settings`       | GET    |  ✅  | 获取所有设置     |
| `/settings/:key`  | GET    |  ✅  | 获取指定设置     |
| `/settings/:key`  | PUT    |  ✅  | 更新设置         |
| `/settings/:key`  | DELETE |  ✅  | 删除设置         |

---

## 预定义设置键

| 键名                    | 说明                         |
| :---------------------- | :--------------------------- |
| `default_summary_model` | 默认对话标题生成模型         |

---

## GET /api/v1/settings

获取当前用户的所有设置。

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "default_summary_model": "gpt-4"
  }
}
```

---

## GET /api/v1/settings/:key

获取指定设置的值。

### 路径参数

| 参数 | 说明       |
| :--- | :--------- |
| key  | 设置键名   |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "key": "default_summary_model",
    "value": "gpt-4"
  }
}
```

**设置不存在时返回空值**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "key": "default_summary_model",
    "value": ""
  }
}
```

---

## PUT /api/v1/settings/:key

更新或创建指定设置。

### 路径参数

| 参数 | 说明       |
| :--- | :--------- |
| key  | 设置键名   |

### 请求

```json
{
  "value": "gpt-4"
}
```

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "key": "default_summary_model",
    "value": "gpt-4"
  }
}
```

---

## DELETE /api/v1/settings/:key

删除指定设置。

### 路径参数

| 参数 | 说明       |
| :--- | :--------- |
| key  | 设置键名   |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "设置已删除"
  }
}
```

---

_最后更新: 2026-01-20_
