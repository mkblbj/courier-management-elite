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

  // 默认时间范围：本月（从本月1日到今天）
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const [timeRange, setTimeRange] = useState<DateRange>({
    from: firstDayOfMonth,
    to: today,
  })

  // 默认快递类型筛选：全部
  const [courierTypeFilter, setCourierTypeFilter] = useState<string[]>([])

  // 添加视图模式状态 - "flat"平铺视图
  const [viewMode, setViewMode] = useState<"flat">("flat")
  
  // 添加展开状态管理
  const [expandedItems, setExpandedItems] = useState<Set<string | number>>(new Set())
  
  // 切换所有项目的展开/折叠状态
  const toggleAllExpanded = (expand: boolean) => {
    if (expand) {
      // 展开所有项
      const allIds = new Set<string | number>()
      setExpandedItems(allIds)
    } else {
      // 折叠所有项
      setExpandedItems(new Set())
    }
  }

  // 切换单个项目的展开/折叠状态
  const toggleItemExpanded = (id: string | number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

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
        params.courier_id = courierTypeFilter[0]
      }

      // 获取统计数据
      const summaryResponse = await shippingApi.getShippingStats(params)
      const detailsResponse = await shippingApi.getShippingStatsDetails(params)

      // 处理数据格式
      const formattedData: StatisticsData = {
        summary: {
          total: Number(summaryResponse.total.total) || 0,
          recordCount: Number(summaryResponse.total.record_count) || 0,
          daysCount: Number(summaryResponse.total.days_count) || 0,
        },
        byCourier: summaryResponse.by_courier ? summaryResponse.by_courier.map((item: any) => ({
          courierId: item.courier_id,
          courierName: item.courier_name,
          total: Number(item.total) || 0,
          recordCount: Number(item.record_count) || 0,
        })) : [],
        byDate: [],
      }

      // 处理按日期的数据
      const dateMap = new Map<string, any>()

      // 先按日期分组
      if (detailsResponse && detailsResponse.by_date_and_courier && Array.isArray(detailsResponse.by_date_and_courier)) {
        detailsResponse.by_date_and_courier.forEach((item: any) => {
          if (!dateMap.has(item.date)) {
            dateMap.set(item.date, {
              date: item.date,
              total: 0,
              recordCount: 0,
              details: [],
            })
          }

          const dateData = dateMap.get(item.date)
          dateData.total += Number(item.total) || 0
          dateData.recordCount += 1
          dateData.details.push({
            courierId: item.courier_id,
            courierName: item.courier_name,
            total: Number(item.total) || 0,
          })
        })
      }

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
    viewMode,
    expandedItems,
    setTimeRange,
    setCourierTypeFilter,
    setViewMode,
    toggleItemExpanded,
    toggleAllExpanded,
    refetch: fetchStatisticsData,
  }
}
