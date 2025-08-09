'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getShopsOverview, type MercariShopOverview } from '@/services/mercari-api'

function Badge({ count }: { count: number }) {
      const color = count > 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
      return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                  {count}
            </span>
      )
}

export default function MercariDashboardPage() {
      const router = useRouter()
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState<string | null>(null)
      const [shops, setShops] = useState<MercariShopOverview[]>([])

      const load = async () => {
            try {
                  setError(null)
                  setLoading(true)
                  const data = await getShopsOverview()
                  setShops(data.shops || [])
            } catch (e: any) {
                  setError(e?.message || '加载失败')
            } finally {
                  setLoading(false)
            }
      }

      useEffect(() => {
            load()
            // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      return (
            <div className="p-6 space-y-4">
                  <h1 className="text-2xl font-semibold">Mercari 店铺仪表盘</h1>

                  {loading && (
                        <div className="space-y-2">
                              <div className="h-10 bg-gray-100 animate-pulse rounded" />
                              <div className="h-10 bg-gray-100 animate-pulse rounded" />
                              <div className="h-10 bg-gray-100 animate-pulse rounded" />
                        </div>
                  )}

                  {error && !loading && (
                        <div className="border border-red-200 bg-red-50 text-red-700 p-4 rounded">
                              <div className="flex items-center justify-between">
                                    <span>加载失败：{error}</span>
                                    <button onClick={load} className="px-3 py-1 text-sm border rounded bg-white hover:bg-gray-50">重试</button>
                              </div>
                        </div>
                  )}

                  {!loading && !error && shops.length === 0 && (
                        <div className="border bg-white p-6 rounded text-gray-500">暂无店铺/暂无数据</div>
                  )}

                  {!loading && !error && shops.length > 0 && (
                        <div className="bg-white border rounded divide-y">
                              {shops.map((s) => (
                                    <button
                                          key={s.shopId}
                                          onClick={() => router.push(`/mercari-tool/${s.shopId}`)}
                                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-left"
                                    >
                                          <span className="font-medium text-gray-800">{s.shopName}</span>
                                          <Badge count={s.pendingCount} />
                                    </button>
                              ))}
                        </div>
                  )}

                  <div className="pt-2">
                        <button className="px-3 py-1.5 border rounded text-sm text-gray-400 cursor-not-allowed" disabled>
                              同步订单（占位）
                        </button>
                  </div>
            </div>
      )
}


