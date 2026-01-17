-- ============================================================================
-- Migration: 000005_create_ai_conversations_table
-- Description: 创建 AI 对话会话表，存储用户与 AI 的对话会话
-- Author: Orange Mark Mind Team
-- Created: 2026-01-18
-- ============================================================================

-- AI 对话会话表
-- 存储用户的 AI 对话会话信息，一个会话包含多条消息
CREATE TABLE ai_conversations (
    -- 主键
    id BIGSERIAL PRIMARY KEY,
    
    -- 关联关系（逻辑外键）
    user_id BIGINT NOT NULL, -- 所属用户 ID (逻辑外键 -> users.id)
    
    -- 会话信息
    title VARCHAR(200), -- 对话标题，可由第一条消息自动生成
    
    -- 全文搜索向量（用于搜索对话内容）
    search_vector TSVECTOR, -- PostgreSQL 全文搜索向量
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 创建时间
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- 更新时间（最后一条消息时间）
);

-- 索引：按用户查询会话列表
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);

-- 索引：按用户和更新时间排序（最近的对话在前）
CREATE INDEX idx_ai_conversations_user_updated ON ai_conversations(user_id, updated_at DESC);

-- 全文搜索索引
CREATE INDEX idx_ai_conversations_search ON ai_conversations USING GIN(search_vector);

-- 添加表注释
COMMENT ON TABLE ai_conversations IS 'AI 对话会话表 - 存储用户与 AI 的对话会话';
COMMENT ON COLUMN ai_conversations.id IS '主键 ID';
COMMENT ON COLUMN ai_conversations.user_id IS '所属用户 ID (逻辑外键 -> users.id)';
COMMENT ON COLUMN ai_conversations.title IS '对话标题，可由第一条用户消息自动生成';
COMMENT ON COLUMN ai_conversations.search_vector IS 'PostgreSQL 全文搜索向量，包含对话内所有消息内容';
COMMENT ON COLUMN ai_conversations.created_at IS '会话创建时间';
COMMENT ON COLUMN ai_conversations.updated_at IS '会话最后更新时间（最后一条消息的时间）';
