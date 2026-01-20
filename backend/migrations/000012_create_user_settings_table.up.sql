-- ============================================================================
-- Migration: 000012_create_user_settings_table
-- Description: 创建用户设置表，存储用户的各种偏好设置
-- Author: Orange Mark Mind Team
-- Created: 2026-01-20
-- ============================================================================

-- 用户设置表
-- 存储用户的各种偏好设置，采用 key-value 结构便于扩展
CREATE TABLE user_settings (
    -- 主键
    id BIGSERIAL PRIMARY KEY,
    
    -- 关联用户
    user_id BIGINT NOT NULL, -- 用户 ID (逻辑外键 -> users.id)
    
    -- 设置项
    setting_key VARCHAR(50) NOT NULL,   -- 设置键名
    setting_value TEXT,                  -- 设置值（JSON 格式或简单字符串）
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 唯一索引：同一用户下设置键名唯一
CREATE UNIQUE INDEX idx_user_settings_user_key ON user_settings(user_id, setting_key);

-- 索引：按用户查询所有设置
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- 添加表注释
COMMENT ON TABLE user_settings IS '用户设置表 - 存储用户的各种偏好设置';
COMMENT ON COLUMN user_settings.id IS '主键 ID';
COMMENT ON COLUMN user_settings.user_id IS '用户 ID (逻辑外键 -> users.id)';
COMMENT ON COLUMN user_settings.setting_key IS '设置键名，如 default_summary_model';
COMMENT ON COLUMN user_settings.setting_value IS '设置值，可以是 JSON 格式或简单字符串';
COMMENT ON COLUMN user_settings.created_at IS '创建时间';
COMMENT ON COLUMN user_settings.updated_at IS '更新时间';
