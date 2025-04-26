"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { debugLog, debugError } from "@/lib/env-config"
import {
  shippingApi,
  type ShippingRecord,
  type CreateShippingRecordRequest,
  type BatchCreateShippingRecordRequest,
  type ShippingFilterParams,
} from "@/services/shipping-api"
import { format, parseISO } from "date-fns"

export interface ShippingEntry {
  id: string | number
  date: string
  courierTypeId: string | number
  courierTypeName: string
  quantity: number
  remarks?: string
}

// 将API响应格式转换为组件使用的格式
const mapApiRecordToEntry = (record: ShippingRecord): ShippingEntry => ({
  id: record.id,
  date: record.date,
  courierTypeId: record.courier_id,
  courierTypeName: record.courier_name,
  quantity: record.quantity,
  remarks: record.notes,
})

// 将组件格式转换为API请求格式
const mapEntryToApiRequest = (entry: ShippingEntry): CreateShippingRecordRequest => ({
  date: format(parseISO(entry.date), "yyyy-MM-dd"),
  courier_id: entry.courierTypeId,
  quantity: entry.quantity,
  notes: entry.remarks,
})

export function useShippingData() {
  const { toast } = useToast()
  // 默认设置为今天的日期筛选
  const today = format(new Date(), "yyyy-MM-dd")
  const tomorrow = format(new Date(new Date().setDate(new Date().getDate() + 1)), "yyyy-MM-dd")
  const [dateFilter, setDateFilter] = useState<{
    type?: "date" | "range" | "week" | "month" | "quarter" | "year"
    date?: string
    dateFrom?: string
    dateTo?: string
    week?: number
    month?: number
    quarter?: number
    year?: number
    courierTypeId?: string | number
  }>({
    type: "date",
    date: today,
  })

  const [entries, setEntries] = useState<ShippingEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [tomorrowTotal, setTomorrowTotal] = useState(0)

  // 获取明日总数
  const fetchTomorrowData = async () => {
    try {
      const response = await shippingApi.getShippingStats({
        date: tomorrow,
      })
      setTomorrowTotal(response?.total?.total || 0)
    } catch (err) {
      console.error("获取明日数据失败:", err)
      setTomorrowTotal(0)
    }
  }

  // 初始加载明日数据
  useEffect(() => {
    fetchTomorrowData()
  }, [tomorrow])

  // 修改 fetchShippingData 函数以支持筛选
  const fetchShippingData = async (page = currentPage, perPage = pageSize, filter = dateFilter) => {
    setIsLoading(true)
    setError(null)

    try {
      const params: ShippingFilterParams = {
        page,
        perPage,
        sortBy: "date",
        sortOrder: "DESC",
      }

      // 根据筛选类型添加日期筛选
      if (filter) {
        if (filter.type === "date" && filter.date) {
          params.date = filter.date
        } else if (filter.type === "range") {
          if (filter.dateFrom) params.date_from = filter.dateFrom
          if (filter.dateTo) params.date_to = filter.dateTo
        } else if (filter.type === "week" && filter.week) {
          params.week = filter.week
        } else if (filter.type === "month" && filter.month) {
          params.month = filter.month
        } else if (filter.type === "quarter" && filter.quarter) {
          params.quarter = filter.quarter
        } else if (filter.type === "year" && filter.year) {
          params.year = filter.year
        }
        
        // 添加快递类型ID筛选
        if (filter.courierTypeId) {
          params.courier_id = filter.courierTypeId
        }
      }

      const response = await shippingApi.getShippingRecords(params)

      const mappedEntries = response.records.map(mapApiRecordToEntry)
      setEntries(mappedEntries)
      setTotalRecords(response.pagination.total)
      setCurrentPage(response.pagination.currentPage)
      setTotalPages(response.pagination.lastPage)
      
      // 不显示加载成功通知 - 简化UI交互
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "获取发货数据失败"
      setError(errorMessage)
      debugError("❌ 获取发货数据失败:", err)

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
    fetchShippingData()
  }, [])

  // 添加单条记录
  const addEntry = async (entry: ShippingEntry) => {
    setIsLoading(true)
    setError(null)

    try {
      const apiRequest = mapEntryToApiRequest(entry)
      const response = await shippingApi.createShippingRecord(apiRequest)

      // 更新本地状态
      const newEntry = mapApiRecordToEntry(response)

      // 如果新记录的日期与当前筛选日期相同，则添加到列表中
      if (dateFilter.type === "date" && dateFilter.date === format(new Date(newEntry.date), "yyyy-MM-dd")) {
        setEntries((prev) => [newEntry, ...prev])
      } else {
        // 否则刷新数据
        fetchShippingData()
      }

      toast({
        title: "添加成功",
        description: "发货记录已成功添加",
        variant: "default",
      })

      return newEntry
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "添加记录失败"
      setError(errorMessage)

      toast({
        title: "添加失败",
        description: errorMessage,
        variant: "destructive",
      })

      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 批量添加记录
  const addBatchEntries = async (newEntries: ShippingEntry[]) => {
    setIsLoading(true)
    setError(null)

    try {
      if (newEntries.length === 0) {
        throw new Error("没有要添加的记录")
      }

      // 确保所有记录使用相同的日期
      const date = format(parseISO(newEntries[0].date), "yyyy-MM-dd")

      const batchRequest: BatchCreateShippingRecordRequest = {
        date,
        records: newEntries.map((entry) => ({
          courier_id: entry.courierTypeId,
          quantity: entry.quantity,
          notes: entry.remarks,
        })),
      }

      const response = await shippingApi.batchCreateShippingRecords(batchRequest)

      // 如果批量添加的日期与当前筛选日期相同，则更新列表
      if (dateFilter.type === "date" && dateFilter.date === date) {
        // 更新本地状态
        const addedEntries = response.records.map(mapApiRecordToEntry)
        setEntries((prev) => [...addedEntries, ...prev])
      } else {
        // 否则刷新数据
        fetchShippingData()
      }

      toast({
        title: "批量添加成功",
        description: `成功添加 ${response.created} 条发货记录`,
        variant: "default",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "批量添加记录失败"
      setError(errorMessage)

      toast({
        title: "批量添加失败",
        description: errorMessage,
        variant: "destructive",
      })

      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 更新记录
  const updateEntry = async (updatedEntry: ShippingEntry) => {
    setIsLoading(true)
    setError(null)

    try {
      const apiRequest = mapEntryToApiRequest(updatedEntry)
      const response = await shippingApi.updateShippingRecord(updatedEntry.id, apiRequest)

      // 更新本地状态
      const updatedRecord = mapApiRecordToEntry(response)
      setEntries((prev) => prev.map((entry) => (entry.id === updatedRecord.id ? updatedRecord : entry)))

      toast({
        title: "更新成功",
        description: "发货记录已成功更新",
        variant: "default",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "更新记录失败"
      setError(errorMessage)

      toast({
        title: "更新失败",
        description: errorMessage,
        variant: "destructive",
      })

      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 删除记录
  const deleteEntry = async (id: string | number) => {
    setIsLoading(true)
    setError(null)

    try {
      await shippingApi.deleteShippingRecord(id)

      // 更新本地状态
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
      
      // 更新总记录数
      setTotalRecords((prev) => Math.max(0, prev - 1))
      
      // 如果当前页变为空且不是第一页，自动跳转到上一页
      if (entries.length === 1 && currentPage > 1) {
        // 使用 setTimeout 来确保状态更新完成后再获取新页面数据
        setTimeout(() => {
          fetchShippingData(currentPage - 1, pageSize)
        }, 0)
      } else {
        // 否则刷新当前页数据，确保UI与服务器数据同步
        setTimeout(() => {
          fetchShippingData(currentPage, pageSize)
        }, 0)
      }

      toast({
        title: "删除成功",
        description: "发货记录已成功删除",
        variant: "default",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "删除记录失败"
      setError(errorMessage)

      toast({
        title: "删除失败",
        description: errorMessage,
        variant: "destructive",
      })

      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 添加一个函数来更改页码
  const changePage = (page: number) => {
    if (page !== currentPage) {
      fetchShippingData(page, pageSize)
    }
  }

  // 添加一个函数来更改每页显示数量
  const changePageSize = (size: number) => {
    if (size !== pageSize) {
      setPageSize(size)
      fetchShippingData(1, size) // 更改每页显示数量时重置到第一页
    }
  }

  // 添加一个函数来设置日期筛选
  const setFilter = (filter: typeof dateFilter) => {
    setDateFilter(filter)
    fetchShippingData(1, pageSize, filter) // 更改筛选条件时重置到第一页
  }

  // 清除所有筛选器
  const clearFilters = () => {
    const today = format(new Date(), "yyyy-MM-dd")
    setDateFilter({
      type: "date",
      date: today,
      courierTypeId: undefined // 确保快递类型筛选也被清除
    })
    changePage(1) // 重置到第一页
    fetchShippingData(1, pageSize, { type: "date", date: today })
  }

  // 更新返回值以包含新函数
  return {
    entries,
    totalRecords,
    currentPage,
    totalPages,
    pageSize,
    isLoading,
    error,
    addEntry,
    addBatchEntries,
    updateEntry,
    deleteEntry,
    refetch: fetchShippingData,
    changePage,
    changePageSize,
    dateFilter,
    setFilter,
    clearFilters,
    tomorrowTotal,
    fetchTomorrowData,
  }
}
