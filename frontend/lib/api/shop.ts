import { Shop, ShopFormData, ShopSortItem } from "../types/shop";
import { API_BASE_URL } from "../constants";
import { getBaseApiUrl } from "@/services/api";

// 使用代理感知的URL构建
const API_URL = `${getBaseApiUrl()}/api/shops`;

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 获取店铺列表
 * @param params 查询参数对象
 */
export const getShops = async (params?: {
  isActive?: boolean;
  categoryId?: number;
  search?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
  withCategory?: boolean;
}): Promise<Shop[]> => {
  const url = new URL(API_URL, window.location.origin);
  
  if (params) {
    if (params.isActive !== undefined) {
      url.searchParams.append('is_active', params.isActive ? '1' : '0');
    }
    
    if (params.categoryId !== undefined) {
      url.searchParams.append('category', String(params.categoryId));
    }
    
    if (params.search) {
      url.searchParams.append('search', params.search);
    }
    
    if (params.sort) {
      url.searchParams.append('sort', params.sort);
    }
    
    if (params.order) {
      url.searchParams.append('order', params.order);
    }
    
    if (params.withCategory) {
      url.searchParams.append('with_category', '1');
    }
  }
  
  try {
    const response = await fetch(url.toString());
    const result = await response.json();
    
    if (result && result.code === 0 && Array.isArray(result.data)) {
      return result.data;
    } else {
      console.error("Error in getShops:", result);
      return [];
    }
  } catch (error) {
    console.error("Exception in getShops:", error);
    return [];
  }
};

// 为兼容性保留原有的函数签名
export const getShopsByActiveStatus = async (
  isActive?: boolean,
  additionalParams?: {
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }
): Promise<Shop[]> => {
  return getShops({
    isActive,
    search: additionalParams?.search,
    sort: additionalParams?.sort,
    order: additionalParams?.order as 'ASC' | 'DESC'
  });
};

/**
 * 获取单个店铺信息
 * @param id 店铺ID
 */
export const getShop = async (id: number): Promise<ApiResponse<Shop>> => {
  const response = await fetch(`${API_URL}/${id}`);
  return await response.json();
};

/**
 * 创建店铺
 * @param shopData 店铺数据
 */
export const createShop = async (data: ShopFormData): Promise<ApiResponse<Shop>> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return await response.json();
};

/**
 * 更新店铺
 * @param id 店铺ID
 * @param shopData 店铺数据
 */
export const updateShop = async (id: number, data: ShopFormData): Promise<ApiResponse<Shop>> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return await response.json();
};

/**
 * 删除店铺
 * @param id 店铺ID
 */
export const deleteShop = async (id: number): Promise<ApiResponse<null>> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    // 特别处理 404 错误（店铺不存在的情况）
    if (response.status === 404 || error.message?.includes('不存在')) {
      throw new Error('店铺不存在');
    }
    
    throw new Error(error.message || '删除店铺失败');
  }
  
  return await response.json();
};

/**
 * 切换店铺状态
 * @param id 店铺ID
 */
export const toggleShopStatus = async (id: number): Promise<ApiResponse<{id: number, is_active: number, name: string}>> => {
  const response = await fetch(`${API_URL}/${id}/toggle`, {
    method: 'POST',
  });
  return await response.json();
};

/**
 * 更新店铺排序
 * @param items 排序项目列表
 */
export const updateShopsSortOrder = async (items: ShopSortItem[]): Promise<ApiResponse<null>> => {
  const response = await fetch(`${API_URL}/sort`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(items),
  });
  return await response.json();
};

// 为兼容性添加别名
export const updateShopSort = updateShopsSortOrder;

/**
 * 检查店铺是否有关联数据
 * @param id 店铺ID
 */
export const checkShopHasRelatedData = async (id: number): Promise<ApiResponse<{hasRelatedData: boolean}>> => {
  // TODO: 这里是临时模拟API调用，需要替换为实际的后端API
  return Promise.resolve({
    code: 0,
    message: '操作成功',
    data: { 
      // 始终返回有关联数据，确保显示警告
      hasRelatedData: true 
    }
  });
}; 