-- ============================================================================
-- Migration: 000011_add_provider_type_to_user_ai_configs
-- Description: 添加 provider_type 列到 user_ai_configs 表
-- Author: Orange Mark Mind Team
-- Created: 2026-01-20
-- ============================================================================

-- 添加 provider_type 列
-- 用于标识 AI 提供商类型：openai_compatible, anthropic, gemini
ALTER TABLE user_ai_configs 
ADD COLUMN provider_type VARCHAR(30) NOT NULL DEFAULT 'openai_compatible';

-- 添加注释
COMMENT ON COLUMN user_ai_configs.provider_type IS 'AI 提供商类型: openai_compatible, anthropic, gemini';
