import { getBaseApiUrl } from '@/services/api';
import { API_BASE_URL as CONSTANTS_API_BASE_URL } from "../constants";
import { 
  CategoryStatsItem, 
  ShopStatsItem, 
  CourierStatsItem, 
  DateStatsItem,
  StatsQueryParams
} from '@/lib/types/stats';

// API响应格式
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 使用代理感知的URL构建
const API_URL = `${getBaseApiUrl()}/api/stats/shop-outputs`;

/**
 * 构建查询字符串
 * @param params 查询参数对象
 * @returns 查询字符串
 */
const buildQueryString = (params: Record<string, any>) => {
  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return query ? `?${query}` : '';
};

/**
 * 处理API错误响应
 * @param response Fetch响应对象
 * @param errorMessage 默认错误消息
 */
const handleApiError = async (response: Response, errorMessage: string): Promise<never> => {
  try {
    const errorData = await response.json();
    throw new Error(errorData.message || errorMessage);
  } catch (e) {
    throw new Error(`${errorMessage}: ${response.status} ${response.statusText}`);
  }
};

/**
 * 获取按店铺类别统计的出力数据
 * @param params 查询参数
 * @returns 按类别统计的数据
 */
export const getCategoryStats = async (params: Pick<StatsQueryParams, 'date_from' | 'date_to' | 'courier_id'>): Promise<CategoryStatsItem[]> => {
  const queryString = buildQueryString(params);
  const url = `${API_URL}/categories${queryString}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return handleApiError(response, '获取类别统计数据失败');
    }

    const result: ApiResponse<CategoryStatsItem[]> = await response.json();
    
    if (result.code === 0) {
      return result.data;
    }
    
    throw new Error(result.message || '获取类别统计数据失败');
  } catch (error) {
    console.error('获取类别统计数据异常:', error);
    throw error;
  }
};

/**
 * 获取按店铺统计的出力数据
 * @param params 查询参数
 * @returns 按店铺统计的数据
 */
export const getShopStats = async (params: Pick<StatsQueryParams, 'date_from' | 'date_to' | 'courier_id' | 'category_id'>): Promise<ShopStatsItem[]> => {
  const queryString = buildQueryString(params);
  const url = `${API_URL}/shops${queryString}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return handleApiError(response, '获取店铺统计数据失败');
    }

    const result: ApiResponse<ShopStatsItem[]> = await response.json();
    
    if (result.code === 0) {
      return result.data;
    }
    
    throw new Error(result.message || '获取店铺统计数据失败');
  } catch (error) {
    console.error('获取店铺统计数据异常:', error);
    throw error;
  }
};

/**
 * 获取按快递类型统计的出力数据
 * @param params 查询参数
 * @returns 按快递类型统计的数据
 */
export const getCourierStats = async (params: Pick<StatsQueryParams, 'date_from' | 'date_to' | 'shop_id' | 'category_id'>): Promise<CourierStatsItem[]> => {
  const queryString = buildQueryString(params);
  const url = `${API_URL}/couriers${queryString}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return handleApiError(response, '获取快递类型统计数据失败');
    }

    const result: ApiResponse<CourierStatsItem[]> = await response.json();
    
    if (result.code === 0) {
      return result.data;
    }
    
    throw new Error(result.message || '获取快递类型统计数据失败');
  } catch (error) {
    console.error('获取快递类型统计数据异常:', error);
    throw error;
  }
};

/**
 * 获取按日期统计的出力数据
 * @param params 查询参数
 * @returns 按日期统计的数据
 */
export const getDateStats = async (params: StatsQueryParams): Promise<DateStatsItem[]> => {
  const queryString = buildQueryString(params);
  const url = `${API_URL}/dates${queryString}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return handleApiError(response, '获取日期统计数据失败');
    }

    const result: ApiResponse<DateStatsItem[]> = await response.json();
    
    if (result.code === 0) {
      return result.data;
    }
    
    throw new Error(result.message || '获取日期统计数据失败');
  } catch (error) {
    console.error('获取日期统计数据异常:', error);
    throw error;
  }
}; 