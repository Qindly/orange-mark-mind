// 用户相关类型定义

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  nickname: string;
  avatar: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

export interface LoginData {
  username: string;
  password: string;
}
