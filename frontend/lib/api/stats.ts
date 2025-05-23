import { getBaseApiUrl } from '@/services/api';
import { API_BASE_URL as CONSTANTS_API_BASE_URL } from "../constants";
import { 
  CategoryStatsItem, 
  ShopStatsItem, 
  CourierStatsItem, 
  DateStatsItem,
  StatsQueryParams,
  ShopStatsResponse
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
export const getShopStats = async (
  params: StatsQueryParams
): Promise<ShopStatsItem[]> => {
  // 构建API请求URL
  const queryString = buildQueryString(params);
  const url = `${API_URL}/shops${queryString}`;
  
  try {
    // 设置加载状态
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return handleApiError(response, '获取店铺统计数据失败');
    }

    const result: ApiResponse<ShopStatsResponse> = await response.json();
    
    if (result.code === 0) {
      // 计算每个店铺的日均数据
      const shopStats = result.data.by_shop.map(shop => {
        // 如果API没有提供daily_average，我们可以在前端计算
        if (!shop.daily_average && params.date_from && params.date_to) {
          try {
            const fromDate = new Date(params.date_from);
            const toDate = new Date(params.date_to);
            const daysDiff = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
            
            return {
              ...shop,
              daily_average: parseFloat((shop.total_quantity / daysDiff).toFixed(2))
            };
          } catch (e) {
            console.warn('计算日均值失败:', e);
            return shop;
          }
        }
        return shop;
      });
      
      return shopStats;
    }
    
    throw new Error(result.message || '获取店铺统计数据失败');
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('获取店铺统计数据超时');
    }
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

/**
 * 快递类型列表项
 */
export interface CourierType {
  id: number;
  name: string;
}

/**
 * 店铺类别列表项
 */
export interface ShopCategory {
  id: number;
  name: string;
}

/**
 * 店铺列表项
 */
export interface Shop {
  id: number;
  name: string;
  category_id?: number;
  category_name?: string;
}

/**
 * 获取快递类型列表
 * @returns 快递类型列表
 */
export const getCourierTypes = async (): Promise<CourierType[]> => {
  try {
    const url = `${getBaseApiUrl()}/api/couriers`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return handleApiError(response, '获取快递类型列表失败');
    }

    const result: ApiResponse<CourierType[]> = await response.json();
    
    if (result.code === 0) {
      return result.data;
    }
    
    throw new Error(result.message || '获取快递类型列表失败');
  } catch (error) {
    console.error('获取快递类型列表异常:', error);
    throw error;
  }
};

/**
 * 获取店铺类别列表
 * @returns 店铺类别列表
 */
export const getShopCategories = async (): Promise<ShopCategory[]> => {
  try {
    const url = `${getBaseApiUrl()}/api/shop-categories`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return handleApiError(response, '获取店铺类别列表失败');
    }

    const result: ApiResponse<ShopCategory[]> = await response.json();
    
    if (result.code === 0) {
      return result.data;
    }
    
    throw new Error(result.message || '获取店铺类别列表失败');
  } catch (error) {
    console.error('获取店铺类别列表异常:', error);
    throw error;
  }
};

/**
 * 获取店铺列表
 * @param categoryId 可选的类别ID筛选
 * @returns 店铺列表
 */
export const getShops = async (categoryId?: number): Promise<Shop[]> => {
  try {
    const queryString = categoryId ? `?category_id=${categoryId}` : '';
    const url = `${getBaseApiUrl()}/api/shops${queryString}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return handleApiError(response, '获取店铺列表失败');
    }

    const result: ApiResponse<Shop[]> = await response.json();
    
    if (result.code === 0) {
      return result.data;
    }
    
    throw new Error(result.message || '获取店铺列表失败');
  } catch (error) {
    console.error('获取店铺列表异常:', error);
    throw error;
  }
}; 