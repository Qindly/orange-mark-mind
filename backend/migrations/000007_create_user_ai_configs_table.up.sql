-- ============================================================================
-- Migration: 000007_create_user_ai_configs_table
-- Description: 创建用户 AI 配置表，存储用户的 API 配置信息
-- Author: Orange Mark Mind Team
-- Created: 2026-01-18
-- ============================================================================

-- 用户 AI 配置表
-- 存储用户配置的 AI API 信息，支持多个 API 提供商（如 OpenAI、Claude、Gemini）
-- API Key 使用 AES-256-GCM 加密存储
CREATE TABLE user_ai_configs (
    -- 主键
    id BIGSERIAL PRIMARY KEY,
    
    -- 关联关系（逻辑外键）
    user_id BIGINT NOT NULL, -- 所属用户 ID (逻辑外键 -> users.id)
    
    -- 配置信息
    config_name VARCHAR(50) NOT NULL,     -- 配置名称，如 "OpenAI", "Claude", "Gemini"
    base_url VARCHAR(255) NOT NULL,       -- API Base URL
    api_key_encrypted VARCHAR(500) NOT NULL, -- AES-256-GCM 加密后的 API Key
    
    -- 可用模型列表
    -- JSON 数组格式，如: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]
    available_models TEXT, -- JSON 数组，存储该配置下可用的模型列表
    
    -- 默认标记
    is_default BOOLEAN NOT NULL DEFAULT FALSE, -- 是否为用户的默认配置
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 创建时间
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- 更新时间
);

-- 唯一索引：同一用户下配置名称唯一
CREATE UNIQUE INDEX idx_user_ai_configs_user_name ON user_ai_configs(user_id, config_name);

-- 索引：按用户查询配置列表
CREATE INDEX idx_user_ai_configs_user_id ON user_ai_configs(user_id);

-- 索引：查找用户的默认配置
CREATE INDEX idx_user_ai_configs_default ON user_ai_configs(user_id, is_default) WHERE is_default = TRUE;

-- 添加表注释
COMMENT ON TABLE user_ai_configs IS '用户 AI 配置表 - 存储用户的 API 配置信息，支持多个提供商';
COMMENT ON COLUMN user_ai_configs.id IS '主键 ID';
COMMENT ON COLUMN user_ai_configs.user_id IS '所属用户 ID (逻辑外键 -> users.id)';
COMMENT ON COLUMN user_ai_configs.config_name IS '配置名称，同一用户下唯一，如 "OpenAI", "Claude"';
COMMENT ON COLUMN user_ai_configs.base_url IS 'API 的 Base URL';
COMMENT ON COLUMN user_ai_configs.api_key_encrypted IS 'API Key，使用 AES-256-GCM 加密存储';
COMMENT ON COLUMN user_ai_configs.available_models IS '可用模型列表，JSON 数组格式';
COMMENT ON COLUMN user_ai_configs.is_default IS '是否为用户的默认配置';
COMMENT ON COLUMN user_ai_configs.created_at IS '创建时间';
COMMENT ON COLUMN user_ai_configs.updated_at IS '更新时间';
