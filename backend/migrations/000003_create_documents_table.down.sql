-- ============================================================================
-- Migration: 000003_create_documents_table (ROLLBACK)
-- Description: 回滚文档表
-- ============================================================================

-- 删除触发器
DROP TRIGGER IF EXISTS trigger_documents_search_vector ON documents;

-- 删除触发器函数
DROP FUNCTION IF EXISTS documents_search_vector_update();

-- 删除文档表
DROP TABLE IF EXISTS documents;
