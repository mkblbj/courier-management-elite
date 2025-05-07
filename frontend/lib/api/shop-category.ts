import { ShopCategory } from '@/lib/types/shop';

// 请求基本URL
const API_URL = '/api/shop-categories';

// 标准响应类型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 获取店铺类别列表
export async function getShopCategories(params?: { 
  search?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}): Promise<ShopCategory[]> {
  const queryParams = new URLSearchParams();
  
  if (params?.search) {
    queryParams.append('search', params.search);
  }
  
  if (params?.sort) {
    queryParams.append('sort', params.sort);
  }
  
  if (params?.order) {
    queryParams.append('order', params.order);
  }
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const response = await fetch(`${API_URL}${query}`);
  
  if (!response.ok) {
    throw new Error(`获取店铺类别列表失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<ShopCategory[]> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '获取店铺类别列表失败');
  }
  
  return data.data;
}

// 获取单个店铺类别
export async function getShopCategory(id: number): Promise<ShopCategory> {
  const response = await fetch(`${API_URL}/${id}`);
  
  if (!response.ok) {
    throw new Error(`获取店铺类别失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<ShopCategory> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '获取店铺类别失败');
  }
  
  return data.data;
}

// 创建店铺类别
export async function createShopCategory(
  category: Omit<ShopCategory, 'id' | 'created_at' | 'updated_at'>
): Promise<ShopCategory> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(category),
  });
  
  if (!response.ok) {
    throw new Error(`创建店铺类别失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<ShopCategory> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '创建店铺类别失败');
  }
  
  return data.data;
}

// 更新店铺类别
export async function updateShopCategory(
  id: number,
  category: Partial<Omit<ShopCategory, 'id' | 'created_at' | 'updated_at'>>
): Promise<ShopCategory> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(category),
  });
  
  if (!response.ok) {
    throw new Error(`更新店铺类别失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<ShopCategory> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '更新店铺类别失败');
  }
  
  return data.data;
}

// 删除店铺类别
export async function deleteShopCategory(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`删除店铺类别失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<void> = await response.json();
  
  if (data.code !== 0) {
    // 如果错误信息包含"关联"，则是因为该类别已被关联到店铺
    throw new Error(data.message || '删除店铺类别失败');
  }
}

// 更新类别排序
export async function updateCategorySort(
  categories: { id: number; sort_order: number }[]
): Promise<void> {
  const response = await fetch(`${API_URL}/sort`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderData: categories }),
  });
  
  if (!response.ok) {
    throw new Error(`更新类别排序失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<void> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '更新类别排序失败');
  }
} 