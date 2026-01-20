-- ============================================================================
-- Migration: 000011_add_provider_type_to_user_ai_configs (Down)
-- Description: 回滚 - 移除 provider_type 列
-- ============================================================================

ALTER TABLE user_ai_configs DROP COLUMN IF EXISTS provider_type;
