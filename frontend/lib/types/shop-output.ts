export interface ShopOutput {
  id: number;
  shop_id: number;
  courier_id: number;
  output_date: string;
  quantity: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  shop_name?: string;
  courier_name?: string;
  category_name?: string;
  operation_type?: 'add' | 'subtract' | 'merge';
  original_quantity?: number;
  merge_note?: string;
  related_record_id?: number;
}

export interface ShopOutputFormData {
  shop_id: number;
  courier_id: number;
  output_date: string;
  quantity: number;
  notes?: string;
  operation_type?: 'add' | 'subtract' | 'merge';
  original_quantity?: number;
  merge_note?: string;
  related_record_id?: number;
}

export interface ShopOutputFilter {
  shop_id?: number;
  courier_id?: number;
  date_from?: string;
  date_to?: string;
  output_date?: string;
  search?: string;
  category_id?: number;
}

export interface ShopOutputStats {
  shop_id?: number;
  shop_name?: string;
  courier_id?: number;
  courier_name?: string;
  output_date?: string;
  total_quantity: number;
  days_count?: number;
  shops_count?: number;
  couriers_count?: number;
}

export interface ShopOutputTotal {
  total_quantity: number;
  average_daily: number;
  days_count: number;
  shops_count: number;
  couriers_count: number;
}

export interface DashboardShopData {
  shop_id: number;
  shop_name: string;
  has_data?: boolean;
  total_quantity?: number;
  couriers?: {
    courier_id: number;
    courier_name: string;
    predicted_quantity?: number;
  }[];
}

export interface DashboardData {
  date: string;
  total_quantity: number;
  total_predicted_quantity?: number;
  shops_count: number;
  active_shops_count?: number;
  predicted_shops_count?: number;
  coverage_rate: number;
  couriers_data: {
    courier_id: number;
    courier_name: string;
    total_quantity: number;
    shops_count: number;
  }[];
  shops_data: DashboardShopData[];
  raw_predictions?: {
    shop_id: number;
    shop_name: string;
    courier_id: number;
    courier_name: string;
    predicted_quantity: number;
    days_count: number;
  }[];
} 