// 导入环境配置和调试工具
import { useEnvStore, debugLog, debugError } from "@/lib/env-config"

// 获取API基础URL的辅助函数
function getApiBaseUrl(): string {
  // 使用新的getEffectiveApiUrl方法，它会自动处理代理问题
  return useEnvStore.getState().getEffectiveApiUrl()
}

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
interface ApiResponseFormat<T> {
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
}

// 创建快递类型的请求体类型
export interface CreateCourierTypeRequest {
  name: string
  code: string
  remark?: string
  is_active: boolean
}

// 更新快递类型的请求体类型
export interface UpdateCourierTypeRequest {
  name: string
  code: string
  remark?: string
  is_active: boolean
}

// API服务对象
export const api = {
  // 获取快递类型列表
  async getCourierTypes(params?: FilterParams): Promise<CourierType[]> {
    const API_BASE_URL = getApiBaseUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    // 构建查询参数
    const queryParams = new URLSearchParams()
    if (params?.active_only) queryParams.append("active_only", "true")

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return fetchWithErrorHandling<CourierType[]>(`${COURIERS_ENDPOINT}${queryString}`)
  },

  // 获取单个快递类型
  async getCourierType(id: number | string): Promise<CourierType> {
    const API_BASE_URL = getApiBaseUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    return fetchWithErrorHandling<CourierType>(`${COURIERS_ENDPOINT}/${id}`)
  },

  // 创建快递类型
  async createCourierType(data: CreateCourierTypeRequest): Promise<CourierType> {
    const API_BASE_URL = getApiBaseUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    return fetchWithErrorHandling<CourierType>(`${COURIERS_ENDPOINT}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 更新快递类型
  async updateCourierType(id: number | string, data: UpdateCourierTypeRequest): Promise<CourierType> {
    const API_BASE_URL = getApiBaseUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    return fetchWithErrorHandling<CourierType>(`${COURIERS_ENDPOINT}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // 删除快递类型
  async deleteCourierType(id: number | string): Promise<void> {
    const API_BASE_URL = getApiBaseUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    return fetchWithErrorHandling<void>(`${COURIERS_ENDPOINT}/${id}`, {
      method: "DELETE",
    })
  },

  // 切换快递类型状态
  async toggleCourierTypeStatus(id: number | string): Promise<{ id: number | string; is_active: number }> {
    const API_BASE_URL = getApiBaseUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    return fetchWithErrorHandling<{ id: number | string; is_active: number }>(`${COURIERS_ENDPOINT}/${id}/toggle`, {
      method: "PUT",
    })
  },

  // 更新快递类型排序
  async updateCourierTypesOrder(items: { id: number | string; sort_order: number }[]): Promise<void> {
    const API_BASE_URL = getApiBaseUrl()
    const COURIERS_ENDPOINT = `${API_BASE_URL}/api/couriers`

    return fetchWithErrorHandling<void>(`${COURIERS_ENDPOINT}/sort`, {
      method: "POST",
      body: JSON.stringify({ items }),
    })
  },
}
