-- ============================================================================
-- Migration: 000004_create_document_versions_table
-- Description: 创建文档历史版本表，用于版本管理和内容回溯
-- Author: Orange Mark Mind Team
-- Created: 2026-01-18
-- ============================================================================

-- 文档历史版本表
-- 存储文档的历史版本，每次保存时自动创建新版本
CREATE TABLE document_versions (
    -- 主键
    id BIGSERIAL PRIMARY KEY,
    
    -- 关联关系（逻辑外键）
    document_id BIGINT NOT NULL, -- 所属文档 ID (逻辑外键 -> documents.id)
    
    -- 版本信息
    version_number INT NOT NULL,     -- 版本号，从 1 开始递增
    title VARCHAR(200) NOT NULL,     -- 该版本的标题
    content TEXT,                    -- 该版本的 Markdown 内容
    
    -- 元数据
    content_hash VARCHAR(64),        -- 内容的 SHA-256 哈希，用于去重
    content_size INT DEFAULT 0,      -- 内容字节大小
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- 版本创建时间
);

-- 索引：按文档查询版本列表
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);

-- 索引：按文档和版本号查询（获取特定版本）
CREATE INDEX idx_document_versions_doc_version ON document_versions(document_id, version_number DESC);

-- 索引：按内容哈希查询（用于去重检查）
CREATE INDEX idx_document_versions_hash ON document_versions(document_id, content_hash);

-- 添加表注释
COMMENT ON TABLE document_versions IS '文档历史版本表 - 存储文档的历史版本，支持版本回溯';
COMMENT ON COLUMN document_versions.id IS '主键 ID';
COMMENT ON COLUMN document_versions.document_id IS '所属文档 ID (逻辑外键 -> documents.id)';
COMMENT ON COLUMN document_versions.version_number IS '版本号，同一文档内从 1 开始递增';
COMMENT ON COLUMN document_versions.title IS '该版本保存时的文档标题';
COMMENT ON COLUMN document_versions.content IS '该版本保存时的 Markdown 内容';
COMMENT ON COLUMN document_versions.content_hash IS '内容的 SHA-256 哈希值，用于检测内容是否变化';
COMMENT ON COLUMN document_versions.content_size IS '内容的字节大小';
COMMENT ON COLUMN document_versions.created_at IS '版本创建时间';
