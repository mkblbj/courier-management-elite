import { API_BASE_URL } from "../constants";

export interface Courier {
  id: number;
  name: string;
  code: string;
  remark?: string;
  is_active: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 获取快递类型列表
 * @param isActive 是否只获取启用的快递类型
 * @param params 其他查询参数
 */
export const getCouriers = async (
  isActive?: boolean,
  params?: {
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }
): Promise<Courier[]> => {
  const url = new URL(`${API_BASE_URL}/couriers`, window.location.origin);
  
  if (isActive !== undefined) {
    url.searchParams.append('status', isActive ? 'active' : 'inactive');
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
      console.error("Error in getCouriers:", result);
      return [];
    }
  } catch (error) {
    console.error("Exception in getCouriers:", error);
    return [];
  }
};

/**
 * 获取单个快递类型信息
 * @param id 快递类型ID
 */
export const getCourier = async (id: number): Promise<ApiResponse<Courier>> => {
  const response = await fetch(`${API_BASE_URL}/couriers/${id}`);
  return await response.json();
}; 