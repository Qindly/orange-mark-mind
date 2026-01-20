// AI 相关类型定义

// 提供商类型
export type AIProviderType = 'openai_compatible' | 'anthropic' | 'gemini';

// 提供商类型显示名称映射
export const AI_PROVIDER_LABELS: Record<AIProviderType, string> = {
    openai_compatible: 'OpenAI Compatible',
    anthropic: 'Anthropic',
    gemini: 'Gemini',
};

// Base URL 补全规则
export const AI_PROVIDER_ENDPOINTS: Record<AIProviderType, string> = {
    openai_compatible: '/chat/completions',
    anthropic: '/v1/messages',
    gemini: '/v1beta/models/{model}:generateContent',
};

// Models API 端点
export const AI_PROVIDER_MODELS_ENDPOINTS: Record<AIProviderType, string | null> = {
    openai_compatible: '/models',
    anthropic: null, // Anthropic 不支持 /models 端点
    gemini: '/v1beta/models',
};

// AI 配置信息（从服务端返回）
export interface AIConfig {
    id: number;
    config_name: string;
    provider_type: AIProviderType;
    base_url: string;
    api_key_masked: string; // 脱敏后的 API Key
    available_models: string[];
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

// 创建配置请求
export interface CreateAIConfigRequest {
    config_name: string;
    provider_type: AIProviderType;
    base_url: string;
    api_key: string;
    available_models: string[];
}

// 更新配置请求
export interface UpdateAIConfigRequest {
    config_name?: string;
    provider_type?: AIProviderType;
    base_url?: string;
    api_key?: string; // 不传则不更新
    available_models?: string[];
}

// 获取上游模型请求
export interface FetchModelsRequest {
    base_url: string;
    api_key: string;
    provider_type: AIProviderType;
}

// 模型信息（从上游返回）
export interface AIModel {
    id: string;
    name?: string;
    created?: number;
}
