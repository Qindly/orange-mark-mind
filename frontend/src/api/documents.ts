import request from "@/utils/request";
import type { Document, ApiResponse } from "@/types";

// ============================================================================
// 文档（Documents）真实 API
// ============================================================================

/**
 * 获取文档列表
 * @param folderId 可选，按知识库过滤
 */
export const fetchDocuments = (
  folderId?: string,
): Promise<ApiResponse<Document[]>> => {
  const params: Record<string, string> = {};
  if (folderId) {
    params.folder_id = folderId;
  }
  return request.get("/documents", { params });
};

/**
 * 获取某文件夹下的文档
 */
export const fetchDocumentsByFolder = (
  folderId: string,
): Promise<ApiResponse<Document[]>> => {
  return request.get("/documents", { params: { folder_id: folderId } });
};

/**
 * 获取最近文档
 */
export const fetchRecentDocuments = (
  limit: number = 20,
): Promise<ApiResponse<Document[]>> => {
  return request.get("/documents/recent", { params: { limit } });
};

/**
 * 获取收藏文档
 */
export const fetchFavoriteDocuments = (): Promise<ApiResponse<Document[]>> => {
  return request.get("/documents/favorites");
};

/**
 * 获取回收站文档
 */
export const fetchDeletedDocuments = (): Promise<ApiResponse<Document[]>> => {
  return request.get("/documents/trash");
};

/**
 * 获取单个文档详情
 */
export const fetchDocumentById = (
  docId: string,
): Promise<ApiResponse<Document>> => {
  return request.get(`/documents/${docId}`);
};

/**
 * 创建文档
 */
export interface CreateDocumentRequest {
  title: string;
  content?: string;
  folder_id: string;
}

export const createDocument = (
  data: CreateDocumentRequest,
): Promise<ApiResponse<Document>> => {
  return request.post("/documents", data);
};

/**
 * 更新文档
 */
export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  folder_id?: string;
  is_favorited?: boolean;
}

export const updateDocument = (
  docId: string,
  data: UpdateDocumentRequest,
): Promise<ApiResponse<Document>> => {
  return request.put(`/documents/${docId}`, data);
};

/**
 * 删除文档
 * @param docId 文档 ID
 * @param permanent 是否永久删除
 */
export interface DeleteDocumentResponse {
  message: string;
}

export const deleteDocument = (
  docId: string,
  permanent: boolean = false,
): Promise<ApiResponse<DeleteDocumentResponse>> => {
  return request.delete(`/documents/${docId}`, { params: { permanent } });
};

/**
 * 恢复文档
 */
export const restoreDocument = (
  docId: string,
): Promise<ApiResponse<DeleteDocumentResponse>> => {
  return request.post(`/documents/${docId}/restore`);
};

/**
 * 搜索文档
 * @param query 搜索关键词
 * @param limit 结果数量限制
 */
export const searchDocuments = (
  query: string,
  limit: number = 20,
): Promise<ApiResponse<Document[]>> => {
  return request.get("/documents/search", { params: { q: query, limit } });
};
