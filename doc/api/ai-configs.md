# AI 配置接口文档

> `/api/v1/ai-configs` - AI 提供商配置管理相关接口

## 概览

| 接口                     | 方法   | 认证 | 说明               |
| :----------------------- | :----- | :--: | :----------------- |
| `/ai-configs`            | GET    |  ✅  | 获取配置列表       |
| `/ai-configs`            | POST   |  ✅  | 创建配置           |
| `/ai-configs/:id`        | PUT    |  ✅  | 更新配置           |
| `/ai-configs/:id`        | DELETE |  ✅  | 删除配置           |
| `/ai-configs/:id/default`| PUT    |  ✅  | 设为默认配置       |
| `/ai-configs/models`     | POST   |  ✅  | 获取上游模型列表   |

---

## 数据模型

### AIConfig

```typescript
interface AIConfig {
  id: number;                    // 主键 ID
  config_name: string;           // 配置名称
  provider_type: 'openai_compatible' | 'anthropic' | 'gemini';
  base_url: string;              // API Base URL
  api_key_masked: string;        // 脱敏后的 API Key (如 sk-****abc)
  available_models: string[];    // 可用模型列表
  is_default: boolean;           // 是否为默认配置
  created_at: string;            // ISO 8601 格式
  updated_at: string;            // ISO 8601 格式
}
```

### Provider Type

| 值                  | 说明                    | Models 端点       | Chat 端点                              |
| :------------------ | :---------------------- | :---------------- | :------------------------------------- |
| `openai_compatible` | OpenAI 兼容接口         | `/models`         | `/chat/completions`                    |
| `anthropic`         | Anthropic Claude        | 不支持            | `/v1/messages`                         |
| `gemini`            | Google Gemini           | `/v1beta/models`  | `/v1beta/models/{model}:generateContent` |

---

## GET /api/v1/ai-configs

获取当前用户的所有 AI 配置。

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "config_name": "OpenAI",
      "provider_type": "openai_compatible",
      "base_url": "https://api.openai.com",
      "api_key_masked": "sk-****wxyz",
      "available_models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
      "is_default": true,
      "created_at": "2026-01-18T00:00:00Z",
      "updated_at": "2026-01-18T00:00:00Z"
    }
  ]
}
```

---

## POST /api/v1/ai-configs

创建新的 AI 配置。

### 请求

```json
{
  "config_name": "OpenAI",
  "provider_type": "openai_compatible",
  "base_url": "https://api.openai.com",
  "api_key": "sk-xxxxxxxxxxxxxxxx",
  "available_models": ["gpt-4", "gpt-3.5-turbo"]
}
```

### 参数说明

| 参数             | 类型     | 必填 | 说明                                          |
| :--------------- | :------- | :--: | :-------------------------------------------- |
| config_name      | string   |  ✅  | 配置名称，1-50 字符，同一用户下唯一           |
| provider_type    | string   |  ✅  | 提供商类型                                    |
| base_url         | string   |  ✅  | API Base URL                                  |
| api_key          | string   |  ✅  | API Key，将使用 AES-256-GCM 加密存储          |
| available_models | string[] |  ✅  | 可用模型列表，至少包含一个模型                |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "config_name": "OpenAI",
    "provider_type": "openai_compatible",
    "base_url": "https://api.openai.com",
    "api_key_masked": "sk-****wxyz",
    "available_models": ["gpt-4", "gpt-3.5-turbo"],
    "is_default": false,
    "created_at": "2026-01-18T00:00:00Z",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

**配置名称已存在 (400)**

```json
{
  "code": 4001,
  "message": "配置名称已存在"
}
```

---

## PUT /api/v1/ai-configs/:id

更新指定的 AI 配置。

### 请求

```json
{
  "config_name": "OpenAI Pro",
  "base_url": "https://api.openai.com",
  "api_key": "sk-new-key",
  "available_models": ["gpt-4", "gpt-4-turbo"]
}
```

### 参数说明

| 参数             | 类型     | 必填 | 说明                               |
| :--------------- | :------- | :--: | :--------------------------------- |
| config_name      | string   |  ❌  | 配置名称                           |
| provider_type    | string   |  ❌  | 提供商类型                         |
| base_url         | string   |  ❌  | API Base URL                       |
| api_key          | string   |  ❌  | API Key，不传则保持原值            |
| available_models | string[] |  ❌  | 可用模型列表                       |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "config_name": "OpenAI Pro",
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

**配置不存在 (404)**

```json
{
  "code": 4002,
  "message": "配置不存在"
}
```

---

## DELETE /api/v1/ai-configs/:id

删除指定的 AI 配置。

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "配置已删除"
  }
}
```

**配置不存在 (404)**

```json
{
  "code": 4002,
  "message": "配置不存在"
}
```

**默认配置不可删除 (400)**

```json
{
  "code": 4003,
  "message": "默认配置不可删除，请先设置其他配置为默认"
}
```

---

## PUT /api/v1/ai-configs/:id/default

将指定配置设为默认配置。

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "is_default": true,
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

---

## POST /api/v1/ai-configs/models

从上游 API 获取可用的模型列表。

> **注意**: Anthropic 不支持 `/models` 端点，请手动配置模型列表。

### 请求

```json
{
  "base_url": "https://api.openai.com",
  "api_key": "sk-xxxxxxxxxxxxxxxx",
  "provider_type": "openai_compatible"
}
```

### 参数说明

| 参数          | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--: | :------------------------ |
| base_url      | string |  ✅  | API Base URL              |
| api_key       | string |  ✅  | API Key                   |
| provider_type | string |  ✅  | 提供商类型                |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    { "id": "gpt-4", "name": "GPT-4", "created": 1687882410 },
    { "id": "gpt-4-turbo", "name": "GPT-4 Turbo", "created": 1699345200 },
    { "id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "created": 1677610602 }
  ]
}
```

**提供商不支持 (400)**

```json
{
  "code": 4004,
  "message": "该提供商不支持自动获取模型列表"
}
```

**上游请求失败 (502)**

```json
{
  "code": 5001,
  "message": "获取模型列表失败：连接超时"
}
```

---

_最后更新: 2026-01-20_
