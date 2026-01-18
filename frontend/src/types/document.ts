// 文档相关类型定义

export interface Document {
  id: number;
  user_id: number;
  folder_id?: number;
  folder_name?: string;
  title: string;
  content?: string;
  is_favorited: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: number;
  user_id: number;
  parent_id?: number;
  name: string;
  sort_order: number;
  children?: Folder[];
  document_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: number;
  document_id: number;
  version_number: number;
  title: string;
  content?: string;
  content_hash?: string;
  content_size: number;
  created_at: string;
}

// 文档列表查询参数
export interface DocumentListParams {
  folder_id?: number;
  is_favorited?: boolean;
  is_deleted?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: 'updated_at' | 'created_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
