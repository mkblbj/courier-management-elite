import { API_BASE_URL } from "../constants";
import { getBaseApiUrl } from "@/services/api";
import {
  ShopOutput,
  ShopOutputFormData,
  ShopOutputFilter,
  ShopOutputStats,
  ShopOutputTotal,
  DashboardData,
} from "../types/shop-output";

// 获取API基础URL
const getApiEndpoint = (path: string) => `${getBaseApiUrl()}/api${path}`;

// 使用代理感知的URL构建
const API_URL = getApiEndpoint('/shop-outputs');
const STATS_URL = getApiEndpoint('/stats/shop-outputs');
const DASHBOARD_URL = getApiEndpoint('/dashboard/shop-outputs');

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
export async function createShopOutput(output: ShopOutputFormData): Promise<ShopOutput> {
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
export async function updateShopOutput(id: number | string, output: Partial<ShopOutputFormData>): Promise<ShopOutput> {
  // 记录发送的数据，用于调试
  console.log('更新出力数据，ID:', id);
  console.log('更新出力数据，发送数据:', JSON.stringify(output, null, 2));
  
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(output),
  });
  
  if (!response.ok) {
    // 尝试解析错误响应内容
    let errorMessage = `更新店铺出力数据失败: ${response.statusText}`;
    try {
      const errorData = await response.json();
      console.error('API错误响应:', errorData);
      if (errorData.message) {
        errorMessage = `更新店铺出力数据失败: ${errorData.message}`;
      }
      if (errorData.errors) {
        errorMessage += ` - ${JSON.stringify(errorData.errors)}`;
      }
    } catch (e) {
      console.error('解析错误响应失败:', e);
    }
    throw new Error(errorMessage);
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
export async function deleteShopOutput(id: number | string): Promise<void> {
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
export async function getShopOutputStats(params?: ShopOutputFilter): Promise<ShopOutputStats[]> {
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
  
  const data: ApiResponse<ShopOutputStats[]> = await response.json();
  
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

/**
 * 减少店铺出力数据
 * @param output 减少操作数据
 */
export async function subtractShopOutput(output: {
  shop_id: number;
  courier_id: number;
  output_date: string;
  quantity: number;
  notes?: string;
  original_quantity?: number;
}): Promise<ShopOutput> {
  const response = await fetch(`${API_URL}/subtract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(output),
  });
  
  if (!response.ok) {
    let errorMessage = `减少店铺出力数据失败: ${response.statusText}`;
    try {
      const errorData = await response.json();
      console.error('API错误响应:', errorData);
      if (errorData.message) {
        errorMessage = `减少店铺出力数据失败: ${errorData.message}`;
      }
    } catch (e) {
      console.error('解析错误响应失败:', e);
    }
    throw new Error(errorMessage);
  }
  
  const data: ApiResponse<ShopOutput> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '减少店铺出力数据失败');
  }
  
  return data.data;
}

/**
 * 合单店铺出力数据
 * @param output 合单操作数据
 */
export async function mergeShopOutput(output: {
  shop_id: number;
  courier_id: number;
  output_date: string;
  quantity: number;
  merge_note?: string;
  related_record_id?: number;
}): Promise<ShopOutput> {
  const response = await fetch(`${API_URL}/merge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(output),
  });
  
  if (!response.ok) {
    let errorMessage = `合单店铺出力数据失败: ${response.statusText}`;
    try {
      const errorData = await response.json();
      console.error('API错误响应:', errorData);
      if (errorData.message) {
        errorMessage = `合单店铺出力数据失败: ${errorData.message}`;
      }
    } catch (e) {
      console.error('解析错误响应失败:', e);
    }
    throw new Error(errorMessage);
  }
  
  const data: ApiResponse<ShopOutput> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '合单店铺出力数据失败');
  }
  
  return data.data;
}

/**
 * 获取操作统计数据
 * @param params 查询参数
 */
export async function getOperationStats(params?: {
  date_from?: string;
  date_to?: string;
  shop_id?: number;
  courier_id?: number;
}): Promise<{
  add: { count: number; total_quantity: number };
  subtract: { count: number; total_quantity: number };
  merge: { count: number; total_quantity: number };
  net_growth: number;
}> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const response = await fetch(`${getApiEndpoint('/shop-outputs/stats/operations')}${query}`);
  
  if (!response.ok) {
    throw new Error(`获取操作统计失败: ${response.statusText}`);
  }
  
  const data: ApiResponse<{
    by_type: Array<{
      operation_type: string;
      record_count: string;
      total_quantity: string;
      avg_quantity: string;
    }>;
    net_growth: {
      add_total: number;
      subtract_total: number;
      merge_total: number;
      net_growth: number;
      add_count: number;
      subtract_count: number;
      merge_count: number;
      total_operations: number;
    };
  }> = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || '获取操作统计失败');
  }

  // 转换数据格式以匹配前端期望的结构
  const result = {
    add: { count: data.data.net_growth.add_count, total_quantity: data.data.net_growth.add_total },
    subtract: { count: data.data.net_growth.subtract_count, total_quantity: data.data.net_growth.subtract_total },
    merge: { count: data.data.net_growth.merge_count, total_quantity: data.data.net_growth.merge_total },
    net_growth: data.data.net_growth.net_growth
  };
  
  return result;
} 