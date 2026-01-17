# ============================================================================
# Orange Mark Mind Backend - Dockerfile
# 多阶段构建，优化镜像体积
# ============================================================================

# --------------------------------------------------------------------------
# 阶段 1: 构建阶段
# --------------------------------------------------------------------------
FROM golang:1.25-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache git ca-certificates tzdata

# 设置工作目录
WORKDIR /app

# 复制 go.mod 和 go.sum，利用缓存
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建二进制文件
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /app/server ./cmd/server

# --------------------------------------------------------------------------
# 阶段 2: 运行阶段
# --------------------------------------------------------------------------
FROM alpine:3.19

# 安装运行时依赖
RUN apk add --no-cache ca-certificates tzdata

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非 root 用户
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -D appuser

# 设置工作目录
WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/server /app/server

# 复制 migrations（如果需要在容器内执行迁移）
COPY --from=builder /app/migrations /app/migrations

# 设置文件权限
RUN chown -R appuser:appgroup /app

# 切换到非 root 用户
USER appuser

# 暴露端口
EXPOSE 60100

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:60100/health || exit 1

# 启动命令
CMD ["/app/server"]
