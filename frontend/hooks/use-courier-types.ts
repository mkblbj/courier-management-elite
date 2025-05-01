"use client"

import { useState, useEffect, useMemo } from "react"
import { api, type CourierType, type FilterParams, type CourierTypeHierarchyItem, type ChildTypesResult } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"
import { debugLog, debugError } from "@/lib/env-config"

export function useCourierTypes() {
  const { toast } = useToast()
  const [courierTypes, setCourierTypes] = useState<CourierType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  // 新增层级结构状态
  const [courierTypeHierarchy, setCourierTypeHierarchy] = useState<CourierTypeHierarchyItem[]>([])
  const [hierarchyLoading, setHierarchyLoading] = useState(false)
  const [hierarchyError, setHierarchyError] = useState<string | null>(null)

  // 加载数据的函数
  const fetchCourierTypes = async (params?: FilterParams) => {
    setIsLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      debugLog("🔍 获取快递类型列表，参数:", params)

      // 根据状态筛选转换为API参数
      const apiParams: FilterParams = {}
      if (statusFilter === "active") {
        apiParams.active_only = true
      }

      const startTime = performance.now()
      const data = await api.getCourierTypes(apiParams)
      const endTime = performance.now()

      debugLog(`⏱️ API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("📦 获取到的数据:", data)

      // 设置数据
      setCourierTypes(data)

      // 设置调试信息
      setDebugInfo({
        requestTime: new Date().toISOString(),
        responseTime: `${(endTime - startTime).toFixed(2)}ms`,
        dataCount: data.length,
        params: apiParams,
      })

      // 不显示加载成功通知 - 简化UI交互
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "获取数据失败"
      setError(errorMessage)
      debugError("❌ 获取快递类型数据失败:", err)

      // 设置错误调试信息
      setDebugInfo({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "加载失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 新增：获取层级结构数据
  const fetchCourierTypeHierarchy = async () => {
    setHierarchyLoading(true)
    setHierarchyError(null)

    try {
      debugLog("🔍 获取快递类型层级结构")

      const startTime = performance.now()
      const data = await api.getCourierTypeHierarchy()
      const endTime = performance.now()

      debugLog(`⏱️ 层级结构API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("📦 获取到的层级结构数据:", data)

      // 设置层级数据
      setCourierTypeHierarchy(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "获取层级结构失败"
      setHierarchyError(errorMessage)
      debugError("❌ 获取快递类型层级结构失败:", err)

      toast({
        title: "加载层级结构失败",
        variant: "destructive",
      })
    } finally {
      setHierarchyLoading(false)
    }
  }

  // 新增：获取特定母类型的子类型
  const getChildTypes = async (parentId: number | string) => {
    try {
      debugLog(`🔍 获取母类型(ID: ${parentId})的子类型`)

      const startTime = performance.now()
      const data = await api.getChildTypes(parentId)
      const endTime = performance.now()

      debugLog(`⏱️ 子类型API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("📦 获取到的子类型数据:", data)

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "获取子类型失败"
      debugError(`❌ 获取母类型(ID: ${parentId})的子类型失败:`, err)

      toast({
        title: "获取子类型失败",
        description: errorMessage,
        variant: "destructive",
      })

      throw err
    }
  }

  // 初始加载数据
  useEffect(() => {
    fetchCourierTypes()
  }, [])

  // 当筛选条件变化时重新加载数据
  useEffect(() => {
    fetchCourierTypes()
  }, [statusFilter])

  // 过滤和排序数据
  const filteredCourierTypes = useMemo(() => {
    // 本地搜索过滤
    return courierTypes
      .filter((ct) => {
        // 状态筛选
        if (statusFilter === "active") {
          if (!ct.is_active) return false
        } else if (statusFilter === "inactive") {
          if (ct.is_active) return false
        }

        // 搜索过滤
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return ct.name.toLowerCase().includes(query) || ct.code.toLowerCase().includes(query)
        }
        return true
      })
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [courierTypes, searchQuery, statusFilter])

  // CRUD操作
  const addCourierType = async (courierType: {
    name: string
    code: string
    remark?: string
    is_active: boolean
    parent_id?: number | string
  }) => {
    try {
      setIsLoading(true)
      debugLog("➕ 添加快递类型:", courierType)

      const startTime = performance.now()
      const newCourierType = await api.createCourierType(courierType)
      const endTime = performance.now()

      debugLog(`⏱️ 添加请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("✅ 添加成功:", newCourierType)

      // 重新获取列表以确保数据同步
      await fetchCourierTypes()
      
      // 如果添加的是子类型，刷新层级结构
      if (courierType.parent_id) {
        await fetchCourierTypeHierarchy()
      }
      
      return newCourierType
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "添加快递类型失败"
      setError(errorMessage)
      debugError("❌ 添加快递类型失败:", err)

      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateCourierType = async (updatedCourierType: CourierType) => {
    try {
      setIsLoading(true)
      debugLog("✏️ 更新快递类型:", updatedCourierType)

      const { id, ...data } = updatedCourierType

      const startTime = performance.now()
      const result = await api.updateCourierType(id, {
        name: data.name,
        code: data.code,
        remark: data.remark,
        is_active: Boolean(data.is_active),
      })
      const endTime = performance.now()

      debugLog(`⏱️ 更新请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("✅ 更新成功:", result)

      // 重新获取列表以确保数据同步
      await fetchCourierTypes()
      
      // 更新完成后，刷新层级结构
      await fetchCourierTypeHierarchy()
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "更新快递类型失败"
      setError(errorMessage)
      debugError("❌ 更新快递类型失败:", err)

      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCourierType = async (id: number | string) => {
    try {
      setIsLoading(true)
      debugLog("🗑️ 删除快递类型:", id)

      const startTime = performance.now()
      await api.deleteCourierType(id)
      const endTime = performance.now()

      debugLog(`⏱️ 删除请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("✅ 删除成功")

      // 重新获取列表以确保数据同步
      await fetchCourierTypes()
      
      // 删除完成后，刷新层级结构
      await fetchCourierTypeHierarchy()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "删除快递类型失败"
      setError(errorMessage)
      debugError("❌ 删除快递类型失败:", err)

      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCourierTypeStatus = async (id: number | string) => {
    try {
      setIsLoading(true)
      debugLog("🔄 切换快递类型状态:", id)

      const startTime = performance.now()
      const result = await api.toggleCourierTypeStatus(id)
      const endTime = performance.now()

      debugLog(`⏱️ 状态切换请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("✅ 状态切换成功:", result)

      // 重新获取列表以确保数据同步
      await fetchCourierTypes()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "切换快递类型状态失败"
      setError(errorMessage)
      debugError("❌ 切换快递类型状态失败:", err)

      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const reorderCourierTypes = async (reorderedTypes: CourierType[]) => {
    try {
      setIsLoading(true)
      debugLog("🔃 更新快递类型排序")

      // 准备排序数据
      const items = reorderedTypes.map((item, index) => ({
        id: item.id,
        sort_order: index + 1,
      }))

      debugLog("📊 排序数据:", items)

      const startTime = performance.now()
      await api.updateCourierTypesOrder(items)
      const endTime = performance.now()

      debugLog(`⏱️ 排序请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("✅ 排序更新成功")

      // 更新本地状态，避免重新请求
      setCourierTypes(
        reorderedTypes.map((item, index) => ({
          ...item,
          sort_order: index + 1,
        })),
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "更新排序失败"
      setError(errorMessage)
      debugError("❌ 更新排序失败:", err)

      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 新增：计算母类型总数
  const getParentTypeCount = (parentId: number | string): number => {
    // 查找层级结构中的对应母类型
    const parent = courierTypeHierarchy.find(item => item.id === parentId)
    return parent?.totalCount || 0
  }

  // 新增：检查类型是否为母类型
  const isParentType = (id: number | string): boolean => {
    return courierTypeHierarchy.some(item => item.id === id)
  }

  // 新增：检查类型是否为子类型
  const isChildType = (courierType: CourierType): boolean => {
    return courierType.parent_id != null
  }

  // 新增：获取类型的全部子类型
  const getAllChildTypes = (parentId: number | string): CourierType[] => {
    const parent = courierTypeHierarchy.find(item => item.id === parentId)
    return parent?.children || []
  }

  return {
    courierTypes,
    filteredCourierTypes,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    fetchCourierTypes,
    addCourierType,
    updateCourierType,
    deleteCourierType,
    toggleCourierTypeStatus,
    reorderCourierTypes,
    debugInfo,
    // 新增返回的方法和状态
    courierTypeHierarchy,
    hierarchyLoading,
    hierarchyError,
    fetchCourierTypeHierarchy,
    getChildTypes,
    getParentTypeCount,
    isParentType,
    isChildType,
    getAllChildTypes,
  }
}
