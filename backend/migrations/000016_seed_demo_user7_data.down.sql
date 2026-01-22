-- ============================================================================
-- Migration: 000016_seed_demo_user7_data (Rollback)
-- Description: 回滚用户 ID 7 的"展示"知识库和文档
-- Author: Orange Mark Mind
-- Created: 2026-01-20
-- ============================================================================

-- 删除用户 7 的"展示"文档（先删文档再删知识库，因为文档依赖知识库）
DELETE FROM documents WHERE user_id = 7 AND title = '展示' AND folder_id IN (
    SELECT id FROM folders WHERE user_id = 7 AND name = '展示'
);

-- 删除用户 7 的"展示"知识库
DELETE FROM folders WHERE user_id = 7 AND name = '展示';
