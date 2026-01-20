-- ============================================================================
-- Migration: 000013_add_is_deleted_to_conversations
-- Description: 添加 is_deleted 字段支持对话软删除
-- Author: Orange Mark Mind Team
-- Created: 2026-01-20
-- ============================================================================

-- 添加 is_deleted 列
ALTER TABLE ai_conversations 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- 添加 deleted_at 列
ALTER TABLE ai_conversations 
ADD COLUMN deleted_at TIMESTAMPTZ;

-- 索引：排除已删除对话的查询
CREATE INDEX idx_ai_conversations_not_deleted ON ai_conversations(user_id, updated_at DESC) 
WHERE is_deleted = FALSE;

-- 索引：回收站查询
CREATE INDEX idx_ai_conversations_deleted ON ai_conversations(user_id, deleted_at DESC) 
WHERE is_deleted = TRUE;

-- 添加注释
COMMENT ON COLUMN ai_conversations.is_deleted IS '是否已删除（软删除）';
COMMENT ON COLUMN ai_conversations.deleted_at IS '删除时间';
