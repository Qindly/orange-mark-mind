-- ============================================================================
-- Migration: 000014_create_templates_table (DOWN)
-- Description: 回滚创建模板表
-- Author: Orange Mark Mind Team
-- Created: 2026-01-20
-- ============================================================================

-- 删除索引
DROP INDEX IF EXISTS idx_templates_sort;
DROP INDEX IF EXISTS idx_templates_system;
DROP INDEX IF EXISTS idx_templates_user_id;

-- 删除表
DROP TABLE IF EXISTS templates;
