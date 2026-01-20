import request from "@/utils/request";
import type { ApiResponse, Document } from "@/types";
import type { Template, CreateTemplateRequest, UpdateTemplateRequest, UseTemplateRequest } from "@/types/template";

// ============================================================================
// 模板（Templates）API
// ============================================================================

/**
 * 获取模板列表（系统模板 + 用户模板）
 */
export const fetchTemplates = (): Promise<ApiResponse<Template[]>> => {
    return request.get("/templates");
};

/**
 * 获取单个模板详情
 */
export const fetchTemplateById = (
    templateId: string,
): Promise<ApiResponse<Template>> => {
    return request.get(`/templates/${templateId}`);
};

/**
 * 创建用户模板
 */
export const createTemplate = (
    data: CreateTemplateRequest,
): Promise<ApiResponse<Template>> => {
    return request.post("/templates", data);
};

/**
 * 更新用户模板
 */
export const updateTemplate = (
    templateId: string,
    data: UpdateTemplateRequest,
): Promise<ApiResponse<Template>> => {
    return request.put(`/templates/${templateId}`, data);
};

/**
 * 删除用户模板
 */
export const deleteTemplate = (
    templateId: string,
): Promise<ApiResponse<{ message: string }>> => {
    return request.delete(`/templates/${templateId}`);
};

/**
 * 使用模板创建文档
 */
export const useTemplate = (
    templateId: string,
    data: UseTemplateRequest,
): Promise<ApiResponse<Document>> => {
    return request.post(`/templates/${templateId}/use`, data);
};
