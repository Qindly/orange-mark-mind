-- ============================================================================
-- Migration: 000009_seed_documents_data (DOWN)
-- Description: 回滚样例文档数据
-- ============================================================================

-- 删除用户 5 和 6 的文档数据
DELETE FROM documents WHERE user_id IN (5, 6);

-- 重置序列
SELECT setval('documents_id_seq', COALESCE((SELECT MAX(id) FROM documents), 1));
