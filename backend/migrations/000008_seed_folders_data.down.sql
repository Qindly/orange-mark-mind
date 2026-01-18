-- ============================================================================
-- Migration: 000008_seed_folders_data (DOWN)
-- Description: 回滚样例知识库数据
-- ============================================================================

-- 删除用户 5 和 6 的知识库数据
DELETE FROM folders WHERE user_id IN (5, 6);

-- 重置序列（如果表为空）
SELECT setval('folders_id_seq', COALESCE((SELECT MAX(id) FROM folders), 1));
