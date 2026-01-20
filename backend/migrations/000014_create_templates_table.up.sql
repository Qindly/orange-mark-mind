-- ============================================================================
-- Migration: 000014_create_templates_table
-- Description: 创建模板表，支持系统模板和用户自定义模板
-- Author: Orange Mark Mind Team
-- Created: 2026-01-20
-- ============================================================================

-- 模板表
-- 存储系统预设模板和用户自定义模板
CREATE TABLE templates (
    -- 主键
    id BIGSERIAL PRIMARY KEY,
    
    -- 关联关系
    user_id BIGINT,    -- 所属用户 ID (逻辑外键 -> users.id)，NULL 表示系统模板
    
    -- 模板内容
    name VARCHAR(100) NOT NULL,           -- 模板名称
    description VARCHAR(500),              -- 模板描述
    icon VARCHAR(50) DEFAULT 'document',   -- 图标标识
    content TEXT,                          -- Markdown 内容
    
    -- 属性
    is_system BOOLEAN NOT NULL DEFAULT FALSE, -- 是否系统模板
    sort_order INT DEFAULT 0,                  -- 排序顺序
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引：按用户查询
CREATE INDEX idx_templates_user_id ON templates(user_id);

-- 索引：系统模板查询
CREATE INDEX idx_templates_system ON templates(is_system) WHERE is_system = TRUE;

-- 索引：排序查询
CREATE INDEX idx_templates_sort ON templates(sort_order, created_at);

-- 添加表注释
COMMENT ON TABLE templates IS '模板表 - 存储系统模板和用户自定义模板';
COMMENT ON COLUMN templates.id IS '主键 ID';
COMMENT ON COLUMN templates.user_id IS '所属用户 ID，NULL 表示系统模板';
COMMENT ON COLUMN templates.name IS '模板名称';
COMMENT ON COLUMN templates.description IS '模板描述';
COMMENT ON COLUMN templates.icon IS '图标标识';
COMMENT ON COLUMN templates.content IS 'Markdown 格式的模板内容';
COMMENT ON COLUMN templates.is_system IS '是否系统模板';
COMMENT ON COLUMN templates.sort_order IS '排序顺序，数值越小越靠前';
COMMENT ON COLUMN templates.created_at IS '创建时间';
COMMENT ON COLUMN templates.updated_at IS '更新时间';
