-- ============================================================================
-- Migration: 000009_seed_documents_data
-- Description: 为用户 ID 5 和 6 添加样例文档数据
-- Author: Orange Mark Mind
-- Created: 2026-01-18
-- ============================================================================

-- 用户 5 的文档（基于 000008 中的知识库）
-- folder_id 对应关系：
-- 1 = 默认知识库, 2 = 前端知识库, 3 = 后端学习笔记, 4 = 项目文档
-- 5 = JavaScript (父: 2), 6 = React (父: 2), 7 = Go 语言 (父: 3)

INSERT INTO documents (id, user_id, folder_id, title, content, is_favorited, is_deleted, sort_order, created_at, updated_at) VALUES
-- 默认知识库
(1, 5, 1, '欢迎使用 Orange Mark Mind', '# 欢迎使用 Orange Mark Mind

这是您的第一篇文档，开始您的知识管理之旅吧！

## 快捷键

- `Ctrl + N` 新建文档
- `Ctrl + S` 保存文档
- `Ctrl + /` 打开命令面板', false, false, 0, NOW(), NOW()),

-- 前端知识库
(2, 5, 2, '前端开发路线图', '# 前端开发学习路线

## 基础阶段
- HTML5
- CSS3
- JavaScript ES6+

## 进阶阶段
- TypeScript
- React / Vue
- 状态管理', true, false, 0, NOW(), NOW()),

-- JavaScript 子文件夹
(3, 5, 5, 'JavaScript 基础语法', '# JavaScript 基础

## 变量声明

```javascript
const name = "Orange";
let age = 18;
```

## 函数

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```', false, false, 0, NOW(), NOW()),

(4, 5, 5, 'ES6 新特性', '# ES6 新特性

## 箭头函数

```javascript
const add = (a, b) => a + b;
```

## 解构赋值

```javascript
const { name, age } = person;
const [first, second] = array;
```', false, false, 1, NOW(), NOW()),

-- React 子文件夹
(5, 5, 6, 'React 入门指南', '# React 入门

## 创建组件

```jsx
function Welcome({ name }) {
  return <h1>Hello, {name}</h1>;
}
```

## 使用 Hooks

```jsx
const [count, setCount] = useState(0);
```', true, false, 0, NOW(), NOW()),

-- Go 语言子文件夹
(6, 5, 7, 'Go 语言基础', '# Go 语言入门

## Hello World

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
```

## 变量声明

```go
var name string = "Orange"
age := 18
```', false, false, 0, NOW(), NOW()),

-- 项目文档
(7, 5, 4, 'Orange Mark Mind 项目规划', '# 项目规划

## 技术栈

- 前端: React + TypeScript + Vite
- 后端: Go + Gin + GORM
- 数据库: PostgreSQL + Redis

## 功能模块

- [ ] 用户认证
- [x] 知识库管理
- [x] 文档管理
- [ ] AI 对话', false, false, 0, NOW(), NOW());


-- 用户 6 的文档
-- folder_id 对应关系：
-- 8 = 默认知识库, 9 = 工作笔记, 10 = 个人项目
-- 11 = 会议记录 (父: 9), 12 = 技术方案 (父: 9)

INSERT INTO documents (id, user_id, folder_id, title, content, is_favorited, is_deleted, sort_order, created_at, updated_at) VALUES
-- 默认知识库
(8, 6, 8, '快速开始', '# 快速开始

欢迎使用 Orange Mark Mind！

这里是您记录知识的地方。', false, false, 0, NOW(), NOW()),

-- 工作笔记
(9, 6, 9, '2026年工作计划', '# 2026年工作计划

## Q1 目标

- 完成系统重构
- 优化性能指标

## Q2 目标

- 新功能开发
- 团队培训', true, false, 0, NOW(), NOW()),

-- 会议记录子文件夹
(10, 6, 11, '周会记录 01-15', '# 周会记录 2026-01-15

## 参会人员

- 产品经理
- 技术负责人
- 开发人员

## 讨论内容

1. 项目进度更新
2. 问题排查
3. 下周计划', false, false, 0, NOW(), NOW()),

-- 技术方案子文件夹
(11, 6, 12, '微服务架构方案', '# 微服务架构方案

## 服务拆分

- 用户服务
- 订单服务
- 支付服务

## 技术选型

- 框架: Go + Gin
- RPC: gRPC
- 注册中心: Consul', true, false, 0, NOW(), NOW()),

-- 个人项目
(12, 6, 10, '个人博客开发记录', '# 个人博客开发

## 技术栈

- Next.js
- TailwindCSS
- MDX

## 进度

- [x] 首页设计
- [x] 文章列表
- [ ] 评论系统', false, false, 0, NOW(), NOW());

-- 更新序列值
SELECT setval('documents_id_seq', (SELECT MAX(id) FROM documents));
