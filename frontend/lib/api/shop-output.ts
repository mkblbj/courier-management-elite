import { API_BASE_URL } from "../constants";
import {
  ShopOutput,
  ShopOutputFormData,
  ShopOutputFilter,
  ShopOutputStats,
  ShopOutputTotal,
  DashboardData,
  ShopOutputForm,
  ShopOutputStat,
  ShopOutputStatFilter,
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
 * 获取店铺出力数据列表
 * @param params 查询参数
 */
export async function getShopOutputs(params?: ShopOutputFilter): Promise<ShopOutput[]> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const response = await fetch(`${API_URL}${query}`);
  
  if (!response.ok) {
    throw new Error(`获取店铺出力数据失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<ShopOutput[]> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '获取店铺出力数据失败');
  }
  
  return data.data;
}

/**
 * 获取单个店铺出力数据
 * @param id 出力数据ID
 */
export async function getShopOutput(id: number): Promise<ShopOutput> {
  const response = await fetch(`${API_URL}/${id}`);
  
  if (!response.ok) {
    throw new Error(`获取店铺出力数据失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<ShopOutput> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '获取店铺出力数据失败');
  }
  
  return data.data;
}

/**
 * 创建店铺出力数据
 * @param output 出力数据
 */
export async function createShopOutput(output: ShopOutputForm): Promise<ShopOutput> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(output),
  });
  
  if (!response.ok) {
    throw new Error(`创建店铺出力数据失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<ShopOutput> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '创建店铺出力数据失败');
  }
  
  return data.data;
}

/**
 * 更新店铺出力数据
 * @param id 出力数据ID
 * @param output 出力数据
 */
export async function updateShopOutput(id: number, output: Partial<ShopOutputForm>): Promise<ShopOutput> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(output),
  });
  
  if (!response.ok) {
    throw new Error(`更新店铺出力数据失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<ShopOutput> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '更新店铺出力数据失败');
  }
  
  return data.data;
}

/**
 * 删除店铺出力数据
 * @param id 出力数据ID
 */
export async function deleteShopOutput(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`删除店铺出力数据失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<void> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '删除店铺出力数据失败');
  }
}

/**
 * 批量导入店铺出力数据
 * @param file Excel文件
 */
export async function importShopOutputs(file: File): Promise<{success: number; failed: number}> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/import`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`导入店铺出力数据失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<{success: number; failed: number}> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '导入店铺出力数据失败');
  }
  
  return data.data;
}

/**
 * 导出店铺出力数据
 * @param params 查询参数
 */
export async function exportShopOutputs(params?: ShopOutputFilter): Promise<Blob> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const response = await fetch(`${API_URL}/export${query}`, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`导出店铺出力数据失败: ${response.statusText}`);
  }
  
  return await response.blob();
}

/**
 * 获取店铺出力统计数据
 * @param params 查询参数
 */
export async function getShopOutputStats(params?: ShopOutputStatFilter): Promise<ShopOutputStat[]> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const response = await fetch(`${STATS_URL}${query}`);
  
  if (!response.ok) {
    throw new Error(`获取店铺出力统计数据失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<ShopOutputStat[]> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '获取店铺出力统计数据失败');
  }
  
  return data.data;
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