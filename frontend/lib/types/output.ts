export interface ShopOutput {
  id: number;
  shop_id: number;
  shop_name?: string;
  courier_id?: number;
  courier_name?: string;
  date: string;
  output_date?: string;
  output_count: number;
  quantity?: number;
  avg_time: number;
  min_time: number;
  max_time: number;
  total_time: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ShopOutputForm {
  shop_id: number;
  courier_id: number;
  date: string;
  output_date?: string;
  output_count: number;
  quantity?: number;
  avg_time: number;
  min_time: number;
  max_time: number;
  total_time: number;
  notes?: string;
}

export interface ShopOutputStat {
  date: string;
  total_count: number;
  avg_count: number;
  avg_time: number;
  shop_count: number;
}

export interface ShopOutputFilter {
  date_from?: string;
  date_to?: string;
  shop_id?: number;
  shop_category_id?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface ShopOutputStatFilter {
  date_from?: string;
  date_to?: string;
  shop_category_id?: number;
  group_by?: 'day' | 'week' | 'month';
} 