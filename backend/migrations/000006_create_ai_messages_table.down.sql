-- ============================================================================
-- Migration: 000006_create_ai_messages_table (ROLLBACK)
-- Description: 回滚 AI 对话消息表
-- ============================================================================

-- 删除触发器
DROP TRIGGER IF EXISTS trigger_ai_messages_after_insert ON ai_messages;

-- 删除触发器函数
DROP FUNCTION IF EXISTS ai_messages_after_insert();

-- 删除消息表
DROP TABLE IF EXISTS ai_messages;
