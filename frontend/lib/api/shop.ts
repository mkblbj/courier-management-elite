import { Shop, ShopFormData, ShopSortItem } from "../types/shop";
import { API_BASE_URL } from "../constants";

const API_URL = `${API_BASE_URL}/shops`;

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 获取店铺列表
 * @param isActive 是否只获取启用的店铺
 * @param params 其他查询参数
 */
export const getShops = async (
  isActive?: boolean,
  params?: {
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }
): Promise<Shop[]> => {
  const url = new URL(API_URL, window.location.origin);
  
  if (isActive !== undefined) {
    url.searchParams.append('is_active', String(isActive));
  }
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
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