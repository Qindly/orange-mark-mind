-- ============================================================================
-- Migration: 000002_create_folders_table
-- Description: 创建文件夹表，支持树形结构的文档组织
-- Author: Orange Mark Mind Team
-- Created: 2026-01-18
-- ============================================================================

-- 文件夹表
-- 存储用户的文件夹信息，支持多级嵌套的树形结构
CREATE TABLE folders (
    -- 主键
    id BIGSERIAL PRIMARY KEY,
    
    -- 关联关系（逻辑外键）
    user_id BIGINT NOT NULL,    -- 所属用户 ID (逻辑外键 -> users.id)
    parent_id BIGINT,           -- 父文件夹 ID (逻辑外键 -> folders.id)，NULL 表示根目录
    
    -- 文件夹信息
    name VARCHAR(100) NOT NULL, -- 文件夹名称
    sort_order INT DEFAULT 0,   -- 排序顺序，数值越小越靠前
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 创建时间
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- 更新时间
);

-- 索引：按用户查询
CREATE INDEX idx_folders_user_id ON folders(user_id);

-- 索引：按父文件夹查询（用于构建树形结构）
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

-- 索引：用户下的文件夹排序
CREATE INDEX idx_folders_user_sort ON folders(user_id, parent_id, sort_order);

-- 添加表注释
COMMENT ON TABLE folders IS '文件夹表 - 存储用户的文件夹信息，支持树形结构';
COMMENT ON COLUMN folders.id IS '主键 ID';
COMMENT ON COLUMN folders.user_id IS '所属用户 ID (逻辑外键 -> users.id)';
COMMENT ON COLUMN folders.parent_id IS '父文件夹 ID (逻辑外键 -> folders.id)，NULL 表示位于根目录';
COMMENT ON COLUMN folders.name IS '文件夹名称';
COMMENT ON COLUMN folders.sort_order IS '排序顺序，数值越小越靠前';
COMMENT ON COLUMN folders.created_at IS '创建时间';
COMMENT ON COLUMN folders.updated_at IS '更新时间';
