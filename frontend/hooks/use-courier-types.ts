"use client"

import { useState, useEffect, useMemo } from "react"
import { api, type CourierType, type FilterParams, type CourierCategory } from "@/services/api"
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

  // 添加类别相关状态
  const [categories, setCategories] = useState<CourierCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

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

  // 获取类别列表
  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      debugLog("🔍 获取快递类别列表")
      const data = await api.getCourierCategories()
      debugLog("📦 获取到的类别数据:", data)
      setCategories(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "获取快递类别失败"
      debugError("❌ 获取快递类别数据失败:", err)
      toast({
        title: "获取类别失败",
        variant: "destructive",
      })
    } finally {
      setCategoriesLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    fetchCourierTypes()
    fetchCategories()
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
    category_id?: number | string | null
  }) => {
    try {
      setIsLoading(true)
      debugLog("➕ 添加新快递类型:", courierType)

      const startTime = performance.now()
      const result = await api.createCourierType({
        ...courierType,
        is_active: courierType.is_active,
      })
      const endTime = performance.now()

      debugLog(`⏱️ 添加快递类型API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("📦 添加结果:", result)

      // 重新获取最新数据
      await fetchCourierTypes()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "添加快递类型失败"
      debugError("❌ 添加快递类型失败:", err)
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

  const updateCourierType = async (updatedCourierType: CourierType) => {
    try {
      setIsLoading(true)
      debugLog("✏️ 更新快递类型:", updatedCourierType)

      const startTime = performance.now()
      const result = await api.updateCourierType(updatedCourierType.id, {
        name: updatedCourierType.name,
        code: updatedCourierType.code,
        remark: updatedCourierType.remark,
        is_active: Boolean(updatedCourierType.is_active),
        category_id: updatedCourierType.category_id,
      })
      const endTime = performance.now()

      debugLog(`⏱️ 更新快递类型API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("📦 更新结果:", result)

      // 重新获取最新数据
      await fetchCourierTypes()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "更新快递类型失败"
      debugError("❌ 更新快递类型失败:", err)
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

  const deleteCourierType = async (id: number | string) => {
    try {
      setIsLoading(true)
      debugLog(`🗑️ 删除快递类型, ID: ${id}`)

      const startTime = performance.now()
      await api.deleteCourierType(id)
      const endTime = performance.now()

      debugLog(`⏱️ 删除快递类型API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)

      // 重新获取最新数据
      await fetchCourierTypes()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "删除快递类型失败"
      debugError("❌ 删除快递类型失败:", err)
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

  const toggleCourierTypeStatus = async (id: number | string) => {
    try {
      setIsLoading(true)
      debugLog(`🔄 切换快递类型状态, ID: ${id}`)

      const startTime = performance.now()
      const result = await api.toggleCourierTypeStatus(id)
      const endTime = performance.now()

      debugLog(`⏱️ 切换状态API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      debugLog("📦 切换结果:", result)

      // 重新获取最新数据
      await fetchCourierTypes()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "切换快递类型状态失败"
      debugError("❌ 切换快递类型状态失败:", err)
      toast({
        title: "操作失败",
        description: errorMessage,
        variant: "destructive",
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const reorderCourierTypes = async (reorderedTypes: CourierType[]) => {
    try {
      setIsLoading(true)
      debugLog("🔄 重新排序快递类型")

      // 准备排序数据
      const sortItems = reorderedTypes.map((item, index) => ({
        id: item.id,
        sort_order: index + 1,
      }))

      const startTime = performance.now()
      await api.updateCourierTypesOrder(sortItems)
      const endTime = performance.now()

      debugLog(`⏱️ 排序API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)

      // 重新获取最新数据
      await fetchCourierTypes()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "排序失败"
      debugError("❌ 排序快递类型失败:", err)
      toast({
        title: "排序失败",
        description: errorMessage,
        variant: "destructive",
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryTypeCount = (categoryId: number | string): number => {
    return courierTypes.filter(ct => ct.category_id && ct.category_id.toString() === categoryId.toString()).length
  }

  const isInCategory = (id: number | string, categoryId: number | string): boolean => {
    const courierType = courierTypes.find(ct => ct.id.toString() === id.toString())
    return courierType?.category_id?.toString() === categoryId.toString()
  }

  const getTypesByCategory = (categoryId: number | string): CourierType[] => {
    return courierTypes.filter(ct => ct.category_id && ct.category_id.toString() === categoryId.toString())
  }

  return {
    courierTypes,
    filteredCourierTypes,
    isLoading,
    error,
    searchQuery,
    statusFilter,
    debugInfo,
    setSearchQuery,
    setStatusFilter,
    addCourierType,
    updateCourierType,
    deleteCourierType,
    toggleCourierTypeStatus,
    reorderCourierTypes,
    fetchCourierTypes,
    categories,
    categoriesLoading,
    getCategoryTypeCount,
    isInCategory,
    getTypesByCategory,
  }
}
