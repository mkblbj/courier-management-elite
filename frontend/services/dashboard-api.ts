// 导入环境配置和调试工具
import { useEnvStore, debugLog, debugError } from "@/lib/env-config"

// 获取API基础URL的辅助函数
function getApiBaseUrl(): string {
  // 使用getEffectiveApiUrl方法，它会自动处理代理问题
  return useEnvStore.getState().getEffectiveApiUrl()
}

// 获取仪表盘API基础端点
function getDashboardEndpoint(): string {
  const apiBaseUrl = getApiBaseUrl()
  return `${apiBaseUrl}/api/dashboard`
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

// 定义过滤参数类型
export interface DashboardFilterParams {
  category_id?: number | string
}

// 定义今日店铺出力统计类型
export interface TodayShopOutputsData {
  date: string
  total_quantity: number
  shops_count: number
  active_shops_count: number
  coverage_rate: number
  couriers_data: CourierData[]
  categories_data: CategoryData[]
  shops_data: ShopData[]
  shop_courier_data: ShopCourierData[]
}

// 定义明日店铺出力预测类型
export interface TomorrowShopOutputsData {
  date: string
  total_predicted_quantity: number
  shops_count: number
  predicted_shops_count: number
  coverage_rate: number
  couriers_data: CourierData[]
  categories_data: CategoryData[]
  shops_data: ShopData[]
  raw_predictions: RawPrediction[]
}

// 快递类型数据
export interface CourierData {
  courier_id: number
  courier_name: string
  total_quantity: number
  shops_count: number
}

// 类别数据
export interface CategoryData {
  category_id: number
  category_name: string
  total_quantity: number
  shops: CategoryShopData[]
}

// 类别下的店铺数据
export interface CategoryShopData {
  shop_id: number
  shop_name: string
  has_data: boolean
  total_quantity: number
  category_id?: number
  category_name?: string
  couriers?: CourierQuantity[]
}

// 店铺数据
export interface ShopData {
  shop_id: number
  shop_name: string
  category_id: number
  category_name: string
  has_data: boolean
  total_quantity: number
  couriers: CourierQuantity[]
}

// 店铺快递数据
export interface ShopCourierData {
  shop_id: number
  shop_name: string
  category_id: number
  category_name: string
  total_quantity: number
  couriers: CourierQuantity[]
}

// 快递数量
export interface CourierQuantity {
  courier_id: number
  courier_name: string
  quantity: number
  predicted_quantity?: number
}

// 原始预测数据
export interface RawPrediction {
  shop_id: number
  shop_name: string
  courier_id: number
  courier_name: string
  predicted_quantity: number
  days_count: number
}

// API服务对象
export const dashboardApi = {
  // 获取今日店铺出力统计
  async getTodayShopOutputs(params?: DashboardFilterParams): Promise<TodayShopOutputsData> {
    const DASHBOARD_ENDPOINT = getDashboardEndpoint()
    const queryString = buildQueryString(params)

    return fetchWithErrorHandling<TodayShopOutputsData>(`${DASHBOARD_ENDPOINT}/shop-outputs/today${queryString}`)
  },

  // 获取明日店铺出力预测
  async getTomorrowShopOutputs(params?: DashboardFilterParams): Promise<TomorrowShopOutputsData> {
    const DASHBOARD_ENDPOINT = getDashboardEndpoint()
    const queryString = buildQueryString(params)

    return fetchWithErrorHandling<TomorrowShopOutputsData>(`${DASHBOARD_ENDPOINT}/shop-outputs/tomorrow${queryString}`)
  },

  // 清除仪表盘数据缓存
  async clearCache(): Promise<void> {
    const DASHBOARD_ENDPOINT = getDashboardEndpoint()

    return fetchWithErrorHandling<void>(`${DASHBOARD_ENDPOINT}/cache/clear`, {
      method: "POST",
    })
  }
} 