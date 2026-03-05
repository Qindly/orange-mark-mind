# Orange Mark Mind

一个支持 AI 对话能力的 Markdown 知识管理系统。

## 技术栈

### 前端

- React + TypeScript
- Vite
- Axios

### 后端

- Go + Gin
- GORM
- PostgreSQL
- Redis
- JWT

### 运行环境

- Docker + Docker Compose
- Windows 下推荐使用 Debian (WSL2) 作为本地终端

## 项目结构

```text
orange-mark-mind/
|- frontend/                 # React frontend
|- backend/                  # Go backend
|  |- cmd/server/            # backend entrypoint
|  |- internal/              # business code
|  `- migrations/            # SQL migrations
|- docker-compose.yml
`- Makefile
```

## 环境准备

- Windows + Docker Desktop
- 在 Docker Desktop 中开启 WSL2 Integration
- 使用 Debian (WSL) 终端
- WSL 中已安装 GNU Make（`make --version`）

## 终端选择建议

本项目建议使用 `Debian (WSL)` 终端。

原因：

- `make`、`bash`、`docker compose` 行为与项目脚本一致
- `Makefile` 使用了 bash 语法
- 相比 PowerShell / CMD，WSL 下命令链路更稳定

## 一键启动（推荐）

在 WSL 终端进入项目根目录后执行：

```bash
cd /mnt/d/frontend/orange-mark-mind
make Qindy
```

## `make Qindy` 的执行原理

`make Qindy` 会按以下顺序执行：

1. 启动 `postgres` 和 `redis`
2. 等待 PostgreSQL 就绪
3. 检查 `public.schema_migrations` 是否存在
4. 如果不存在，则执行 `migrate up`
5. 启动 `backend` 和 `frontend`
6. 输出容器状态

这意味着：

- 新数据库首次启动会自动完成迁移
- 已有数据卷时不会重复迁移
- 启动速度和安全性都更好

## 启动后访问地址

启动成功后可以访问：

- 前端页面：`http://localhost:60100`
- 后端健康检查：`http://localhost:60100/health`
- API 基础路径：`http://localhost:60100/api/v1`

## 如何判断启动是否成功

查看容器状态：

```bash
docker compose ps
```

期望状态：

- `omm-postgres` -> `healthy`
- `omm-redis` -> `healthy`
- `omm-backend` -> `healthy`
- `omm-frontend` -> `running` 或 `healthy`（健康检查有时会稍晚更新）

如果 `frontend` 显示 `unhealthy`，先重建前端容器：

```bash
docker compose up -d --build --force-recreate frontend
docker compose ps
```

## 数据持久化说明

PostgreSQL 和 Redis 已启用 Docker 数据卷持久化：

- `postgres_data` -> `/var/lib/postgresql/data`
- `redis_data` -> `/data`

所以执行 `make down` 或再次 `make Qindy` 时，数据库数据会保留。

只有在删除数据卷时才会丢失数据，例如：

```bash
make clean
# 或
docker compose down -v
```

删除数据卷后，下次执行 `make Qindy` 会重新跑迁移。

## 常用 Make 命令

- `make Qindy`：启动四个容器；仅在未初始化时执行迁移
- `make up`：启动四个容器；每次都执行迁移步骤
- `make up-db`：仅启动 PostgreSQL 和 Redis
- `make down`：停止并删除容器
- `make clean`：停止并删除容器及数据卷（会清空数据库）
- `make logs`：查看全部日志
- `make logs-backend`：仅查看后端日志

## 本地开发模式（不使用前端容器）

如果你希望前端热更新、后端本地进程运行，可按下面流程：

```bash
make up-db
make migrate-up
make dev-backend
make dev-frontend
```

然后访问：

- 前端开发服务：`http://localhost:60103`

