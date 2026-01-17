-- ============================================================================
-- Migration: 000001_create_users_table
-- Description: 创建用户表，存储用户基本信息和认证数据
-- Author: Orange Mark Mind Team
-- Created: 2026-01-18
-- ============================================================================

-- 用户表
-- 存储系统用户的基本信息、认证凭据和状态
CREATE TABLE users (
    -- 主键
    id BIGSERIAL PRIMARY KEY,
    
    -- 登录凭据
    username VARCHAR(50) NOT NULL,      -- 用户名，用于登录
    email VARCHAR(100) NOT NULL,         -- 邮箱，用于登录和找回密码
    password_hash VARCHAR(255) NOT NULL, -- BCrypt 加密后的密码
    
    -- 用户信息
    nickname VARCHAR(50),                -- 昵称，用于显示
    avatar VARCHAR(255),                 -- 头像 URL
    
    -- 权限与状态
    role VARCHAR(20) NOT NULL DEFAULT 'user',     -- 角色: user(普通用户), admin(管理员)
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 状态: active(正常), disabled(禁用)
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 创建时间
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- 更新时间
);

-- 唯一索引
CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- 状态索引，用于后台管理筛选
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);

-- 添加表注释
COMMENT ON TABLE users IS '用户表 - 存储系统用户的基本信息和认证数据';
COMMENT ON COLUMN users.id IS '主键 ID';
COMMENT ON COLUMN users.username IS '用户名，用于登录，全局唯一';
COMMENT ON COLUMN users.email IS '邮箱地址，用于登录和找回密码，全局唯一';
COMMENT ON COLUMN users.password_hash IS 'BCrypt 加密后的密码哈希';
COMMENT ON COLUMN users.nickname IS '用户昵称，用于前端显示';
COMMENT ON COLUMN users.avatar IS '用户头像的 URL 地址';
COMMENT ON COLUMN users.role IS '用户角色: user(普通用户), admin(管理员)';
COMMENT ON COLUMN users.status IS '账号状态: active(正常), disabled(禁用)';
COMMENT ON COLUMN users.created_at IS '账号创建时间';
COMMENT ON COLUMN users.updated_at IS '账号信息最后更新时间';
