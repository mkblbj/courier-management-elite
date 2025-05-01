"use client"

import { useState, useEffect, useMemo } from "react"
import { api, type ShippingHierarchyItem, type ParentTypeShippingStats, type CourierType } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"
import { debugLog, debugError } from "@/lib/env-config"

// 日期过滤器类型
export interface DateFilter {
  date?: string
  date_from?: string
  date_to?: string
}

export function useShippingHierarchy() {
  const { toast } = useToast()
  const [shippingHierarchy, setShippingHierarchy] = useState<ShippingHierarchyItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<DateFilter>({})
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  // 缓存数据
  const [cache, setCache] = useState<{
    hierarchyData: Map<string, ShippingHierarchyItem[]>
    parentStats: Map<string, ParentTypeShippingStats>
  }>({
    hierarchyData: new Map(),
    parentStats: new Map(),
  })

  // 获取带层级的发货记录数据
  const fetchShippingHierarchy = async (filter?: DateFilter) => {
    const currentFilter = filter || dateFilter
    setIsLoading(true)
    setError(null)
    setDebugInfo(null)

    // 生成缓存键
    const cacheKey = generateCacheKey(currentFilter)
    
    // 检查缓存
    if (cache.hierarchyData.has(cacheKey)) {
      debugLog("🔍 使用缓存的发货层级数据")
      setShippingHierarchy(cache.hierarchyData.get(cacheKey) || [])
      setIsLoading(false)
      return
    }

    try {
      debugLog("🔍 获取发货记录层级数据，参数:", currentFilter)

      const startTime = performance.now()
      const data = await api.getShippingHierarchy(currentFilter)
      const endTime = performance.now()

      debugLog(`⏱️ API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("📦 获取到的数据:", data)

      // 设置数据
      setShippingHierarchy(data)
      
      // 更新缓存
      setCache(prev => {
        const newHierarchyData = new Map(prev.hierarchyData)
        newHierarchyData.set(cacheKey, data)
        return {
          ...prev,
          hierarchyData: newHierarchyData
        }
      })

      // 设置调试信息
      setDebugInfo({
        requestTime: new Date().toISOString(),
        responseTime: `${(endTime - startTime).toFixed(2)}ms`,
        dataCount: data.length,
        params: currentFilter,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "获取发货记录层级数据失败"
      setError(errorMessage)
      debugError("❌ 获取发货记录层级数据失败:", err)

      // 设置错误调试信息
      setDebugInfo({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "加载发货记录层级数据失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 获取特定母类型的发货统计
  const fetchParentTypeShippingStats = async (parentId: number | string, filter?: DateFilter) => {
    const currentFilter = filter || dateFilter
    
    // 生成缓存键
    const cacheKey = `${parentId}_${generateCacheKey(currentFilter)}`
    
    // 检查缓存
    if (cache.parentStats.has(cacheKey)) {
      debugLog(`🔍 使用缓存的母类型(ID: ${parentId})发货统计数据`)
      return cache.parentStats.get(cacheKey)
    }

    try {
      debugLog(`🔍 获取母类型(ID: ${parentId})的发货统计，参数:`, currentFilter)

      const startTime = performance.now()
      const data = await api.getParentTypeShippingStats(parentId, currentFilter)
      const endTime = performance.now()

      debugLog(`⏱️ API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("📦 获取到的数据:", data)
      
      // 更新缓存
      setCache(prev => {
        const newParentStats = new Map(prev.parentStats)
        newParentStats.set(cacheKey, data)
        return {
          ...prev,
          parentStats: newParentStats
        }
      })

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `获取母类型(ID: ${parentId})的发货统计失败`
      debugError(`❌ 获取母类型(ID: ${parentId})的发货统计失败:`, err)

      toast({
        title: "获取发货统计失败",
        description: errorMessage,
        variant: "destructive",
      })

      throw err
    }
  }

  // 生成缓存键
  const generateCacheKey = (filter: DateFilter): string => {
    return `${filter.date || ""}_${filter.date_from || ""}_${filter.date_to || ""}`
  }

  // 清除缓存数据
  const clearCache = () => {
    setCache({
      hierarchyData: new Map(),
      parentStats: new Map(),
    })
  }

  // 更新日期过滤器并获取数据
  const updateDateFilter = (filter: DateFilter) => {
    setDateFilter(filter)
    fetchShippingHierarchy(filter)
  }

  // 根据层级计算总量
  const getTotalByParent = (parentId: number | string): number => {
    const parent = shippingHierarchy.find(item => item.id === parentId)
    if (!parent) return 0
    
    // 汇总所有日期的数据
    let total = 0
    parent.shipping.total.forEach(record => {
      total += record.quantity
    })
    
    return total
  }
  
  // 根据层级计算自身量
  const getOwnShippingByParent = (parentId: number | string): number => {
    const parent = shippingHierarchy.find(item => item.id === parentId)
    if (!parent) return 0
    
    // 汇总所有日期的自身数据
    let total = 0
    parent.shipping.own.forEach(record => {
      total += record.quantity
    })
    
    return total
  }
  
  // 根据层级计算子类型量
  const getChildrenShippingByParent = (parentId: number | string): number => {
    const parent = shippingHierarchy.find(item => item.id === parentId)
    if (!parent) return 0
    
    // 汇总所有日期的子类型数据
    let total = 0
    parent.shipping.children.forEach(record => {
      total += record.quantity
    })
    
    return total
  }

  // 初始加载数据
  useEffect(() => {
    fetchShippingHierarchy()
  }, [])

  return {
    shippingHierarchy,
    isLoading,
    error,
    dateFilter,
    updateDateFilter,
    fetchShippingHierarchy,
    fetchParentTypeShippingStats,
    clearCache,
    debugInfo,
    getTotalByParent,
    getOwnShippingByParent,
    getChildrenShippingByParent
  }
} 