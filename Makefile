# ============================================================================
# Orange Mark Mind - Makefile
# 常用命令集合
# ============================================================================

.PHONY: help docker-up docker-down docker-logs migrate-up migrate-down migrate-create dev

# 默认目标
help:
	@echo "Orange Mark Mind - 可用命令:"
	@echo ""
	@echo "Docker 命令:"
	@echo "  make docker-up       - 启动 PostgreSQL 和 Redis"
	@echo "  make docker-down     - 停止并删除容器"
	@echo "  make docker-logs     - 查看容器日志"
	@echo "  make docker-ps       - 查看容器状态"
	@echo ""
	@echo "数据库迁移:"
	@echo "  make migrate-up      - 执行所有迁移"
	@echo "  make migrate-down    - 回滚最后一次迁移"
	@echo "  make migrate-down-all- 回滚所有迁移"
	@echo "  make migrate-version - 查看当前迁移版本"
	@echo "  make migrate-create NAME=xxx - 创建新迁移"
	@echo ""
	@echo "开发命令:"
	@echo "  make dev-backend     - 启动后端开发服务器"
	@echo "  make dev-frontend    - 启动前端开发服务器"
	@echo ""

# --------------------------------------------------------------------------
# Docker 命令
# --------------------------------------------------------------------------

# 启动所有服务（包括后端）
docker-up:
	docker compose up -d
	@echo "等待服务启动..."
	@sleep 5
	@docker compose ps

# 仅启动数据库服务
docker-up-db:
	docker compose up -d postgres redis
	@echo "等待数据库服务启动..."
	@sleep 3
	@docker compose ps

# 构建后端镜像
docker-build:
	docker compose build backend
	@echo "后端镜像构建完成"

# 重新构建并启动后端
docker-rebuild:
	docker compose up -d --build backend
	@echo "后端服务已重新构建并启动"

# 停止服务
docker-down:
	docker compose down

# 停止服务并删除数据卷（危险！会删除所有数据）
docker-clean:
	docker compose down -v
	@echo "已删除所有容器和数据卷"

# 查看日志
docker-logs:
	docker compose logs -f

# 查看后端日志
docker-logs-backend:
	docker compose logs -f backend

# 查看容器状态
docker-ps:
	docker compose ps

# --------------------------------------------------------------------------
# 数据库迁移命令
# 需要先安装 migrate CLI: https://github.com/golang-migrate/migrate
# --------------------------------------------------------------------------

# 从 .env 读取数据库 URL
include .env
export

# 迁移命令
MIGRATE_CMD = migrate -path backend/migrations -database "$(DATABASE_URL_LOCAL)"

# 执行所有迁移
migrate-up:
	$(MIGRATE_CMD) up
	@echo "迁移完成"

# 回滚最后一次迁移
migrate-down:
	$(MIGRATE_CMD) down 1
	@echo "已回滚 1 个迁移"

# 回滚所有迁移
migrate-down-all:
	$(MIGRATE_CMD) down -all
	@echo "已回滚所有迁移"

# 查看当前版本
migrate-version:
	$(MIGRATE_CMD) version

# 强制设置版本（用于修复脏状态）
migrate-force:
	@read -p "输入版本号: " version; \
	$(MIGRATE_CMD) force $$version

# 创建新迁移
migrate-create:
ifndef NAME
	$(error 请指定迁移名称: make migrate-create NAME=xxx)
endif
	migrate create -ext sql -dir backend/migrations -seq $(NAME)
	@echo "已创建迁移: $(NAME)"

# --------------------------------------------------------------------------
# 开发命令
# --------------------------------------------------------------------------

# 启动后端开发服务器
dev-backend:
	cd backend && go run cmd/server/main.go

# 启动前端开发服务器
dev-frontend:
	cd frontend && pnpm dev

# 同时启动前后端（需要安装 concurrently 或使用多终端）
dev:
	@echo "请在两个终端分别运行:"
	@echo "  终端1: make dev-backend"
	@echo "  终端2: make dev-frontend"
