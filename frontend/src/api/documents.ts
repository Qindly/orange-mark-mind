import type { Document, Folder, ApiResponse, PaginatedResponse } from '../types';
import { 
  getRecentDocuments, 
  getFavoriteDocuments, 
  getDeletedDocuments,
  getFolderList,
  getDocumentsByFolderId 
} from '../mock/documents';

// TODO: 后续替换为真实 API 调用
// import request from '../utils/request';

/**
 * 获取最近文档列表
 */
export const fetchRecentDocuments = (): Promise<ApiResponse<Document[]>> => {
  // Mock 实现
  return Promise.resolve({
    code: 0,
    message: 'success',
    data: getRecentDocuments(),
  });
};

/**
 * 获取收藏文档列表
 */
export const fetchFavoriteDocuments = (): Promise<ApiResponse<Document[]>> => {
  return Promise.resolve({
    code: 0,
    message: 'success',
    data: getFavoriteDocuments(),
  });
};

/**
 * 获取回收站文档列表
 */
export const fetchDeletedDocuments = (): Promise<ApiResponse<Document[]>> => {
  return Promise.resolve({
    code: 0,
    message: 'success',
    data: getDeletedDocuments(),
  });
};

/**
 * 获取文件夹列表
 */
export const fetchFolders = (): Promise<ApiResponse<Folder[]>> => {
  return Promise.resolve({
    code: 0,
    message: 'success',
    data: getFolderList(),
  });
};

/**
 * 获取某文件夹下的文档
 */
export const fetchDocumentsByFolder = (folderId: number): Promise<ApiResponse<Document[]>> => {
  return Promise.resolve({
    code: 0,
    message: 'success',
    data: getDocumentsByFolderId(folderId),
  });
};

/**
 * 创建文档 (Mock)
 */
export const createDocument = (data: { title: string; folder_id?: number }): Promise<ApiResponse<Document>> => {
  const newDoc: Document = {
    id: Date.now(),
    user_id: 1,
    folder_id: data.folder_id,
    title: data.title,
    content: '',
    is_favorited: false,
    is_deleted: false,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return Promise.resolve({
    code: 0,
    message: 'success',
    data: newDoc,
  });
};

/**
 * 创建文件夹 (Mock)
 */
export const createFolder = (data: { name: string; parent_id?: number }): Promise<ApiResponse<Folder>> => {
  const newFolder: Folder = {
    id: Date.now(),
    user_id: 1,
    parent_id: data.parent_id,
    name: data.name,
    sort_order: 0,
    document_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return Promise.resolve({
    code: 0,
    message: 'success',
    data: newFolder,
  });
};

// 保留类型导出供其他模块使用
export type { Document, Folder, PaginatedResponse };
