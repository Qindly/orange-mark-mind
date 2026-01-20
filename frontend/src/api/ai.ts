// AI 配置相关 API

import request from '../utils/request';
import type { ApiResponse } from '@/types/api';
import type {
    AIConfig,
    CreateAIConfigRequest,
    UpdateAIConfigRequest,
    FetchModelsRequest,
    AIModel,
} from '@/types/ai';

// 获取 AI 配置列表
export const getAIConfigs = (): Promise<ApiResponse<AIConfig[]>> => {
    return request.get('/ai-configs');
};

// 创建 AI 配置
export const createAIConfig = (
    data: CreateAIConfigRequest
): Promise<ApiResponse<AIConfig>> => {
    return request.post('/ai-configs', data);
};

// 更新 AI 配置
export const updateAIConfig = (
    id: number,
    data: UpdateAIConfigRequest
): Promise<ApiResponse<AIConfig>> => {
    return request.put(`/ai-configs/${id}`, data);
};

// 删除 AI 配置
export const deleteAIConfig = (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/ai-configs/${id}`);
};

// 设为默认配置
export const setDefaultAIConfig = (id: number): Promise<ApiResponse<AIConfig>> => {
    return request.put(`/ai-configs/${id}/default`);
};

// 从上游获取模型列表
export const fetchModels = (
    data: FetchModelsRequest
): Promise<ApiResponse<AIModel[]>> => {
    return request.post('/ai-configs/models', data);
};
