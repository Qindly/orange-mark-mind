// AI 配置相关 API

import type { ApiResponse } from '@/types/api';
import type {
    AIConfig,
    CreateAIConfigRequest,
    UpdateAIConfigRequest,
    FetchModelsRequest,
    AIModel,
} from '@/types/ai';

const API_BASE = '/api/v1';

// 获取 AI 配置列表
export async function getAIConfigs(): Promise<ApiResponse<AIConfig[]>> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE}/ai-configs`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
}

// 创建 AI 配置
export async function createAIConfig(
    data: CreateAIConfigRequest
): Promise<ApiResponse<AIConfig>> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE}/ai-configs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return response.json();
}

// 更新 AI 配置
export async function updateAIConfig(
    id: number,
    data: UpdateAIConfigRequest
): Promise<ApiResponse<AIConfig>> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE}/ai-configs/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return response.json();
}

// 删除 AI 配置
export async function deleteAIConfig(id: number): Promise<ApiResponse<null>> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE}/ai-configs/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
}

// 设为默认配置
export async function setDefaultAIConfig(id: number): Promise<ApiResponse<AIConfig>> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE}/ai-configs/${id}/default`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
}

// 从上游获取模型列表
export async function fetchModels(
    data: FetchModelsRequest
): Promise<ApiResponse<AIModel[]>> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE}/ai-configs/models`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return response.json();
}
