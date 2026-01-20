-- ============================================================================
-- Migration: 000015_seed_templates_data (DOWN)
-- Description: 回滚系统模板 seed 数据
-- Author: Orange Mark Mind Team
-- Created: 2026-01-20
-- ============================================================================

-- 删除系统模板
DELETE FROM templates WHERE is_system = TRUE;

-- 重置序列
SELECT setval('templates_id_seq', COALESCE((SELECT MAX(id) FROM templates), 0));
