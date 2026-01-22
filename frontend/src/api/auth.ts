import request from '../utils/request';
import type { RegisterData, LoginData, UserInfo, TokenInfo, ApiResponse } from '../types';

// API 接口

/**
 * 用户注册
 */
export const register = (data: RegisterData): Promise<ApiResponse<{ user: UserInfo }>> => {
  return request.post('/auth/register', data);
};

/**
 * 用户登录
 */
export const login = (data: LoginData): Promise<ApiResponse<{ user: UserInfo; tokens: TokenInfo }>> => {
  return request.post('/auth/login', data);
};

/**
 * 用户登出
 */
export const logout = (): Promise<ApiResponse<{ message: string }>> => {
  const refreshToken = localStorage.getItem('refresh_token');
  return request.post('/auth/logout', { refresh_token: refreshToken });
};

/**
 * 刷新 Token
 */
export const refreshToken = (): Promise<ApiResponse<TokenInfo>> => {
  const token = localStorage.getItem('refresh_token');
  return request.post('/auth/refresh', { refresh_token: token });
};

/**
 * 修改密码
 */
export const changePassword = (data: { old_password: string; new_password: string }): Promise<ApiResponse<{ message: string }>> => {
  return request.put('/auth/password', data);
};
