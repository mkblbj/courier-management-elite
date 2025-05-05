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
  parent_id?: number | string | null
}

// 定义子类型接口，继承自CourierType
export interface ChildCourierType extends CourierType {
  parent_id: number | string
}

// 定义层级结构中的快递类型
export interface CourierTypeHierarchyItem extends CourierType {
  children: CourierType[]
  totalCount: number
}

// 定义子类型查询结果
export interface ChildTypesResult {
  parentType: CourierType
  childTypes: CourierType[]
  totalCount: number
}

// 定义发货记录
export interface ShippingRecord {
  id: number | string
  courier_id: number | string
  courier_name: string
  quantity: number
  date: string
}

// 定义发货记录层级数据
export interface ShippingHierarchyItem {
  id: number | string
  name: string
  parent_id: number | string | null
  children?: CourierType[]
  shipping: {
    own: ShippingRecord[]
    children: ShippingRecord[]
    total: ShippingRecord[]
  }
}

// 定义特定母类型的发货统计
export interface ParentTypeShippingStats {
  courierType: CourierType
  children: CourierType[]
  shipping: {
    own: ShippingRecord[]
    children: ShippingRecord[]
    total: ShippingRecord[]
  }
}

// 创建快递类型的请求体类型
export interface CreateCourierTypeRequest {
  name: string
  code: string
  remark?: string
  is_active: boolean
  parent_id?: number | string
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

  // 获取快递类型层级结构
  async getCourierTypeHierarchy(): Promise<CourierTypeHierarchyItem[]> {
    const API_BASE_URL = getApiBaseUrl()
    const HIERARCHY_ENDPOINT = `${API_BASE_URL}/api/couriers/hierarchy`

    return fetchWithErrorHandling<CourierTypeHierarchyItem[]>(HIERARCHY_ENDPOINT)
  },

  // 获取特定母类型的子类型
  async getChildTypes(parentId: number | string): Promise<ChildTypesResult> {
    const API_BASE_URL = getApiBaseUrl()
    const CHILDREN_ENDPOINT = `${API_BASE_URL}/api/couriers/${parentId}/children`

    return fetchWithErrorHandling<ChildTypesResult>(CHILDREN_ENDPOINT)
  },

  // 获取发货记录层级数据
  async getShippingHierarchy(params?: { date?: string; date_from?: string; date_to?: string }): Promise<ShippingHierarchyItem[]> {
    const API_BASE_URL = getApiBaseUrl()
    const SHIPPING_HIERARCHY_ENDPOINT = `${API_BASE_URL}/api/shipping/hierarchy`

    // 构建查询参数
    const queryParams = new URLSearchParams()
    if (params?.date) queryParams.append("date", params.date)
    if (params?.date_from) queryParams.append("date_from", params.date_from)
    if (params?.date_to) queryParams.append("date_to", params.date_to)
    queryParams.append("includeHierarchy", "true")

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return fetchWithErrorHandling<ShippingHierarchyItem[]>(`${SHIPPING_HIERARCHY_ENDPOINT}${queryString}`)
  },

  // 获取特定母类型的发货统计
  async getParentTypeShippingStats(
    parentId: number | string,
    params?: { date?: string; date_from?: string; date_to?: string }
  ): Promise<ParentTypeShippingStats> {
    const API_BASE_URL = getApiBaseUrl()
    const PARENT_STATS_ENDPOINT = `${API_BASE_URL}/api/shipping/stats/parent/${parentId}`

    // 构建查询参数
    const queryParams = new URLSearchParams()
    if (params?.date) queryParams.append("date", params.date)
    if (params?.date_from) queryParams.append("date_from", params.date_from)
    if (params?.date_to) queryParams.append("date_to", params.date_to)

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return fetchWithErrorHandling<ParentTypeShippingStats>(`${PARENT_STATS_ENDPOINT}${queryString}`)
  },
}
