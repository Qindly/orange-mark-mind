# Database Migrations

本目录用于存放数据库迁移文件，使用 [golang-migrate](https://github.com/golang-migrate/migrate) 进行版本管理。

## 命名规范

迁移文件采用以下命名格式：

```
{version}_{description}.up.sql    # 升级脚本
{version}_{description}.down.sql  # 回滚脚本
```

例如：

- `000001_create_users_table.up.sql`
- `000001_create_users_table.down.sql`

## 使用方法

### 安装 migrate CLI

```bash
# macOS
brew install golang-migrate

# Windows (使用 scoop)
scoop install migrate

# 或直接下载二进制
# https://github.com/golang-migrate/migrate/releases
```

### 创建新迁移

```bash
migrate create -ext sql -dir migrations -seq {description}
```

### 执行迁移

```bash
# 升级到最新版本
migrate -path migrations -database "postgres://user:pass@localhost:5432/dbname?sslmode=disable" up

# 回滚一个版本
migrate -path migrations -database "postgres://user:pass@localhost:5432/dbname?sslmode=disable" down 1

# 查看当前版本
migrate -path migrations -database "postgres://user:pass@localhost:5432/dbname?sslmode=disable" version
```

## 注意事项

1. 每个迁移文件必须同时包含 `.up.sql` 和 `.down.sql`
2. 迁移应该是幂等的，避免重复执行导致错误
3. 生产环境迁移前请先备份数据库
4. 不要修改已经执行过的迁移文件，如需变更请创建新的迁移
