-- ============================================================================
-- Migration: 000003_create_documents_table
-- Description: 创建文档表，存储 Markdown 文档内容，支持收藏和软删除
-- Author: Orange Mark Mind Team
-- Created: 2026-01-18
-- ============================================================================

-- 文档表
-- 存储用户的 Markdown 文档，支持文件夹组织、收藏、软删除（回收站）
CREATE TABLE documents (
    -- 主键
    id BIGSERIAL PRIMARY KEY,
    
    -- 关联关系（逻辑外键）
    user_id BIGINT NOT NULL,    -- 所属用户 ID (逻辑外键 -> users.id)
    folder_id BIGINT,           -- 所属文件夹 ID (逻辑外键 -> folders.id)，NULL 表示在根目录
    
    -- 文档内容
    title VARCHAR(200) NOT NULL DEFAULT '无标题文档', -- 文档标题
    content TEXT,                                     -- Markdown 内容
    
    -- 状态标记
    is_favorited BOOLEAN NOT NULL DEFAULT FALSE, -- 是否收藏
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,   -- 是否软删除（在回收站中）
    deleted_at TIMESTAMPTZ,                      -- 软删除时间
    
    -- 排序
    sort_order INT DEFAULT 0, -- 排序顺序，数值越小越靠前
    
    -- 全文搜索向量
    search_vector TSVECTOR, -- PostgreSQL 全文搜索向量
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 创建时间
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- 更新时间
);

-- 索引：按用户查询
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- 索引：按文件夹查询
CREATE INDEX idx_documents_folder_id ON documents(folder_id);

-- 索引：收藏文档查询
CREATE INDEX idx_documents_favorited ON documents(user_id, is_favorited) WHERE is_favorited = TRUE;

-- 索引：回收站查询（软删除的文档）
CREATE INDEX idx_documents_deleted ON documents(user_id, is_deleted, deleted_at) WHERE is_deleted = TRUE;

-- 索引：正常文档列表（未删除）
CREATE INDEX idx_documents_active ON documents(user_id, folder_id, sort_order) WHERE is_deleted = FALSE;

-- 全文搜索索引 (GIN 索引)
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);

-- 创建触发器函数：自动更新 search_vector
CREATE OR REPLACE FUNCTION documents_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：在 INSERT 或 UPDATE 时自动更新搜索向量
CREATE TRIGGER trigger_documents_search_vector
    BEFORE INSERT OR UPDATE OF title, content ON documents
    FOR EACH ROW
    EXECUTE FUNCTION documents_search_vector_update();

-- 添加表注释
COMMENT ON TABLE documents IS '文档表 - 存储用户的 Markdown 文档内容';
COMMENT ON COLUMN documents.id IS '主键 ID';
COMMENT ON COLUMN documents.user_id IS '所属用户 ID (逻辑外键 -> users.id)';
COMMENT ON COLUMN documents.folder_id IS '所属文件夹 ID (逻辑外键 -> folders.id)，NULL 表示在根目录';
COMMENT ON COLUMN documents.title IS '文档标题';
COMMENT ON COLUMN documents.content IS 'Markdown 格式的文档内容';
COMMENT ON COLUMN documents.is_favorited IS '是否被用户收藏';
COMMENT ON COLUMN documents.is_deleted IS '是否软删除（在回收站中）';
COMMENT ON COLUMN documents.deleted_at IS '软删除的时间，用于回收站自动清理';
COMMENT ON COLUMN documents.sort_order IS '排序顺序，数值越小越靠前';
COMMENT ON COLUMN documents.search_vector IS 'PostgreSQL 全文搜索向量，自动由触发器维护';
COMMENT ON COLUMN documents.created_at IS '创建时间';
COMMENT ON COLUMN documents.updated_at IS '更新时间';
