// 导入环境配置和调试工具
import { useEnvStore, debugLog, debugError } from "@/lib/env-config"
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 环境变量控制是否使用代理
const useProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === 'true';

// 基础 URL
const baseApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// 代理基础 URL
const proxyBaseURL = '/api/proxy';

// 获取API基础URL的辅助函数
export const getBaseApiUrl = (path: string = ''): string => {
  // 根据环境变量决定是否使用代理
  if (useProxy) {
    // 使用代理模式
    return `${proxyBaseURL}${path}`;
  } else {
    // 直接请求模式
    return `${baseApiUrl}${path}`;
  }
};

// 导出一个用于判断是否使用代理的辅助函数
export const isUsingProxy = (): boolean => {
  return useProxy;
};

/**
 * 创建 API 客户端实例
 */
export const createApiClient = (config?: AxiosRequestConfig): AxiosInstance => {
  // 获取当前的基础URL（代理或直连）
  const currentBaseURL = useProxy ? proxyBaseURL : baseApiUrl;

  const axiosConfig: AxiosRequestConfig = {
    ...config,
    baseURL: currentBaseURL,
    timeout: 30000, // 默认超时时间
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers,
    },
  };

  const instance = axios.create(axiosConfig);

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        debugLog(`API请求: ${config.method?.toUpperCase()} ${config.url}`, config);
      }
      return config;
    },
    (error) => {
      debugError('API请求错误:', error);
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        debugLog(`API响应: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
      }
      return response.data;
    },
    (error) => {
      if (error.response) {
        // 服务器返回错误
        debugError('API响应错误:', error.response.data);
        return Promise.reject(error.response.data);
      } else if (error.request) {
        // 请求已发送但未收到响应
        debugError('未收到API响应:', error.request);
        return Promise.reject({ code: -1, message: '网络错误，服务器未响应' });
      } else {
        // 请求设置时出错
        debugError('请求配置错误:', error.message);
        return Promise.reject({ code: -1, message: '请求配置错误' });
      }
    }
  );

  return instance;
};

// 默认API客户端实例
export const apiClient = createApiClient();

// 通用的请求处理函数
async function fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
  // 获取当前环境配置 - 确保每次请求都获取最新配置
  const envConfig = useEnvStore.getState()

  const method = options?.method || "GET"

  // 使用当前环境的调试设置
  if (envConfig.debug) {
    debugLog(`API请求: ${method} ${url}`, options?.body ? { body: options.body } : "")
  }

  try {
    debugLog(`尝试请求: ${method} ${url}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      debugError(`API响应错误: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }

    const responseData = (await response.json()) as ApiResponseFormat<T>

    // 使用当前环境的调试设置
    if (envConfig.debug) {
      debugLog(`API响应: ${method} ${url}`, responseData)
    }

    // 检查API响应中的code字段
    if (responseData.code !== 0) {
      const errorMessage = responseData.message || "API请求失败"
      debugError(`API业务错误: ${errorMessage}`)
      throw new Error(errorMessage)
    }

    return responseData.data
  } catch (error) {
    // 使用当前环境的调试设置
    if (envConfig.debug) {
      debugError(`API响应错误: ${method} ${url}`, error)
    }
    debugError(`请求失败: ${url}`, error)
    throw error
  }
}

// 定义API响应格式
export interface ApiResponseFormat<T> {
  code: number
  message: string
  data: T
}

// 定义分页参数类型
export interface PaginationParams {
  page?: number
  pageSize?: number
}

// 定义筛选参数类型
export interface FilterParams {
  active_only?: boolean
  search?: string
}

// 定义CourierType类型，匹配API返回的字段
export interface CourierType {
  id: number | string
  name: string
  code: string
  remark?: string
  is_active: number | boolean
  sort_order: number
  created_at?: string
  updated_at?: string
  category_id?: number | string | null
}

// 定义快递类别接口
export interface CourierCategory {
  id: number | string
  name: string
  sort_order: number
  created_at?: string
  updated_at?: string
}

// 定义发货记录
export interface ShippingRecord {
  id: number | string
  courier_id: number | string
  courier_name: string
  quantity: number
  date: string
}

// 创建快递类型的请求体类型
export interface CreateCourierTypeRequest {
  name: string
  code: string
  remark?: string
  is_active: boolean
  category_id?: number | string
}

// 更新快递类型的请求体类型
export interface UpdateCourierTypeRequest {
  name: string
  code: string
  remark?: string
  is_active: boolean
  category_id?: number | string
}

// API服务对象
export const api = {
  // 获取快递类型列表
  async getCourierTypes(params?: FilterParams): Promise<CourierType[]> {
    const API_BASE_URL = getBaseApiUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    // 构建查询参数
    const queryParams = new URLSearchParams()
    if (params?.active_only) queryParams.append("active_only", "true")
    if (params?.search) queryParams.append("search", params.search)

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return fetchWithErrorHandling<CourierType[]>(`${COURIERS_ENDPOINT}${queryString}`)
  },

  // 获取快递类别列表
  async getCourierCategories(): Promise<CourierCategory[]> {
    const API_BASE_URL = getBaseApiUrl()
    const CATEGORIES_ENDPOINT = `${API_BASE_URL}/api/courier-categories`

    return fetchWithErrorHandling<CourierCategory[]>(CATEGORIES_ENDPOINT, {
      method: "GET",
    })
  },

  // 获取单个快递类别
  async getCourierCategory(id: number | string): Promise<CourierCategory> {
    const API_BASE_URL = getBaseApiUrl()
    const CATEGORIES_ENDPOINT = `${API_BASE_URL}/api/courier-categories`

    return fetchWithErrorHandling<CourierCategory>(`${CATEGORIES_ENDPOINT}/${id}`)
  },

  // 创建快递类别
  async createCourierCategory(data: { name: string; sort_order?: number }): Promise<CourierCategory> {
    const API_BASE_URL = getBaseApiUrl()
    const CATEGORIES_ENDPOINT = `${API_BASE_URL}/api/courier-categories`

    return fetchWithErrorHandling<CourierCategory>(CATEGORIES_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 更新快递类别
  async updateCourierCategory(id: number | string, data: { name: string; sort_order?: number }): Promise<CourierCategory> {
    const API_BASE_URL = getBaseApiUrl()
    const CATEGORIES_ENDPOINT = `${API_BASE_URL}/api/courier-categories`

    return fetchWithErrorHandling<CourierCategory>(`${CATEGORIES_ENDPOINT}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // 删除快递类别
  async deleteCourierCategory(id: number | string): Promise<void> {
    const API_BASE_URL = getBaseApiUrl()
    const CATEGORIES_ENDPOINT = `${API_BASE_URL}/api/courier-categories`

    return fetchWithErrorHandling<void>(`${CATEGORIES_ENDPOINT}/${id}`, {
      method: "DELETE",
    })
  },

  // 更新快递类别排序
  async updateCourierCategoriesOrder(items: { id: number | string; sort_order: number }[]): Promise<void> {
    const API_BASE_URL = getBaseApiUrl()
    const CATEGORIES_ENDPOINT = `${API_BASE_URL}/api/courier-categories`

    return fetchWithErrorHandling<void>(`${CATEGORIES_ENDPOINT}/sort`, {
      method: "POST",
      body: JSON.stringify({ items }),
    })
  },

  // 获取单个快递类型
  async getCourierType(id: number | string): Promise<CourierType> {
    const API_BASE_URL = getBaseApiUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    return fetchWithErrorHandling<CourierType>(`${COURIERS_ENDPOINT}/${id}`)
  },

  // 创建快递类型
  async createCourierType(data: CreateCourierTypeRequest): Promise<CourierType> {
    const API_BASE_URL = getBaseApiUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    return fetchWithErrorHandling<CourierType>(`${COURIERS_ENDPOINT}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 更新快递类型
  async updateCourierType(id: number | string, data: UpdateCourierTypeRequest): Promise<CourierType> {
    const API_BASE_URL = getBaseApiUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    return fetchWithErrorHandling<CourierType>(`${COURIERS_ENDPOINT}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // 删除快递类型
  async deleteCourierType(id: number | string): Promise<void> {
    const API_BASE_URL = getBaseApiUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    return fetchWithErrorHandling<void>(`${COURIERS_ENDPOINT}/${id}`, {
      method: "DELETE",
    })
  },

  // 切换快递类型状态
  async toggleCourierTypeStatus(id: number | string): Promise<{ id: number | string; is_active: number }> {
    const API_BASE_URL = getBaseApiUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    return fetchWithErrorHandling<{ id: number | string; is_active: number }>(`${COURIERS_ENDPOINT}/${id}/toggle`, {
      method: "PUT",
    })
  },

  // 更新快递类型排序
  async updateCourierTypesOrder(items: { id: number | string; sort_order: number }[]): Promise<void> {
    const API_BASE_URL = getBaseApiUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    return fetchWithErrorHandling<void>(`${COURIERS_ENDPOINT}/sort`, {
      method: "POST",
      body: JSON.stringify({ items }),
    })
  },

  // 更新快递类别排序
  async updateCourierCategorySort(items: { id: number | string; sort_order: number }[]): Promise<void> {
    const API_BASE_URL = getBaseApiUrl()
    const CATEGORIES_ENDPOINT = `${API_BASE_URL}/api/courier-categories`

    return fetchWithErrorHandling<void>(`${CATEGORIES_ENDPOINT}/sort`, {
      method: "POST",
      body: JSON.stringify({ items }),
    })
  }
}
