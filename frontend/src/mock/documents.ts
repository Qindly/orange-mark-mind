// Mock 数据 - 文档和文件夹
// 用于前端开发阶段，后续对接真实 API 后删除

import type { Document, Folder } from '../types';

// 模拟文件夹数据
export const mockFolders: Folder[] = [
  {
    id: 1,
    user_id: 1,
    parent_id: undefined,
    name: '前端知识库',
    sort_order: 0,
    document_count: 4,
    created_at: '2025-09-01T10:00:00Z',
    updated_at: '2025-09-08T14:30:00Z',
  },
  {
    id: 2,
    user_id: 1,
    parent_id: undefined,
    name: '后端学习笔记',
    sort_order: 1,
    document_count: 2,
    created_at: '2025-08-15T09:00:00Z',
    updated_at: '2025-09-05T16:20:00Z',
  },
  {
    id: 3,
    user_id: 1,
    parent_id: undefined,
    name: '项目文档',
    sort_order: 2,
    document_count: 3,
    created_at: '2025-07-20T08:00:00Z',
    updated_at: '2025-09-02T11:45:00Z',
  },
];

// 模拟文档数据
export const mockDocuments: Document[] = [
  {
    id: 1,
    user_id: 1,
    folder_id: 1,
    folder_name: '前端知识库',
    title: '7 - 手撕代码',
    content: '# 手撕代码\n\n## 防抖与节流\n\n```javascript\nfunction debounce(fn, delay) {\n  let timer = null;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\n```',
    is_favorited: true,
    is_deleted: false,
    sort_order: 0,
    created_at: '2025-09-08T10:00:00Z',
    updated_at: '2025-09-08T14:30:00Z',
  },
  {
    id: 2,
    user_id: 1,
    folder_id: 1,
    folder_name: '前端知识库',
    title: '6 - 前端工程化',
    content: '# 前端工程化\n\n## Webpack 配置\n\n...',
    is_favorited: false,
    is_deleted: false,
    sort_order: 1,
    created_at: '2025-09-02T09:00:00Z',
    updated_at: '2025-09-02T11:20:00Z',
  },
  {
    id: 3,
    user_id: 1,
    folder_id: 1,
    folder_name: '前端知识库',
    title: '5 - 浏览器、计算机网络八股',
    content: '# 浏览器与计算机网络\n\n## HTTP 状态码\n\n...',
    is_favorited: true,
    is_deleted: false,
    sort_order: 2,
    created_at: '2025-09-02T08:00:00Z',
    updated_at: '2025-09-02T10:15:00Z',
  },
  {
    id: 4,
    user_id: 1,
    folder_id: 1,
    folder_name: '前端知识库',
    title: '3 - JS 八股',
    content: '# JavaScript 八股\n\n## 闭包\n\n...',
    is_favorited: false,
    is_deleted: false,
    sort_order: 3,
    created_at: '2025-09-02T07:00:00Z',
    updated_at: '2025-09-02T09:30:00Z',
  },
  {
    id: 5,
    user_id: 1,
    folder_id: 2,
    folder_name: '后端学习笔记',
    title: 'Go 语言入门',
    content: '# Go 语言入门\n\n## 变量声明\n\n...',
    is_favorited: false,
    is_deleted: false,
    sort_order: 0,
    created_at: '2025-09-01T10:00:00Z',
    updated_at: '2025-09-01T15:00:00Z',
  },
  {
    id: 6,
    user_id: 1,
    folder_id: 2,
    folder_name: '后端学习笔记',
    title: 'PostgreSQL 基础',
    content: '# PostgreSQL 基础\n\n## 数据类型\n\n...',
    is_favorited: true,
    is_deleted: false,
    sort_order: 1,
    created_at: '2025-08-28T09:00:00Z',
    updated_at: '2025-08-28T12:00:00Z',
  },
  {
    id: 7,
    user_id: 1,
    folder_id: undefined,
    folder_name: undefined,
    title: '临时笔记',
    content: '# 临时笔记\n\n待整理...',
    is_favorited: false,
    is_deleted: false,
    sort_order: 0,
    created_at: '2025-09-07T20:00:00Z',
    updated_at: '2025-09-07T20:30:00Z',
  },
];

// 模拟回收站文档
export const mockDeletedDocuments: Document[] = [
  {
    id: 100,
    user_id: 1,
    folder_id: 1,
    folder_name: '前端知识库',
    title: '已删除的文档',
    content: '...',
    is_favorited: false,
    is_deleted: true,
    deleted_at: '2025-09-05T10:00:00Z',
    sort_order: 0,
    created_at: '2025-08-01T10:00:00Z',
    updated_at: '2025-09-05T10:00:00Z',
  },
];

// 获取最近文档（按更新时间排序）
export function getRecentDocuments(): Document[] {
  return [...mockDocuments]
    .filter(doc => !doc.is_deleted)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

// 获取收藏文档
export function getFavoriteDocuments(): Document[] {
  return mockDocuments.filter(doc => doc.is_favorited && !doc.is_deleted);
}

// 获取回收站文档
export function getDeletedDocuments(): Document[] {
  return mockDeletedDocuments;
}

// 获取文件夹列表
export function getFolderList(): Folder[] {
  return mockFolders;
}

// 获取某文件夹下的文档
export function getDocumentsByFolderId(folderId: number): Document[] {
  return mockDocuments.filter(doc => doc.folder_id === folderId && !doc.is_deleted);
}
