// API 响应通用类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
