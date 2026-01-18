import type { Document, Folder, ApiResponse, PaginatedResponse } from "@/types";
import {
  getRecentDocuments,
  getFavoriteDocuments,
  getDeletedDocuments,
  getDocumentsByFolderId,
  getDocumentById,
} from "@/mock/documents";

// 真实 API
import {
  fetchFolders as fetchFoldersReal,
  fetchFolderById as fetchFolderByIdReal,
  createFolder as createFolderReal,
} from "./folders";

// ============================================================================
// Folders - 使用真实 API
// ============================================================================

/**
 * 获取文件夹列表（真实 API）
 */
export const fetchFolders = fetchFoldersReal;

/**
 * 获取单个文件夹信息（真实 API）
 */
export const fetchFolderById = fetchFolderByIdReal;

/**
 * 创建文件夹（真实 API）
 */
export const createFolder = createFolderReal;

// ============================================================================
// Documents - 仍使用 Mock（待后端实现）
// ============================================================================

/**
 * 获取最近文档列表 (Mock)
 */
export const fetchRecentDocuments = (): Promise<ApiResponse<Document[]>> => {
  return Promise.resolve({
    code: 0,
    message: "success",
    data: getRecentDocuments(),
  });
};

/**
 * 获取收藏文档列表 (Mock)
 */
export const fetchFavoriteDocuments = (): Promise<ApiResponse<Document[]>> => {
  return Promise.resolve({
    code: 0,
    message: "success",
    data: getFavoriteDocuments(),
  });
};

/**
 * 获取回收站文档列表 (Mock)
 */
export const fetchDeletedDocuments = (): Promise<ApiResponse<Document[]>> => {
  return Promise.resolve({
    code: 0,
    message: "success",
    data: getDeletedDocuments(),
  });
};

/**
 * 获取某文件夹下的文档 (Mock)
 */
export const fetchDocumentsByFolder = (
  folderId: string,
): Promise<ApiResponse<Document[]>> => {
  return Promise.resolve({
    code: 0,
    message: "success",
    data: getDocumentsByFolderId(folderId),
  });
};

/**
 * 获取单个文档信息 (Mock)
 */
export const fetchDocumentById = (
  docId: string,
): Promise<ApiResponse<Document | null>> => {
  const doc = getDocumentById(docId);
  return Promise.resolve({
    code: doc ? 0 : 404,
    message: doc ? "success" : "Document not found",
    data: doc || null,
  });
};

/**
 * 创建文档 (Mock)
 */
export const createDocument = (data: {
  title: string;
  folder_id: string;
}): Promise<ApiResponse<Document>> => {
  const newDoc: Document = {
    id: `doc-${Date.now()}`,
    user_id: 1,
    folder_id: data.folder_id,
    title: data.title,
    content: "",
    is_favorited: false,
    is_deleted: false,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return Promise.resolve({
    code: 0,
    message: "success",
    data: newDoc,
  });
};

// 保留类型导出供其他模块使用
export type { Document, Folder, PaginatedResponse };
