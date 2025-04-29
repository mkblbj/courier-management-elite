// 导入环境配置和调试工具
import { useEnvStore, debugLog, debugError, debugWarn } from "@/lib/env-config"

// 获取API基础URL的辅助函数
function getApiBaseUrl(): string {
  // 使用新的getEffectiveApiUrl方法，它会自动处理代理问题
  return useEnvStore.getState().getEffectiveApiUrl()
}

// 获取Shipping API基础端点
function getShippingEndpoint(): string {
  const apiBaseUrl = getApiBaseUrl()
  return `${apiBaseUrl}/api/shipping`
}

// 构建查询字符串的辅助函数
function buildQueryString(params?: Record<string, any>): string {
  if (!params) return ''

  const queryParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString())
    }
  })

  return queryParams.toString() ? `?${queryParams.toString()}` : ''
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
      const errorData = await response.json().catch(() => null)
      debugError(`API响应错误: ${response.status} ${response.statusText}`, errorData || "")

      // 直接使用后端返回的原始错误信息
      if (errorData) {
        // 优先使用后端的message字段（如果它包含有意义的业务错误信息）
        if (errorData.message && (
          errorData.message.includes("记录已存在") || 
          errorData.message.includes("已存在") ||
          errorData.message.includes("日期")
        )) {
          debugLog("使用后端返回的message字段:", errorData.message);
          throw new Error(errorData.message);
        }
        
        // 如果有errors对象，先检查是否有业务错误
        if (errorData.errors && Object.keys(errorData.errors).length > 0) {
          // 要过滤掉的技术性错误消息
          const technicalErrors = [
            "快递公司ID必须是整数",
            "ID为",
            "快递公司不存在",
            "快递公司已停用"
          ];
          
          // 先检查是否有包含"已存在"的错误消息
          let businessError = null;
          for (const key of Object.keys(errorData.errors)) {
            const errMsg = errorData.errors[key];
            if (errMsg && (
              errMsg.includes("记录已存在") || 
              errMsg.includes("已存在")
            )) {
              businessError = errMsg;
              break;
            }
          }
          
          // 如果找到业务错误，使用它
          if (businessError) {
            debugLog("使用业务错误:", businessError);
            throw new Error(businessError);
          }
          
          // 如果没有业务错误，检查是否有非技术性错误
          for (const key of Object.keys(errorData.errors)) {
            const errMsg = errorData.errors[key];
            if (errMsg) {
              let isTechnicalError = false;
              for (const techErr of technicalErrors) {
                if (errMsg.includes(techErr)) {
                  isTechnicalError = true;
                  break;
                }
              }
              
              if (!isTechnicalError) {
                debugLog("使用非技术性错误:", errMsg);
                throw new Error(errMsg);
              }
            }
          }
          
          // 只在没有找到任何业务错误或非技术性错误时使用message字段
          if (errorData.message) {
            debugLog("没有找到业务错误，使用message字段:", errorData.message);
            throw new Error(errorData.message);
          }
          
          // 最后才使用技术性错误（但实际上不应该走到这里）
          debugLog("没有找到适合的错误信息");
        }
      }

      // 如果无法解析错误数据，使用HTTP状态
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
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
    const SHIPPING_ENDPOINT = getShippingEndpoint()
    const queryString = buildQueryString(params)

    return fetchWithErrorHandling<PaginatedResponse<ShippingRecord>>(`${SHIPPING_ENDPOINT}${queryString}`)
  },

  // 获取单个发货记录
  async getShippingRecord(id: number | string): Promise<ShippingRecord> {
    const SHIPPING_ENDPOINT = getShippingEndpoint()
    return fetchWithErrorHandling<ShippingRecord>(`${SHIPPING_ENDPOINT}/${id}`)
  },

  // 创建发货记录
  async createShippingRecord(data: CreateShippingRecordRequest): Promise<ShippingRecord> {
    const SHIPPING_ENDPOINT = getShippingEndpoint()
    return fetchWithErrorHandling<ShippingRecord>(`${SHIPPING_ENDPOINT}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // 更新发货记录
  async updateShippingRecord(id: number | string, data: CreateShippingRecordRequest): Promise<ShippingRecord> {
    const SHIPPING_ENDPOINT = getShippingEndpoint()
    return fetchWithErrorHandling<ShippingRecord>(`${SHIPPING_ENDPOINT}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // 删除发货记录
  async deleteShippingRecord(id: number | string): Promise<void> {
    const SHIPPING_ENDPOINT = getShippingEndpoint()
    return fetchWithErrorHandling<void>(`${SHIPPING_ENDPOINT}/${id}`, {
      method: "DELETE",
    })
  },

  // 批量添加发货记录
  async batchCreateShippingRecords(data: BatchCreateShippingRecordRequest): Promise<{
    created: number
    records: ShippingRecord[]
  }> {
    const SHIPPING_ENDPOINT = getShippingEndpoint()
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
    const SHIPPING_ENDPOINT = getShippingEndpoint()
    const queryString = buildQueryString(params)

    return fetchWithErrorHandling<any>(`${SHIPPING_ENDPOINT}/stats${queryString}`)
  },

  // 获取发货统计数据详情
  async getShippingStatsDetails(params?: ShippingFilterParams): Promise<any> {
    const SHIPPING_ENDPOINT = getShippingEndpoint()
    const queryString = buildQueryString(params)

    return fetchWithErrorHandling<any>(`${SHIPPING_ENDPOINT}/stats/details${queryString}`)
  },

  // 导出数据
  async exportData(params: any): Promise<{ downloadUrl: string }> {
    const SHIPPING_ENDPOINT = getShippingEndpoint()
    const queryString = buildQueryString(params)

    return fetchWithErrorHandling<{ downloadUrl: string }>(`${SHIPPING_ENDPOINT}/export${queryString}`)
  },

  // 获取图表数据
  async getChartData(params?: any): Promise<any> {
    const SHIPPING_ENDPOINT = getShippingEndpoint()
    const queryString = buildQueryString(params)

    return fetchWithErrorHandling<any>(`${SHIPPING_ENDPOINT}/chart${queryString}`)
  },
}
