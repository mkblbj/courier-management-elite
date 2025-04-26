// 导入环境配置和调试工具
import { useEnvStore, debugLog, debugError, debugWarn } from "@/lib/env-config"

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
      const errorData = await response.json().catch(() => null)
      debugError(`API响应错误: ${response.status} ${response.statusText}`, errorData || "")
      
      // 尝试从错误响应中提取有用的错误信息
      if (errorData && !errorData.success) {
        if (errorData.errors && Object.keys(errorData.errors).length > 0) {
          // 获取第一个错误字段的错误信息
          const firstErrorField = Object.keys(errorData.errors)[0]
          const errorMessage = errorData.errors[firstErrorField]
          throw new Error(errorMessage || "API请求失败")
        } else if (errorData.message) {
          throw new Error(errorData.message)
        }
      }
      
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }

    const responseData = (await response.json()) as ApiResponseFormat<T>

    // 使用当前环境的调试设置
    if (envConfig.debug) {
      debugLog(`API响应: ${method} ${url}`, responseData)
    }

    // 检查API响应中的success字段
    if (!responseData.success) {
      const errorMessage = responseData.message || "API请求失败"
      debugError(`API业务错误: ${errorMessage}`, responseData.errors || {})
      throw new Error(errorMessage)
    }

    return responseData.data as T
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
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string>
}

// 定义分页参数类型
export interface PaginationParams {
  page?: number
  perPage?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
}

// 定义筛选参数类型
export interface ShippingFilterParams extends PaginationParams {
  date?: string
  date_from?: string
  date_to?: string
  startDate?: string
  endDate?: string
  courier_id?: number | string
  courier_ids?: string
  min_quantity?: number
  max_quantity?: number
  notes_search?: string
  week?: number
  month?: number
  quarter?: number
  year?: number
}

// 定义ShippingRecord类型，匹配API返回的字段
export interface ShippingRecord {
  id: number | string
  date: string
  courier_id: number | string
  courier_name: string
  quantity: number
  notes?: string
  created_at?: string
  updated_at?: string
}

// 分页响应类型
export interface PaginatedResponse<T> {
  records: T[]
  pagination: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

// 创建发货记录的请求体类型
export interface CreateShippingRecordRequest {
  date: string
  courier_id: number | string
  quantity: number
  notes?: string
}

// 批量创建发货记录的请求体类型
export interface BatchCreateShippingRecordRequest {
  date: string
  records: {
    courier_id: number | string
    quantity: number
    notes?: string
  }[]
}

// API服务对象
export const shippingApi = {
  // 获取发货记录列表
  async getShippingRecords(params?: ShippingFilterParams): Promise<PaginatedResponse<ShippingRecord>> {
    // 获取当前环境配置 - 每次调用API时重新获取
    const envConfig = useEnvStore.getState()
    const API_BASE_URL = envConfig.apiBaseUrl
    debugLog("当前API基础URL:", API_BASE_URL, "环境:", envConfig.env)

    const SHIPPING_ENDPOINT = `${API_BASE_URL}/api/shipping`

    // 构建查询参数
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.perPage) queryParams.append("perPage", params.perPage.toString())
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy)
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder)
    if (params?.date) queryParams.append("date", params.date)
    if (params?.date_from) queryParams.append("date_from", params.date_from)
    if (params?.date_to) queryParams.append("date_to", params.date_to)
    if (params?.courier_id) queryParams.append("courier_id", params.courier_id.toString())
    if (params?.courier_ids) queryParams.append("courier_ids", params.courier_ids)
    if (params?.min_quantity) queryParams.append("min_quantity", params.min_quantity.toString())
    if (params?.max_quantity) queryParams.append("max_quantity", params.max_quantity.toString())
    if (params?.notes_search) queryParams.append("notes_search", params.notes_search)
    if (params?.week) queryParams.append("week", params.week.toString())
    if (params?.month) queryParams.append("month", params.month.toString())
    if (params?.quarter) queryParams.append("quarter", params.quarter.toString())
    if (params?.year) queryParams.append("year", params.year.toString())

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return fetchWithErrorHandling<PaginatedResponse<ShippingRecord>>(`${SHIPPING_ENDPOINT}${queryString}`)
  },

  // 获取单个发货记录
  async getShippingRecord(id: number | string): Promise<ShippingRecord> {
    // 获取当前环境配置
    const envConfig = useEnvStore.getState()
    const API_BASE_URL = envConfig.apiBaseUrl
    const SHIPPING_ENDPOINT = `${API_BASE_URL}/api/shipping`

    return fetchWithErrorHandling<ShippingRecord>(`${SHIPPING_ENDPOINT}/${id}`)
  },

  // 创建发货记录
  async createShippingRecord(data: CreateShippingRecordRequest): Promise<ShippingRecord> {
    // 获取当前环境配置
    const envConfig = useEnvStore.getState()
    const API_BASE_URL = envConfig.apiBaseUrl
    const SHIPPING_ENDPOINT = `${API_BASE_URL}/api/shipping`

    return fetchWithErrorHandling<ShippingRecord>(`${SHIPPING_ENDPOINT}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 更新发货记录
  async updateShippingRecord(id: number | string, data: CreateShippingRecordRequest): Promise<ShippingRecord> {
    // 获取当前环境配置
    const envConfig = useEnvStore.getState()
    const API_BASE_URL = envConfig.apiBaseUrl
    const SHIPPING_ENDPOINT = `${API_BASE_URL}/api/shipping`

    return fetchWithErrorHandling<ShippingRecord>(`${SHIPPING_ENDPOINT}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // 删除发货记录
  async deleteShippingRecord(id: number | string): Promise<void> {
    // 获取当前环境配置
    const envConfig = useEnvStore.getState()
    const API_BASE_URL = envConfig.apiBaseUrl
    const SHIPPING_ENDPOINT = `${API_BASE_URL}/api/shipping`

    return fetchWithErrorHandling<void>(`${SHIPPING_ENDPOINT}/${id}`, {
      method: "DELETE",
    })
  },

  // 批量添加发货记录
  async batchCreateShippingRecords(data: BatchCreateShippingRecordRequest): Promise<{
    created: number
    records: ShippingRecord[]
  }> {
    // 获取当前环境配置
    const envConfig = useEnvStore.getState()
    const API_BASE_URL = envConfig.apiBaseUrl
    const SHIPPING_ENDPOINT = `${API_BASE_URL}/api/shipping`

    return fetchWithErrorHandling<{
      created: number
      records: ShippingRecord[]
    }>(`${SHIPPING_ENDPOINT}/batch`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 获取发货统计数据摘要
  async getShippingStats(params?: ShippingFilterParams): Promise<any> {
    // 获取当前环境配置
    const envConfig = useEnvStore.getState()
    const API_BASE_URL = envConfig.apiBaseUrl
    const STATS_ENDPOINT = `${API_BASE_URL}/api/shipping/stats`

    // 构建查询参数
    const queryParams = new URLSearchParams()

    if (params?.date) queryParams.append("date", params.date)
    if (params?.date_from) queryParams.append("date_from", params.date_from)
    if (params?.date_to) queryParams.append("date_to", params.date_to)
    if (params?.courier_id) queryParams.append("courier_id", params.courier_id.toString())
    if (params?.week) queryParams.append("week", params.week.toString())
    if (params?.month) queryParams.append("month", params.month.toString())
    if (params?.quarter) queryParams.append("quarter", params.quarter.toString())
    if (params?.year) queryParams.append("year", params.year.toString())

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    
    try {
      const response = await fetchWithErrorHandling<any>(`${STATS_ENDPOINT}${queryString}`)
      
      // 处理响应数据格式，适应不同的API返回格式
      // 如果response已经是目标数据格式（有total、by_courier等属性），则直接返回
      // 如果response包含.data属性，则返回.data
      if (response && typeof response === 'object') {
        if (response.data) {
          return response.data
        } else if (response.total || response.by_courier || response.by_date) {
          return response
        } else {
          // 返回默认格式
          return { 
            total: { total: 0 }, 
            by_courier: [], 
            by_date: [] 
          }
        }
      }
      
      // 返回默认数据格式
      return { 
        total: { total: 0 }, 
        by_courier: [], 
        by_date: [] 
      }
    } catch (error) {
      console.error("获取统计数据失败:", error)
      // 出错时返回默认数据格式
      return { 
        total: { total: 0 }, 
        by_courier: [], 
        by_date: [] 
      }
    }
  },

  // 获取发货统计详细数据
  async getShippingStatsDetails(params?: ShippingFilterParams): Promise<any> {
    // 获取当前环境配置
    const envConfig = useEnvStore.getState()
    const API_BASE_URL = envConfig.apiBaseUrl
    const STATS_ENDPOINT = `${API_BASE_URL}/api/shipping/stats/details`

    // 构建查询参数
    const queryParams = new URLSearchParams()

    if (params?.date) queryParams.append("date", params.date)
    if (params?.date_from) queryParams.append("date_from", params.date_from)
    if (params?.date_to) queryParams.append("date_to", params.date_to)
    if (params?.courier_id) queryParams.append("courier_id", params.courier_id.toString())
    if (params?.week) queryParams.append("week", params.week.toString())
    if (params?.month) queryParams.append("month", params.month.toString())
    if (params?.quarter) queryParams.append("quarter", params.quarter.toString())
    if (params?.year) queryParams.append("year", params.year.toString())

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    
    try {
      const response = await fetchWithErrorHandling<any>(`${STATS_ENDPOINT}${queryString}`)
      
      // 处理响应数据格式，适应不同的API返回格式
      if (response && typeof response === 'object') {
        if (response.data) {
          return response.data
        } else if (response.total || response.details) {
          return response
        } else {
          // 返回默认格式
          return { 
            total: { total: 0 }, 
            details: [] 
          }
        }
      }
      
      // 返回默认数据格式
      return { 
        total: { total: 0 }, 
        details: [] 
      }
    } catch (error) {
      console.error("获取统计详情数据失败:", error)
      // 出错时返回默认数据格式
      return { 
        total: { total: 0 }, 
        details: [] 
      }
    }
  },

  // 导出数据
  async exportData(params: any): Promise<{ downloadUrl: string }> {
    // 获取当前环境配置
    const envConfig = useEnvStore.getState()
    const API_BASE_URL = envConfig.apiBaseUrl
    const EXPORT_ENDPOINT = `${API_BASE_URL}/api/shipping/export`

    return fetchWithErrorHandling<{ downloadUrl: string }>(`${EXPORT_ENDPOINT}`, {
      method: "POST",
      body: JSON.stringify(params),
    })
  },

  // 获取图表数据
  async getChartData(params?: any): Promise<any> {
    // 获取当前环境配置
    const envConfig = useEnvStore.getState()
    const API_BASE_URL = envConfig.apiBaseUrl
    const CHART_ENDPOINT = `${API_BASE_URL}/api/shipping/chart`

    // 构建查询参数
    const queryParams = new URLSearchParams()

    if (params?.date_from) queryParams.append("date_from", params.date_from)
    if (params?.date_to) queryParams.append("date_to", params.date_to)
    if (params?.type) queryParams.append("type", params.type)
    if (params?.week) queryParams.append("week", params.week.toString())
    if (params?.month) queryParams.append("month", params.month.toString())
    if (params?.quarter) queryParams.append("quarter", params.quarter.toString())
    if (params?.year) queryParams.append("year", params.year.toString())

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    
    try {
      const response = await fetchWithErrorHandling<any>(`${CHART_ENDPOINT}${queryString}`)
      
      // 处理响应数据格式
      if (response && typeof response === 'object') {
        if (response.data) {
          return response.data
        } else if (response.labels || response.datasets) {
          return response
        } else {
          // 返回默认格式
          return { 
            labels: [], 
            datasets: [{ data: [] }] 
          }
        }
      }
      
      // 返回默认数据格式
      return { 
        labels: [], 
        datasets: [{ data: [] }] 
      }
    } catch (error) {
      console.error("获取图表数据失败:", error)
      // 出错时返回默认数据格式
      return { 
        labels: [], 
        datasets: [{ data: [] }] 
      }
    }
  }
}
