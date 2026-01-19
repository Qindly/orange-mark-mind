-- ============================================================================
-- Migration: 000010_add_description_to_folders
-- Description: 给文件夹表添加 description 字段
-- Author: Orange Mark Mind Team
-- Created: 2026-01-19
-- ============================================================================

-- 添加 description 字段
ALTER TABLE folders ADD COLUMN description TEXT;

-- 添加字段注释
COMMENT ON COLUMN folders.description IS '知识库简介';
