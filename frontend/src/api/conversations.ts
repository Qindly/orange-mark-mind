// 对话相关 API

import request from '../utils/request';
import type { ApiResponse } from '@/types/api';

// 对话列表项
export interface ConversationListItem {
    id: number;
    title: string;
    updated_at: string;
}

// 消息
export interface Message {
    id: number;
    conversation_id: number;
    role: 'user' | 'assistant';
    content: string;
    model?: string;
    created_at: string;
}

// 对话详情
export interface ConversationDetail {
    id: number;
    title: string;
    messages: Message[];
    created_at: string;
    updated_at: string;
}

// 发送消息请求
export interface SendMessageRequest {
    content: string;
    model: string;
    doc_ids?: number[];
    folder_ids?: number[];
}

// 获取对话列表
export const getConversations = (
    limit = 50,
    offset = 0
): Promise<ApiResponse<ConversationListItem[]>> => {
    return request.get('/conversations', { params: { limit, offset } });
};

// 创建对话
export const createConversation = (
    title?: string
): Promise<ApiResponse<ConversationDetail>> => {
    return request.post('/conversations', title ? { title } : {});
};

// 获取对话详情
export const getConversation = (
    id: number
): Promise<ApiResponse<ConversationDetail>> => {
    return request.get(`/conversations/${id}`);
};

// 更新对话标题
export const updateConversationTitle = (
    id: number,
    title: string
): Promise<ApiResponse<null>> => {
    return request.put(`/conversations/${id}`, { title });
};

// 删除对话（软删除）
export const deleteConversation = (
    id: number
): Promise<ApiResponse<null>> => {
    return request.delete(`/conversations/${id}`);
};

// 恢复对话
export const restoreConversation = (
    id: number
): Promise<ApiResponse<null>> => {
    return request.post(`/conversations/${id}/restore`);
};

// 搜索对话
export const searchConversations = (
    query: string,
    limit = 20
): Promise<ApiResponse<ConversationListItem[]>> => {
    return request.get('/conversations/search', { params: { q: query, limit } });
};

// 获取回收站
export const getConversationTrash = (): Promise<ApiResponse<ConversationListItem[]>> => {
    return request.get('/conversations/trash');
};

// 发送消息
export const sendMessage = (
    conversationId: number,
    data: SendMessageRequest
): Promise<ApiResponse<Message>> => {
    return request.post(`/conversations/${conversationId}/messages`, data);
};

// 重新生成消息
export const regenerateMessage = (
    conversationId: number,
    messageId: number
): Promise<ApiResponse<null>> => {
    return request.post(`/conversations/${conversationId}/messages/${messageId}/regenerate`);
};
