# 🍊 Orange Mark Mind

> 一个现代化的 Markdown 文档管理系统，支持 AI 对话辅助

## 🛠️ 技术栈

### 前端

- **React** + TypeScript
- **Ant Design** UI 组件库
- **Vite** 构建工具

### 后端

- **Go** + Gin 框架
- **GORM** ORM
- **PostgreSQL** 数据库
- **JWT** 认证

### 部署

- **Docker** + Docker Compose
- **Debian** 服务器

## 📁 项目结构

```
orange-mark-mind/
├── frontend/                 # React 前端应用
├── backend/                  # Go 后端服务
│   ├── cmd/server/           # 应用入口
│   ├── internal/             # 内部包
│   │   ├── handler/          # HTTP 处理器
│   │   ├── service/          # 业务逻辑
│   │   ├── repository/       # 数据访问层
│   │   ├── model/            # 数据模型
│   │   ├── middleware/       # 中间件
│   │   └── config/           # 配置
│   ├── pkg/                  # 公共包
│   └── migrations/           # 数据库迁移
├── doc/                      # 接口文档
│   ├── api/                  # API 文档
│   └── design/               # 设计文档
└── deploy/                   # 部署配置
```

## 🚀 快速开始

### 前端

```bash
cd frontend
pnpm install
pnpm dev
```

### 后端

```bash
cd backend
go mod download
go run cmd/server/main.go
```

## 📖 文档

- [API 文档](./doc/README.md)
- [数据库迁移](./backend/migrations/README.md)

## 📝 License

MIT
