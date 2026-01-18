import request from "@/utils/request";
import type { Folder, ApiResponse } from "@/types";

// ============================================================================
// 知识库（Folders）真实 API
// ============================================================================

/**
 * 获取知识库列表
 * @param flat 是否返回扁平列表（默认返回树形结构）
 */
export const fetchFolders = (
  flat: boolean = false,
): Promise<ApiResponse<Folder[]>> => {
  return request.get("/folders", { params: { flat } });
};

/**
 * 获取单个知识库详情
 * @param folderId 知识库 ID (kb-{n})
 */
export const fetchFolderById = (
  folderId: string,
): Promise<ApiResponse<Folder>> => {
  return request.get(`/folders/${folderId}`);
};

/**
 * 创建知识库
 */
export interface CreateFolderRequest {
  name: string;
  description?: string;
  parent_id?: string;
}

export const createFolder = (
  data: CreateFolderRequest,
): Promise<ApiResponse<Folder>> => {
  return request.post("/folders", data);
};

/**
 * 更新知识库
 */
export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  parent_id?: string;
  sort_order?: number;
}

export const updateFolder = (
  folderId: string,
  data: UpdateFolderRequest,
): Promise<ApiResponse<Folder>> => {
  return request.put(`/folders/${folderId}`, data);
};

/**
 * 删除知识库
 * @param folderId 知识库 ID
 * @param deleteChildren 是否同时删除子知识库
 */
export interface DeleteFolderResponse {
  message: string;
  affected_documents: number;
}

export const deleteFolder = (
  folderId: string,
  deleteChildren: boolean = false,
): Promise<ApiResponse<DeleteFolderResponse>> => {
  return request.delete(`/folders/${folderId}`, {
    params: { delete_children: deleteChildren },
  });
};
