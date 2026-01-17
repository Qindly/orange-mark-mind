-- ============================================================================
-- Migration: 000006_create_ai_messages_table
-- Description: 创建 AI 对话消息表，存储对话中的每条消息
-- Author: Orange Mark Mind Team
-- Created: 2026-01-18
-- ============================================================================

-- AI 对话消息表
-- 存储 AI 对话中的每条消息，支持同一对话中切换不同模型
CREATE TABLE ai_messages (
    -- 主键
    id BIGSERIAL PRIMARY KEY,
    
    -- 关联关系（逻辑外键）
    conversation_id BIGINT NOT NULL, -- 所属会话 ID (逻辑外键 -> ai_conversations.id)
    
    -- 消息内容
    role VARCHAR(20) NOT NULL,   -- 角色: user(用户), assistant(AI 助手)
    content TEXT NOT NULL,       -- 消息内容（Markdown 格式）
    
    -- 模型信息（仅 assistant 消息有值）
    model VARCHAR(100),          -- 生成该回复的模型名称，如 "gpt-4", "claude-3-opus", "gemini-pro"
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- 消息发送时间
);

-- 索引：按会话查询消息列表
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);

-- 索引：按会话和时间排序（消息顺序）
CREATE INDEX idx_ai_messages_conv_created ON ai_messages(conversation_id, created_at);

-- 索引：按模型筛选（用于统计分析）
CREATE INDEX idx_ai_messages_model ON ai_messages(model) WHERE model IS NOT NULL;

-- 创建触发器函数：插入消息后更新会话的 search_vector 和 updated_at
CREATE OR REPLACE FUNCTION ai_messages_after_insert() RETURNS TRIGGER AS $$
BEGIN
    -- 更新会话的 updated_at
    UPDATE ai_conversations 
    SET updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    
    -- 更新会话的 search_vector（聚合所有消息内容）
    UPDATE ai_conversations 
    SET search_vector = (
        SELECT setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
               setweight(to_tsvector('simple', COALESCE(string_agg(content, ' '), '')), 'B')
        FROM ai_messages 
        WHERE conversation_id = NEW.conversation_id
    )
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：消息插入后自动更新会话信息
CREATE TRIGGER trigger_ai_messages_after_insert
    AFTER INSERT ON ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION ai_messages_after_insert();

-- 添加表注释
COMMENT ON TABLE ai_messages IS 'AI 对话消息表 - 存储对话中的每条消息';
COMMENT ON COLUMN ai_messages.id IS '主键 ID';
COMMENT ON COLUMN ai_messages.conversation_id IS '所属会话 ID (逻辑外键 -> ai_conversations.id)';
COMMENT ON COLUMN ai_messages.role IS '消息角色: user(用户发送), assistant(AI 回复)';
COMMENT ON COLUMN ai_messages.content IS '消息内容，支持 Markdown 格式';
COMMENT ON COLUMN ai_messages.model IS '生成该回复的 AI 模型名称，仅 assistant 角色的消息有值';
COMMENT ON COLUMN ai_messages.created_at IS '消息发送/生成时间';
