"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { format, subDays } from "date-fns"
import { shippingApi } from "@/services/shipping-api"
import type { DateRange } from "react-day-picker"

export interface StatisticsData {
  summary: {
    total: number
    recordCount: number
    daysCount: number
  }
  byCourier: {
    courierId: string | number
    courierName: string
    total: number
    recordCount: number
  }[]
  byDate: {
    date: string
    total: number
    recordCount: number
    details?: {
      courierId: string | number
      courierName: string
      total: number
    }[]
  }[]
}

export function useStatisticsData() {
  const { toast } = useToast()
  const [data, setData] = useState<StatisticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 默认时间范围：最近7天
  const today = new Date()
  const sevenDaysAgo = subDays(today, 6)
  const [timeRange, setTimeRange] = useState<DateRange>({
    from: sevenDaysAgo,
    to: today,
  })

  // 默认快递类型筛选：全部
  const [courierTypeFilter, setCourierTypeFilter] = useState<string[]>([])

  const fetchStatisticsData = async () => {
    if (!timeRange.from || !timeRange.to) return

    setIsLoading(true)
    setError(null)

    try {
      // 构建API请求参数
      const params: any = {
        date_from: format(timeRange.from, "yyyy-MM-dd"),
        date_to: format(timeRange.to, "yyyy-MM-dd"),
      }

      // 如果选择了特定快递类型
      if (courierTypeFilter.length > 0) {
        params.courier_ids = courierTypeFilter.join(",")
      }

      // 获取统计数据
      const summaryResponse = await shippingApi.getShippingStats(params)
      const detailsResponse = await shippingApi.getShippingStatsDetails(params)

      // 处理数据格式
      const formattedData: StatisticsData = {
        summary: {
          total: summaryResponse.total.total || 0,
          recordCount: summaryResponse.total.record_count || 0,
          daysCount: summaryResponse.total.days_count || 0,
        },
        byCourier: summaryResponse.by_courier.map((item: any) => ({
          courierId: item.courier_id,
          courierName: item.courier_name,
          total: item.total,
          recordCount: item.record_count,
        })),
        byDate: [],
      }

      // 处理按日期的数据
      const dateMap = new Map<string, any>()

      // 先按日期分组
      detailsResponse.details.forEach((item: any) => {
        if (!dateMap.has(item.date)) {
          dateMap.set(item.date, {
            date: item.date,
            total: 0,
            recordCount: 0,
            details: [],
          })
        }

        const dateData = dateMap.get(item.date)
        dateData.total += item.total
        dateData.recordCount += 1
        dateData.details.push({
          courierId: item.courier_id,
          courierName: item.courier_name,
          total: item.total,
        })
      })

      // 转换为数组并排序
      formattedData.byDate = Array.from(dateMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )

      setData(formattedData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "获取统计数据失败"
      setError(errorMessage)
      console.error("获取统计数据失败:", err)

      toast({
        title: "加载失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    fetchStatisticsData()
  }, [])

  // 当筛选条件变化时重新加载数据
  useEffect(() => {
    fetchStatisticsData()
  }, [timeRange, courierTypeFilter])

  return {
    data,
    isLoading,
    error,
    timeRange,
    courierTypeFilter,
    setTimeRange,
    setCourierTypeFilter,
    refetch: fetchStatisticsData,
  }
}
