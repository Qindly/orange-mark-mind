-- ============================================================================
-- Migration: 000013_add_is_deleted_to_conversations (Down)
-- Description: 回滚 - 移除 is_deleted 和 deleted_at 列
-- ============================================================================

DROP INDEX IF EXISTS idx_ai_conversations_deleted;
DROP INDEX IF EXISTS idx_ai_conversations_not_deleted;

ALTER TABLE ai_conversations DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE ai_conversations DROP COLUMN IF EXISTS is_deleted;
