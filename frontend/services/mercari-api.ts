import { getBaseApiUrl } from './api'

export interface MercariShopOverview {
  shopId: string
  shopName: string
  pendingCount: number
}

export interface ShopsOverviewResponse {
  shops: MercariShopOverview[]
}

/**
 * 获取 Mercari 店铺概览（调用后端 Mock 契约）
 */
export async function getShopsOverview(): Promise<ShopsOverviewResponse> {
  const base = getBaseApiUrl()
  const url = `${base}/api/mercari/shops-overview`

  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`请求失败: ${res.status}`)
  }
  const payload = await res.json()
  if (payload?.code !== 0) {
    throw new Error(payload?.message || '获取失败')
  }
  return payload.data as ShopsOverviewResponse
}


