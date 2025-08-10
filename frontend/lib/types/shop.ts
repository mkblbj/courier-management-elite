export interface Shop {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  is_active: boolean;
  sort_order: number;
  remark?: string;
  created_at: string;
  updated_at: string;
  hasRelatedData?: boolean;
  // 后端不会返回 mercari_access_token，为安全考虑不在列表/详情中暴露
}

export interface ShopFormData {
  name: string;
  is_active: boolean;
  sort_order?: number;
  category_id?: number;
  remark?: string;
  // 仅创建/更新时可传；留空表示不修改
  mercari_access_token?: string;
}

export interface ShopSortItem {
  id: number;
  sort_order: number;
}

export interface ShopCategory {
  id: number;
  name: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
} 