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
}

export interface ShopFormData {
  name: string;
  is_active: boolean;
  sort_order?: number;
  category_id?: number;
  remark?: string;
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