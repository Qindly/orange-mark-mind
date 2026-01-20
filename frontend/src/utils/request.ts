import axios from 'axios';
import type { AxiosError, AxiosRequestConfig } from 'axios';

// 扩展请求配置类型
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// API 基础地址（从环境变量读取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// 创建 axios 实例
const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动添加 Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理 Token 刷新
request.interceptors.response.use(
  (response) => {
    // 直接返回 data，简化调用
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // 如果是 401 且未重试过，尝试刷新 Token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = res.data.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        // 重试原请求
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return request(originalRequest);
      } catch (refreshError) {
        // 刷新失败，清除 Token，跳转登录页
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default request;
