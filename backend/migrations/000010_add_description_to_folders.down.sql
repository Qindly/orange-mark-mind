-- ============================================================================
-- Migration: 000010_add_description_to_folders (Rollback)
-- Description: 移除文件夹表的 description 字段
-- ============================================================================

ALTER TABLE folders DROP COLUMN IF EXISTS description;
