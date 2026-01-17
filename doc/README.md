# Orange Mark Mind API 文档

> 本目录用于存放项目的 API 接口文档，方便前后端协作开发。

## 文档结构

```
doc/
├── api/                    # API 接口文档
│   ├── auth.md             # 认证相关接口
│   ├── users.md            # 用户管理接口
│   ├── documents.md        # 文档管理接口
│   └── ai.md               # AI 对话接口
├── design/                 # 设计文档
│   └── database.md         # 数据库设计
└── README.md               # 本文件
```

## API 规范

### 基础 URL

- 开发环境: `http://localhost:60100/api/v1`
- 生产环境: `https://your-domain.com/api/v1`

### 响应格式

所有 API 响应统一使用以下 JSON 格式：

```json
{
  "code": 0, // 业务状态码，0 表示成功
  "message": "success", // 状态描述
  "data": {} // 响应数据
}
```

### 错误码定义

| 错误码 | 描述             |
| :----: | :--------------- |
|   0    | 成功             |
|  1001  | 参数错误         |
|  1002  | 未授权           |
|  1003  | 禁止访问         |
|  1004  | 资源不存在       |
|  2001  | 用户已存在       |
|  2002  | 用户名或密码错误 |
|  3001  | 文档不存在       |
|  5000  | 服务器内部错误   |

### 认证方式

使用 JWT Bearer Token 进行认证：

```
Authorization: Bearer <access_token>
```

## 版本

当前 API 版本：**v1**
