-- ============================================================================
-- Migration: 000008_seed_folders_data
-- Description: 为用户 ID 5 和 6 添加样例知识库数据
-- Author: Orange Mark Mind
-- Created: 2026-01-18
-- ============================================================================

-- 用户 5 的知识库
INSERT INTO folders (id, user_id, parent_id, name, sort_order, created_at, updated_at) VALUES
(1, 5, NULL, '默认知识库', -1, NOW(), NOW()),
(2, 5, NULL, '前端知识库', 0, NOW(), NOW()),
(3, 5, NULL, '后端学习笔记', 1, NOW(), NOW()),
(4, 5, NULL, '项目文档', 2, NOW(), NOW()),
(5, 5, 2, 'JavaScript', 0, NOW(), NOW()),
(6, 5, 2, 'React', 1, NOW(), NOW()),
(7, 5, 3, 'Go 语言', 0, NOW(), NOW());

-- 用户 6 的知识库
INSERT INTO folders (id, user_id, parent_id, name, sort_order, created_at, updated_at) VALUES
(8, 6, NULL, '默认知识库', -1, NOW(), NOW()),
(9, 6, NULL, '工作笔记', 0, NOW(), NOW()),
(10, 6, NULL, '个人项目', 1, NOW(), NOW()),
(11, 6, 9, '会议记录', 0, NOW(), NOW()),
(12, 6, 9, '技术方案', 1, NOW(), NOW());

-- 更新序列值，防止后续插入冲突
SELECT setval('folders_id_seq', (SELECT MAX(id) FROM folders));
