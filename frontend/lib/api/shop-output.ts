import { API_BASE_URL } from "../constants";
import {
  ShopOutput,
  ShopOutputFormData,
  ShopOutputFilter,
  ShopOutputStats,
  ShopOutputTotal,
  DashboardData,
} from "../types/shop-output";

const API_URL = `${API_BASE_URL}/shop-outputs`;
const STATS_URL = `${API_BASE_URL}/stats/shop-outputs`;
const DASHBOARD_URL = `${API_BASE_URL}/dashboard/shop-outputs`;

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 获取出力数据列表
 * @param filter 筛选条件
 */
export async function getShopOutputs(filter?: ShopOutputFilter): Promise<ShopOutput[]> {
  let url = API_URL;
  
  if (filter) {
    const params = new URLSearchParams();
    
    if (filter.shop_id !== undefined) {
      params.append("shop_id", filter.shop_id.toString());
    }
    
    if (filter.courier_id !== undefined) {
      params.append("courier_id", filter.courier_id.toString());
    }
    
    if (filter.date_from) {
      params.append("date_from", filter.date_from);
    }
    
    if (filter.date_to) {
      params.append("date_to", filter.date_to);
    }
    
    if (filter.search) {
      params.append("search", filter.search);
    }
    
    const paramStr = params.toString();
    if (paramStr) {
      url += `?${paramStr}`;
    }
  }
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`获取出力数据失败: ${response.status}`);
  }
  
  const result: ApiResponse<ShopOutput[]> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 获取单条出力记录
 * @param id 出力记录ID
 */
export async function getShopOutput(id: number): Promise<ShopOutput> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`获取出力记录失败: ${response.status}`);
  }
  
  const result: ApiResponse<ShopOutput> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 创建出力记录
 * @param data 出力数据
 */
export async function createShopOutput(data: ShopOutputFormData): Promise<ShopOutput> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`创建出力记录失败: ${response.status}`);
  }
  
  const result: ApiResponse<ShopOutput> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 更新出力记录
 * @param id 出力记录ID
 * @param data 出力数据
 */
export async function updateShopOutput(id: number, data: ShopOutputFormData): Promise<ShopOutput> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`更新出力记录失败: ${response.status}`);
  }
  
  const result: ApiResponse<ShopOutput> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 删除出力记录
 * @param id 出力记录ID
 */
export async function deleteShopOutput(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`删除出力记录失败: ${response.status}`);
  }
  
  const result: ApiResponse<null> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
}

/**
 * 获取今日出力数据
 */
export async function getTodayOutputs(): Promise<ShopOutput[]> {
  const response = await fetch(`${API_URL}/today`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`获取今日出力数据失败: ${response.status}`);
  }
  
  const result: ApiResponse<ShopOutput[]> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 获取按店铺统计的出力数据
 * @param dateFrom 开始日期 (YYYY-MM-DD)
 * @param dateTo 结束日期 (YYYY-MM-DD)
 */
export async function getShopStats(dateFrom?: string, dateTo?: string): Promise<ShopOutputStats[]> {
  let url = `${STATS_URL}/shops`;
  const params = new URLSearchParams();
  
  if (dateFrom) {
    params.append("date_from", dateFrom);
  }
  
  if (dateTo) {
    params.append("date_to", dateTo);
  }
  
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
    throw new Error(`获取店铺统计数据失败: ${response.status}`);
  }
  
  const result: ApiResponse<ShopOutputStats[]> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 获取按快递类型统计的出力数据
 * @param dateFrom 开始日期 (YYYY-MM-DD)
 * @param dateTo 结束日期 (YYYY-MM-DD)
 */
export async function getCourierStats(dateFrom?: string, dateTo?: string): Promise<ShopOutputStats[]> {
  let url = `${STATS_URL}/couriers`;
  const params = new URLSearchParams();
  
  if (dateFrom) {
    params.append("date_from", dateFrom);
  }
  
  if (dateTo) {
    params.append("date_to", dateTo);
  }
  
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
    throw new Error(`获取快递类型统计数据失败: ${response.status}`);
  }
  
  const result: ApiResponse<ShopOutputStats[]> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 获取按日期统计的出力数据
 * @param dateFrom 开始日期 (YYYY-MM-DD)
 * @param dateTo 结束日期 (YYYY-MM-DD)
 */
export async function getDateStats(dateFrom?: string, dateTo?: string): Promise<ShopOutputStats[]> {
  let url = `${STATS_URL}/dates`;
  const params = new URLSearchParams();
  
  if (dateFrom) {
    params.append("date_from", dateFrom);
  }
  
  if (dateTo) {
    params.append("date_to", dateTo);
  }
  
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
    throw new Error(`获取日期统计数据失败: ${response.status}`);
  }
  
  const result: ApiResponse<ShopOutputStats[]> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 获取出力总计数据
 * @param dateFrom 开始日期 (YYYY-MM-DD)
 * @param dateTo 结束日期 (YYYY-MM-DD)
 */
export async function getTotalStats(dateFrom?: string, dateTo?: string): Promise<ShopOutputTotal> {
  let url = `${STATS_URL}/total`;
  const params = new URLSearchParams();
  
  if (dateFrom) {
    params.append("date_from", dateFrom);
  }
  
  if (dateTo) {
    params.append("date_to", dateTo);
  }
  
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
    throw new Error(`获取总计统计数据失败: ${response.status}`);
  }
  
  const result: ApiResponse<ShopOutputTotal> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 获取今日出力概览
 */
export async function getTodayDashboard(): Promise<DashboardData> {
  const response = await fetch(`${DASHBOARD_URL}/today`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`获取今日出力概览失败: ${response.status}`);
  }
  
  const result: ApiResponse<DashboardData> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
}

/**
 * 获取明日出力数据
 */
export async function getTomorrowDashboard(): Promise<DashboardData> {
  const response = await fetch(`${DASHBOARD_URL}/tomorrow`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`获取明日出力数据失败: ${response.status}`);
  }
  
  const result: ApiResponse<DashboardData> = await response.json();
  
  if (result.code !== 0) {
    throw new Error(`API错误: ${result.message}`);
  }
  
  return result.data;
} 