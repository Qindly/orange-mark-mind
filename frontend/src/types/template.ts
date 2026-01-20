// 模板类型定义

export interface Template {
  id: string;  // 使用 tpl-{number} 格式
  user_id?: number;
  name: string;
  description?: string;
  icon: string;
  content?: string;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  icon?: string;
  content?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  icon?: string;
  content?: string;
}

export interface UseTemplateRequest {
  title?: string;
  folder_id: string;
}
