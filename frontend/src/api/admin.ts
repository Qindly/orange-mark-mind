import request from '../utils/request';
import type { UserInfo, ApiResponse } from '../types';

// Admin 用户管理 API

export interface UserListParams {
    page?: number;
    page_size?: number;
    search?: string;
    role?: string;
}

export interface UserListResponse {
    users: UserInfo[];
    total: number;
    page: number;
    page_size: number;
}

export interface UpdateUserRequest {
    nickname?: string;
    role?: string;
    status?: string;
}

/**
 * 获取用户列表（管理员）
 */
export const fetchUsers = (params?: UserListParams): Promise<ApiResponse<UserListResponse>> => {
    return request.get('/admin/users', { params });
};

/**
 * 获取单个用户信息（管理员）
 */
export const fetchUserById = (userId: number): Promise<ApiResponse<UserInfo>> => {
    return request.get(`/admin/users/${userId}`);
};

/**
 * 更新用户信息（管理员）
 */
export const updateUser = (userId: number, data: UpdateUserRequest): Promise<ApiResponse<UserInfo>> => {
    return request.put(`/admin/users/${userId}`, data);
};

/**
 * 删除用户（管理员）
 */
export const deleteUser = (userId: number): Promise<ApiResponse<{ message: string }>> => {
    return request.delete(`/admin/users/${userId}`);
};
