// 用户设置相关 API

import request from '../utils/request';
import type { ApiResponse } from '@/types/api';

// 设置响应类型
export interface UserSettingResponse {
    key: string;
    value: string;
}

// 获取所有设置
export const getAllSettings = (): Promise<ApiResponse<Record<string, string>>> => {
    return request.get('/settings');
};

// 获取指定设置
export const getSetting = (key: string): Promise<ApiResponse<UserSettingResponse>> => {
    return request.get(`/settings/${key}`);
};

// 更新设置
export const updateSetting = (
    key: string,
    value: string
): Promise<ApiResponse<UserSettingResponse>> => {
    return request.put(`/settings/${key}`, { value });
};

// 删除设置
export const deleteSetting = (key: string): Promise<ApiResponse<null>> => {
    return request.delete(`/settings/${key}`);
};

// 设置键名常量
export const SETTING_KEYS = {
    DEFAULT_SUMMARY_MODEL: 'default_summary_model',
} as const;
