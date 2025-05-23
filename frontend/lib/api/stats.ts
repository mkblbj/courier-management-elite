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

// 数据预取缓存
class DataPrefetchCache {
  private cache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>();
  private readonly TTL = 3 * 60 * 1000; // 3分钟缓存

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  setPromise(key: string, promise: Promise<any>): void {
    this.cache.set(key, {
      data: null,
      timestamp: Date.now(),
      promise
    });
  }

  getPromise(key: string): Promise<any> | null {
    const entry = this.cache.get(key);
    return entry?.promise || null;
  }

  clear(): void {
    this.cache.clear();
  }
}

const prefetchCache = new DataPrefetchCache();

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
 * 生成缓存键
 */
const generateCacheKey = (endpoint: string, params: any) => {
  return `${endpoint}_${JSON.stringify(params)}`;
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
 * 通用的API请求函数，支持缓存和预取
 */
const fetchWithCache = async <T>(
  endpoint: string, 
  params: any, 
  useCache: boolean = true
): Promise<T> => {
  const cacheKey = generateCacheKey(endpoint, params);
  
  // 检查缓存
  if (useCache) {
    const cached = prefetchCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 检查是否有正在进行的请求
    const existingPromise = prefetchCache.getPromise(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }
  }

  const queryString = buildQueryString(params);
  const url = `${API_URL}${endpoint}${queryString}`;
  
  const fetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        return handleApiError(response, `获取${endpoint}数据失败`);
      }

      const result: ApiResponse<T> = await response.json();
      
      if (result.code === 0 && result.data !== undefined && result.data !== null) {
        // 缓存结果
        prefetchCache.set(cacheKey, result.data);
        return result.data;
      }
      
      throw new Error(result.message || `获取${endpoint}数据失败`);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`获取${endpoint}数据超时`);
      }
      console.error(`API请求失败 [${endpoint}]:`, error);
      throw error;
    }
  })();

  // 缓存Promise
  if (useCache) {
    prefetchCache.setPromise(cacheKey, fetchPromise);
  }

  return fetchPromise;
};

/**
 * 数据预取函数
 */
export const prefetchStatsData = async (
  dimension: 'category' | 'shop' | 'courier',
  params: StatsQueryParams
): Promise<void> => {
  try {
    const endpoints = {
      category: '/categories',
      shop: '/shops',
      courier: '/couriers'
    };

    const endpoint = endpoints[dimension];
    if (endpoint) {
      // 异步预取，不等待结果
      fetchWithCache(endpoint, params, true).catch(error => {
        console.warn(`预取${dimension}数据失败:`, error);
      });
    }
  } catch (error) {
    console.warn('数据预取失败:', error);
  }
};

/**
 * 批量获取多个维度的数据
 */
export const getBatchStatsData = async (
  requests: Array<{
    dimension: 'category' | 'shop' | 'courier';
    params: StatsQueryParams;
  }>
): Promise<{
  categories?: CategoryStatsItem[];
  shops?: ShopStatsItem[];
  couriers?: CourierStatsItem[];
}> => {
  const results: any = {};
  
  try {
    const promises = requests.map(async ({ dimension, params }) => {
      const endpoints = {
        category: '/categories',
        shop: '/shops',
        courier: '/couriers'
      };

      const endpoint = endpoints[dimension];
      if (endpoint) {
        const data = await fetchWithCache(endpoint, params);
        return { dimension, data };
      }
      return null;
    });

    const responses = await Promise.allSettled(promises);
    
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled' && response.value) {
        const { dimension, data } = response.value;
        if (dimension === 'category') results.categories = data;
        else if (dimension === 'shop') results.shops = data;
        else if (dimension === 'courier') results.couriers = data;
      } else if (response.status === 'rejected') {
        console.warn(`批量请求失败 (${requests[index].dimension}):`, response.reason);
      }
    });
  } catch (error) {
    console.error('批量获取数据失败:', error);
  }

  return results;
};

/**
 * 获取按店铺类别统计的出力数据
 * @param params 查询参数
 * @returns 按类别统计的数据
 */
export const getCategoryStats = async (
  params: Pick<StatsQueryParams, 'date_from' | 'date_to' | 'courier_id'>
): Promise<CategoryStatsItem[]> => {
  return fetchWithCache<CategoryStatsItem[]>('/categories', params);
};

/**
 * 获取按店铺统计的出力数据
 * @param params 查询参数
 * @returns 按店铺统计的数据
 */
export const getShopStats = async (
  params: StatsQueryParams
): Promise<ShopStatsItem[]> => {
  const data = await fetchWithCache<any>('/shops', params);
  
  // 检查数据结构 - API可能直接返回数组或包装在对象中
  let shopDataArray: any[];
  
  if (Array.isArray(data)) {
    // API直接返回数组
    shopDataArray = data;
  } else if (data && data.by_shop && Array.isArray(data.by_shop)) {
    // API返回包装对象
    shopDataArray = data.by_shop;
  } else {
    console.warn('API返回的数据结构不正确:', data);
    return [];
  }
  
  // 转换和标准化数据
  const shopStats: ShopStatsItem[] = shopDataArray.map(shop => {
    // 确保total_quantity是数字类型
    const totalQuantity = typeof shop.total_quantity === 'string' 
      ? parseInt(shop.total_quantity, 10) 
      : shop.total_quantity;
    
    // 计算daily_average
    let dailyAverage = shop.daily_average;
    if (!dailyAverage && shop.days_count && shop.days_count > 0) {
      dailyAverage = parseFloat((totalQuantity / shop.days_count).toFixed(2));
    } else if (!dailyAverage && params.date_from && params.date_to) {
      try {
        const fromDate = new Date(params.date_from);
        const toDate = new Date(params.date_to);
        const daysDiff = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        dailyAverage = parseFloat((totalQuantity / daysDiff).toFixed(2));
      } catch (e) {
        console.warn('计算日均值失败:', e);
        dailyAverage = 0;
      }
    }
    
    return {
      shop_id: shop.shop_id,
      shop_name: shop.shop_name,
      category_id: shop.category_id,
      category_name: shop.category_name,
      total_quantity: totalQuantity,
      daily_average: dailyAverage || 0,
      percentage: shop.percentage,
      courier_distribution: shop.courier_distribution,
      change_rate: shop.change_rate,
      change_type: shop.change_type,
      mom_change_rate: shop.mom_change_rate,
      mom_change_type: shop.mom_change_type,
      yoy_change_rate: shop.yoy_change_rate,
      yoy_change_type: shop.yoy_change_type,
    } as ShopStatsItem;
  });
  
  return shopStats;
};

/**
 * 获取按快递类型统计的出力数据
 * @param params 查询参数
 * @returns 按快递类型统计的数据
 */
export const getCourierStats = async (
  params: Pick<StatsQueryParams, 'date_from' | 'date_to' | 'shop_id' | 'category_id'>
): Promise<CourierStatsItem[]> => {
  return fetchWithCache<CourierStatsItem[]>('/couriers', params);
};

/**
 * 获取按日期统计的出力数据
 * @param params 查询参数
 * @returns 按日期统计的数据
 */
export const getDateStats = async (params: StatsQueryParams): Promise<DateStatsItem[]> => {
  return fetchWithCache<DateStatsItem[]>('/dates', params);
};

/**
 * 清除统计数据缓存
 */
export const clearStatsCache = (): void => {
  prefetchCache.clear();
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