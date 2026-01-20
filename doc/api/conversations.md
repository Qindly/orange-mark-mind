# 对话接口文档

> `/api/v1/conversations` - AI 对话管理

## 概览

| 接口                              | 方法   | 认证 | 说明               |
| :-------------------------------- | :----- | :--: | :----------------- |
| `/conversations`                  | GET    |  ✅  | 获取对话列表       |
| `/conversations`                  | POST   |  ✅  | 创建对话           |
| `/conversations/search`           | GET    |  ✅  | 搜索对话           |
| `/conversations/trash`            | GET    |  ✅  | 回收站             |
| `/conversations/:id`              | GET    |  ✅  | 获取对话详情       |
| `/conversations/:id`              | PUT    |  ✅  | 更新对话标题       |
| `/conversations/:id`              | DELETE |  ✅  | 删除对话（软删除） |
| `/conversations/:id/restore`      | POST   |  ✅  | 恢复对话           |
| `/conversations/:id/messages`     | POST   |  ✅  | 发送消息           |
| `/conversations/:id/messages/:msgId/regenerate` | POST | ✅ | 重新生成 |

---

## GET /api/v1/conversations

获取当前用户的对话列表。

### 请求头

| 参数          | 类型   | 必填 | 说明             |
| :------------ | :----- | :--: | :--------------- |
| Authorization | string |  ✅  | Bearer {token}   |

### 查询参数

| 参数   | 类型 | 必填 | 默认 | 说明               |
| :----- | :--- | :--: | :--- | :----------------- |
| limit  | int  |  ❌  | 50   | 返回数量 (1-100)   |
| offset | int  |  ❌  | 0    | 分页偏移量         |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "Vue3 响应式原理讨论",
      "updated_at": "2026-01-20T10:00:00Z"
    },
    {
      "id": 2,
      "title": "Spring Boot 配置问题",
      "updated_at": "2026-01-19T15:30:00Z"
    }
  ]
}
```

---

## POST /api/v1/conversations

创建新对话。

### 请求头

| 参数          | 类型   | 必填 | 说明             |
| :------------ | :----- | :--: | :--------------- |
| Authorization | string |  ✅  | Bearer {token}   |
| Content-Type  | string |  ✅  | application/json |

### 请求体

| 字段  | 类型   | 必填 | 说明                       |
| :---- | :----- | :--: | :------------------------- |
| title | string |  ❌  | 对话标题（可为空，后续自动生成） |

```json
{
  "title": "可选标题"
}
```

> **注意**: 请求体可以为空 `{}`，创建无标题对话

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "title": "",
    "messages": [],
    "created_at": "2026-01-20T10:00:00Z",
    "updated_at": "2026-01-20T10:00:00Z"
  }
}
```

---

## GET /api/v1/conversations/:id

获取对话详情（含所有消息）。

### 路径参数

| 参数 | 类型  | 必填 | 说明    |
| :--- | :---- | :--: | :------ |
| id   | int64 |  ✅  | 对话 ID |

### 请求头

| 参数          | 类型   | 必填 | 说明             |
| :------------ | :----- | :--: | :--------------- |
| Authorization | string |  ✅  | Bearer {token}   |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "title": "Vue3 响应式原理讨论",
    "messages": [
      {
        "id": 1,
        "conversation_id": 1,
        "role": "user",
        "content": "请解释 Vue3 的响应式原理",
        "created_at": "2026-01-20T10:00:00Z"
      },
      {
        "id": 2,
        "conversation_id": 1,
        "role": "assistant",
        "content": "Vue3 的响应式系统基于 Proxy...",
        "model": "gpt-4",
        "created_at": "2026-01-20T10:00:05Z"
      }
    ],
    "created_at": "2026-01-20T10:00:00Z",
    "updated_at": "2026-01-20T10:00:05Z"
  }
}
```

**对话不存在 (404)**

```json
{
  "code": 4004,
  "message": "对话不存在"
}
```

---

## PUT /api/v1/conversations/:id

更新对话标题。

### 路径参数

| 参数 | 类型  | 必填 | 说明    |
| :--- | :---- | :--: | :------ |
| id   | int64 |  ✅  | 对话 ID |

### 请求头

| 参数          | 类型   | 必填 | 说明             |
| :------------ | :----- | :--: | :--------------- |
| Authorization | string |  ✅  | Bearer {token}   |
| Content-Type  | string |  ✅  | application/json |

### 请求体

| 字段  | 类型   | 必填 | 说明     |
| :---- | :----- | :--: | :------- |
| title | string |  ✅  | 新标题   |

```json
{
  "title": "新标题"
}
```

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "标题已更新"
  }
}
```

---

## DELETE /api/v1/conversations/:id

软删除对话（移入回收站）。

### 路径参数

| 参数 | 类型  | 必填 | 说明    |
| :--- | :---- | :--: | :------ |
| id   | int64 |  ✅  | 对话 ID |

### 请求头

| 参数          | 类型   | 必填 | 说明             |
| :------------ | :----- | :--: | :--------------- |
| Authorization | string |  ✅  | Bearer {token}   |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "对话已移入回收站"
  }
}
```

---

## POST /api/v1/conversations/:id/restore

从回收站恢复对话。

### 路径参数

| 参数 | 类型  | 必填 | 说明    |
| :--- | :---- | :--: | :------ |
| id   | int64 |  ✅  | 对话 ID |

### 请求头

| 参数          | 类型   | 必填 | 说明             |
| :------------ | :----- | :--: | :--------------- |
| Authorization | string |  ✅  | Bearer {token}   |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "对话已恢复"
  }
}
```

---

## GET /api/v1/conversations/search

搜索对话（全文搜索，搜索标题和消息内容）。

### 请求头

| 参数          | 类型   | 必填 | 说明             |
| :------------ | :----- | :--: | :--------------- |
| Authorization | string |  ✅  | Bearer {token}   |

### 查询参数

| 参数  | 类型   | 必填 | 默认 | 说明           |
| :---- | :----- | :--: | :--- | :------------- |
| q     | string |  ✅  | -    | 搜索关键词     |
| limit | int    |  ❌  | 20   | 返回数量限制   |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "Vue3 响应式原理讨论",
      "updated_at": "2026-01-20T10:00:00Z"
    }
  ]
}
```

**关键词为空 (400)**

```json
{
  "code": 4001,
  "message": "搜索关键词不能为空"
}
```

---

## GET /api/v1/conversations/trash

获取回收站中的对话列表。

### 请求头

| 参数          | 类型   | 必填 | 说明             |
| :------------ | :----- | :--: | :--------------- |
| Authorization | string |  ✅  | Bearer {token}   |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 3,
      "title": "已删除的对话",
      "updated_at": "2026-01-18T10:00:00Z"
    }
  ]
}
```

---

## POST /api/v1/conversations/:id/messages

发送消息并获取 AI 回复。

### 路径参数

| 参数 | 类型  | 必填 | 说明    |
| :--- | :---- | :--: | :------ |
| id   | int64 |  ✅  | 对话 ID |

### 请求头

| 参数          | 类型   | 必填 | 说明             |
| :------------ | :----- | :--: | :--------------- |
| Authorization | string |  ✅  | Bearer {token}   |
| Content-Type  | string |  ✅  | application/json |

### 请求体

| 字段       | 类型     | 必填 | 说明                       |
| :--------- | :------- | :--: | :------------------------- |
| content    | string   |  ✅  | 用户消息内容               |
| model      | string   |  ✅  | AI 模型名称（如 gpt-4）    |
| doc_ids    | []int64  |  ❌  | RAG: 引用的文档 ID 列表    |
| folder_ids | []int64  |  ❌  | RAG: 引用的知识库 ID 列表  |

```json
{
  "content": "请帮我解释这段代码的作用",
  "model": "gpt-4",
  "doc_ids": [1, 2],
  "folder_ids": [3]
}
```

### 响应

**成功 (200)** - 当前返回用户消息（流式响应待实现）

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 5,
    "conversation_id": 1,
    "role": "user",
    "content": "请帮我解释这段代码的作用",
    "created_at": "2026-01-20T10:05:00Z"
  }
}
```

> **注意**: 流式响应（Server-Sent Events）待实现，届时格式为：
> ```
> data: {"chunk": "Vue3", "done": false}
> data: {"chunk": " 的响应式", "done": false}
> data: {"chunk": "...", "done": true, "message_id": 2}
> ```

---

## POST /api/v1/conversations/:id/messages/:msgId/regenerate

重新生成最后一条 AI 回复。

### 路径参数

| 参数  | 类型  | 必填 | 说明    |
| :---- | :---- | :--: | :------ |
| id    | int64 |  ✅  | 对话 ID |
| msgId | int64 |  ✅  | 消息 ID |

### 请求头

| 参数          | 类型   | 必填 | 说明             |
| :------------ | :----- | :--: | :--------------- |
| Authorization | string |  ✅  | Bearer {token}   |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "正在重新生成..."
  }
}
```

**没有可重新生成的消息 (400)**

```json
{
  "code": 4001,
  "message": "没有可重新生成的消息"
}
```

---

## 数据结构

### ConversationListItem

| 字段       | 类型   | 说明         |
| :--------- | :----- | :----------- |
| id         | int64  | 对话 ID      |
| title      | string | 对话标题     |
| updated_at | string | 最后更新时间 |

### ConversationDetail

| 字段       | 类型      | 说明         |
| :--------- | :-------- | :----------- |
| id         | int64     | 对话 ID      |
| title      | string    | 对话标题     |
| messages   | []Message | 消息列表     |
| created_at | string    | 创建时间     |
| updated_at | string    | 最后更新时间 |

### Message

| 字段            | 类型   | 说明                              |
| :-------------- | :----- | :-------------------------------- |
| id              | int64  | 消息 ID                           |
| conversation_id | int64  | 所属对话 ID                       |
| role            | string | 角色: `user` / `assistant`        |
| content         | string | 消息内容                          |
| model           | string | AI 模型名称（仅 assistant 有值）  |
| created_at      | string | 发送时间                          |

---

_最后更新: 2026-01-20_
