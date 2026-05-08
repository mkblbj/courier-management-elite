import { useEnvStore, debugLog, debugError } from "@/lib/env-config"

function getApiBaseUrl(): string {
  return useEnvStore.getState().getEffectiveApiUrl()
}

function getScanCountEndpoint(): string {
  return `${getApiBaseUrl()}/api/scan-counts`
}

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return ""

  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString())
    }
  })

  return queryParams.toString() ? `?${queryParams.toString()}` : ""
}

interface ApiResponseFormat<T> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string>
  duplicate?: boolean
}

export interface ScanCountRecord {
  id: number
  tracking_number: string
  raw_input: string
  courier_id: number
  courier_name?: string
  barcode_rule_type?: "postal" | "sagawa" | "generic"
  scan_date: string
  batch_id: string
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface CreateScanCountRecordRequest {
  tracking_number: string
  raw_input: string
  courier_id: number | string
  scan_date: string
  batch_id: string
  notes?: string | null
}

export interface ScanCountStats {
  total: number
  by_courier: {
    courier_id: number
    courier_name: string
    total: number
  }[]
}

export class ScanCountDuplicateError extends Error {
  record?: ScanCountRecord

  constructor(message: string, record?: ScanCountRecord) {
    super(message)
    this.name = "ScanCountDuplicateError"
    this.record = record
  }
}

async function fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
  const envConfig = useEnvStore.getState()
  const method = options?.method || "GET"

  if (envConfig.debug) {
    debugLog(`ScanCount API请求: ${method} ${url}`, options?.body ? { body: options.body } : "")
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  const responseData = (await response.json().catch(() => null)) as ApiResponseFormat<T> | null

  if (!response.ok || !responseData?.success) {
    if (response.status === 409 || responseData?.duplicate) {
      throw new ScanCountDuplicateError(
        responseData?.message || "该运单号今天已扫描",
        responseData?.data as ScanCountRecord
      )
    }

    const firstValidationError = responseData?.errors ? Object.values(responseData.errors)[0] : null
    const message = firstValidationError || responseData?.message || `API请求失败: ${response.status} ${response.statusText}`
    debugError(`ScanCount API错误: ${method} ${url}`, responseData || message)
    throw new Error(message)
  }

  return responseData.data as T
}

export const scanCountApi = {
  async list(params?: { date?: string; courier_id?: number | string; batch_id?: string }) {
    const queryString = buildQueryString(params)
    return fetchWithErrorHandling<{ records: ScanCountRecord[] }>(`${getScanCountEndpoint()}${queryString}`)
  },

  async getStats(params?: { date?: string }) {
    const queryString = buildQueryString(params)
    return fetchWithErrorHandling<ScanCountStats>(`${getScanCountEndpoint()}/stats${queryString}`)
  },

  async create(data: CreateScanCountRecordRequest) {
    return fetchWithErrorHandling<ScanCountRecord>(getScanCountEndpoint(), {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async update(id: number | string, data: Partial<CreateScanCountRecordRequest>) {
    return fetchWithErrorHandling<ScanCountRecord>(`${getScanCountEndpoint()}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async delete(id: number | string) {
    return fetchWithErrorHandling<void>(`${getScanCountEndpoint()}/${id}`, {
      method: "DELETE",
    })
  },

  async deleteBatch(batchId: string) {
    return fetchWithErrorHandling<{ deleted: number }>(`${getScanCountEndpoint()}/batch/${batchId}`, {
      method: "DELETE",
    })
  },
}
