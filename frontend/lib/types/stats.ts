/**
 * 店铺类别统计数据类型
 */
export interface CategoryStatsItem {
  category_id: number;
  category_name: string;
  total_quantity: number;
  percentage?: number;
  shops_count: number;
  daily_average?: number;
  
  // 旧字段，兼容旧版本
  change_rate?: number;
  change_type?: 'increase' | 'decrease' | 'unchanged';
  
  // 新增环比字段
  mom_change_rate?: number;  // Month-on-Month 环比变化率
  mom_change_type?: 'increase' | 'decrease' | 'unchanged';
  
  // 新增同比字段
  yoy_change_rate?: number;  // Year-on-Year 同比变化率
  yoy_change_type?: 'increase' | 'decrease' | 'unchanged';
}

/**
 * 按店铺类别统计响应数据
 */
export interface CategoryStatsResponse {
  data: CategoryStatsItem[];
  total: {
    total_quantity: number;
    categories_count: number;
    shops_count: number;
    days_count: number;
  };
}

/**
 * 店铺统计数据类型
 */
export interface ShopStatsItem {
  shop_id: number;
  shop_name: string;
  category_id?: number;
  category_name?: string;
  total_quantity: number;
  percentage?: number;
  daily_average?: number;
  change_rate?: number;
  change_type?: 'increase' | 'decrease' | 'unchanged';
}

/**
 * 按店铺统计响应数据
 */
export interface ShopStatsResponse {
  by_shop: ShopStatsItem[];
  total: {
    total_quantity: number;
    shop_count: number;
  };
}

/**
 * 快递类型统计数据类型
 */
export interface CourierStatsItem {
  courier_id: number;
  courier_name: string;
  total_quantity: number;
  percentage?: number;
  daily_average?: number;
  change_rate?: number;
  change_type?: 'increase' | 'decrease' | 'unchanged';
}

/**
 * 按快递类型统计响应数据
 */
export interface CourierStatsResponse {
  by_courier: CourierStatsItem[];
  total: {
    total_quantity: number;
    courier_count: number;
  };
}

/**
 * 日期统计数据类型
 */
export interface DateStatsItem {
  date: string;
  total_quantity: number;
  percentage?: number;
  distribution?: {
    [key: string]: number | string;
  };
}

/**
 * 按日期统计响应数据
 */
export interface DateStatsResponse {
  by_date: DateStatsItem[];
  total: {
    total_quantity: number;
    date_count: number;
  };
}

/**
 * 统计查询参数
 */
export interface StatsQueryParams {
  date_from?: string;
  date_to?: string;
  shop_id?: number | string;
  courier_id?: number | string;
  category_id?: number | string;
  group_by?: 'day' | 'week' | 'month' | 'year';
  compare_type?: 'month-on-month' | 'year-on-year';
} 