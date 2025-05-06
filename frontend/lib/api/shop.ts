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
 * @param search 搜索关键词
 * @param sort 排序字段
 * @param order 排序方向
 */
export async function getShops(
  isActive?: boolean,
  search?: string,
  sort: string = "sort_order",
  order: string = "ASC"
): Promise<Shop[]> {
  let url = API_URL;
  const params = new URLSearchParams();

  if (isActive !== undefined) {
    params.append("is_active", isActive ? "1" : "0");
  }
  if (search) {
    params.append("search", search);
  }
  params.append("sort", sort);
  params.append("order", order);

  const paramStr = params.toString();
  if (paramStr) {
    url += `?${paramStr}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`获取店铺列表失败: ${response.status}`);
  }

  const result: ApiResponse<Shop[]> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 获取单个店铺信息
 * @param id 店铺ID
 */
export async function getShop(id: number): Promise<Shop> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`获取店铺信息失败: ${response.status}`);
  }

  const result: ApiResponse<Shop> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 创建店铺
 * @param shopData 店铺数据
 */
export async function createShop(shopData: ShopFormData): Promise<Shop> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(shopData),
  });

  if (!response.ok) {
    throw new Error(`创建店铺失败: ${response.status}`);
  }

  const result: ApiResponse<Shop> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 更新店铺
 * @param id 店铺ID
 * @param shopData 店铺数据
 */
export async function updateShop(id: number, shopData: Partial<ShopFormData>): Promise<Shop> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(shopData),
  });

  if (!response.ok) {
    throw new Error(`更新店铺失败: ${response.status}`);
  }

  const result: ApiResponse<Shop> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 删除店铺
 * @param id 店铺ID
 */
export async function deleteShop(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`删除店铺失败: ${response.status}`);
  }

  const result: ApiResponse<null> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
}

/**
 * 切换店铺状态
 * @param id 店铺ID
 */
export async function toggleShopStatus(id: number): Promise<Shop> {
  const response = await fetch(`${API_URL}/${id}/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`切换店铺状态失败: ${response.status}`);
  }

  const result: ApiResponse<Shop> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 更新店铺排序
 * @param items 排序项目列表
 */
export async function updateShopSort(items: ShopSortItem[]): Promise<void> {
  const response = await fetch(`${API_URL}/sort`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(items),
  });

  if (!response.ok) {
    throw new Error(`更新店铺排序失败: ${response.status}`);
  }

  const result: ApiResponse<null> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
} 