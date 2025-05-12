"use client";
import { useTranslation } from "react-i18next";

import { useEffect, useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, TrendingUp, Package, ChevronRight, Calendar, PlusCircle, BarChart2, Download, AlertCircle, ChevronDown, Store } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { ShippingTrendChart } from "@/components/dashboard/shipping-trend-chart"
import { CourierDistributionChart } from "@/components/dashboard/courier-distribution-chart"
import { QuickActionCard } from "@/components/dashboard/quick-action-card"
import { StatCard } from "@/components/dashboard/stat-card"
import { useCourierTypes } from "@/hooks/use-courier-types"
import { shippingApi } from "@/services/shipping-api"
import { useShippingData } from "@/hooks/use-shipping-data"
import { ShopOutputCard } from "./components/ShopOutputCard"
import { ShopOutputTomorrowCard } from "./components/ShopOutputTomorrowCard"
import { API_BASE_URL, API_SUCCESS_CODE } from "@/lib/constants"
import { dashboardApi } from "@/services/dashboard-api"

export default function DashboardPage() {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [todayStats, setTodayStats] = useState<any>(null)
  const [monthlyStats, setMonthlyStats] = useState<any>(null)
  const [weeklyStats, setWeeklyStats] = useState<any>(null)
  const [lastMonthStats, setLastMonthStats] = useState<any>(null)
  const [lastWeekStats, setLastWeekStats] = useState<any>(null)
  const [recentEntries, setRecentEntries] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const { courierTypes } = useCourierTypes()
  const [selectedTimeRange, setSelectedTimeRange] = useState("7days")
  const [selectedCourierType, setSelectedCourierType] = useState("all")
  const [refreshInterval, setRefreshInterval] = useState("60000") // 默认1分钟
  const [isRefreshingTodayStats, setIsRefreshingTodayStats] = useState(false)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  // 添加活跃标签页状态
  const [activeTab, setActiveTab] = useState("overview")

  const shippingData = useShippingData()

  // 新增店铺出力相关状态
  const [shopOutputData, setShopOutputData] = useState<any[]>([])
  const [shopOutputTomorrowData, setShopOutputTomorrowData] = useState<any[]>([])
  const [isLoadingShopOutput, setIsLoadingShopOutput] = useState(true)

  // 获取今日日期
  const today = format(new Date(), "yyyy-MM-dd")
  const currentMonth = format(new Date(), "yyyy-MM")

  // 添加真实出力数据状态
  const [todayTotalOutput, setTodayTotalOutput] = useState<number>(0)
  const [tomorrowTotalOutput, setTomorrowTotalOutput] = useState<number>(0)
  const [isLoadingTodayOutput, setIsLoadingTodayOutput] = useState<boolean>(false)
  const [isLoadingTomorrowOutput, setIsLoadingTomorrowOutput] = useState<boolean>(false)
  const [outputError, setOutputError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 加载仪表盘数据
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null) // 重置错误状态
      try {
        // 获取今日统计数据
        const todayStatsResponse = await shippingApi.getShippingStats({
          date: today,
        })
        setTodayStats(todayStatsResponse || { total: { total: 0 }, by_courier: [] }) // 添加默认值

        // 获取本月统计数据
        const monthlyStatsResponse = await shippingApi.getShippingStats({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        })
        setMonthlyStats(monthlyStatsResponse || { total: { total: 0 } }) // 添加默认值

        // 获取上月统计数据
        const lastMonth = new Date().getMonth() === 0 ? 12 : new Date().getMonth()
        const lastMonthYear = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()
        const lastMonthStatsResponse = await shippingApi.getShippingStats({
          month: lastMonth,
          year: lastMonthYear,
        }).catch(() => null)
        setLastMonthStats(lastMonthStatsResponse || { total: { total: 0 } }) // 添加默认值

        // 获取近7日统计数据
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const weeklyStatsResponse = await shippingApi.getShippingStats({
          date_from: format(sevenDaysAgo, "yyyy-MM-dd"),
          date_to: today,
        })
        setWeeklyStats(weeklyStatsResponse || { total: { total: 0 }, by_date: [] }) // 添加默认值

        // 获取上周统计数据
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
        const lastWeekStatsResponse = await shippingApi.getShippingStats({
          date_from: format(fourteenDaysAgo, "yyyy-MM-dd"),
          date_to: format(sevenDaysAgo, "yyyy-MM-dd"),
        }).catch(() => null)
        setLastWeekStats(lastWeekStatsResponse || { total: { total: 0 } }) // 添加默认值

        // 获取最近录入数据
        const recentEntriesResponse = await shippingApi.getShippingRecords({
          page: 1,
          perPage: 10,
          sortBy: "created_at",
          sortOrder: "DESC",
        })
        setRecentEntries(recentEntriesResponse.records || []) // 添加默认值
      } catch (error) {
        console.error("加载仪表盘数据失败:", error)
        // 设置默认数据，确保UI正常显示
        setTodayStats({ total: { total: 0 }, by_courier: [] })
        setMonthlyStats({ total: { total: 0 } })
        setLastMonthStats({ total: { total: 0 } })
        setWeeklyStats({ total: { total: 0 }, by_date: [] })
        setLastWeekStats({ total: { total: 0 } })
        // 设置错误状态
        setError(error instanceof Error ? error.message : t("未知错误，请检查API服务是否可用"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [today, t])

  // 获取活跃的快递类型
  const activeCourierTypes = courierTypes
    .filter((type) => type.is_active)
    .filter((type) => !type.name.includes(t("未指定"))); // 过滤掉"未指定"的快递类型

  // 计算本月进度
  const currentDate = new Date()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const dayOfMonth = currentDate.getDate()
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100)

  // 计算同比上周增长率
  const calculateWeeklyGrowth = () => {
    if (!weeklyStats?.total?.total || !lastWeekStats?.total?.total) return null
    const currentTotal = weeklyStats.total.total
    const lastWeekTotal = lastWeekStats.total.total
    if (lastWeekTotal === 0) return null
    return Math.round(((currentTotal - lastWeekTotal) / lastWeekTotal) * 100)
  }

  const weeklyGrowth = calculateWeeklyGrowth()

  // 生成最近7天的每日数据
  const generateDailyData = () => {
    if (!weeklyStats) return []

    const daily = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = format(date, "yyyy-MM-dd")

      // 尝试从API响应中找到对应日期的数据
      let dayTotal = 0
      if (weeklyStats.by_date && Array.isArray(weeklyStats.by_date)) {
        const dayData = weeklyStats.by_date.find((d) => format(new Date(d.date), "yyyy-MM-dd") === dateStr)
        if (dayData) {
          dayTotal = dayData.total
        }
      }

      daily.push({
        date: dateStr,
        total: dayTotal
      })
    }

    return daily
  }

  const dailyData = generateDailyData()

  // 单独刷新今日各快递类型实时发货量
  const refreshTodayStats = async () => {
    setIsRefreshingTodayStats(true)
    try {
      // 获取当前日期（确保始终使用最新日期）
      const currentDate = format(new Date(), "yyyy-MM-dd")

      // 获取今日统计数据
      const todayStatsResponse = await shippingApi.getShippingStats({
        date: currentDate,
      })
      setTodayStats(todayStatsResponse || { total: { total: 0 }, by_courier: [] })
    } catch (error) {
      console.error("刷新今日数据失败:", error)
    } finally {
      setIsRefreshingTodayStats(false)
    }
  }

  // 用于计算下次刷新剩余时间
  const [nextRefreshTime, setNextRefreshTime] = useState<number>(parseInt(refreshInterval) / 1000)

  // 初始化时启动倒计时
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setNextRefreshTime((prev) => {
        if (prev <= 1) {
          return parseInt(refreshInterval) / 1000
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownTimer)
  }, [refreshInterval])

  // 设置自动刷新定时器
  useEffect(() => {
    // 清除之前的定时器
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
    }

    // 重置下次刷新时间
    setNextRefreshTime(parseInt(refreshInterval) / 1000)

    // 设置刷新定时器
    refreshTimerRef.current = setInterval(() => {
      refreshTodayStats()
      // 重置倒计时
      setNextRefreshTime(parseInt(refreshInterval) / 1000)
    }, parseInt(refreshInterval))

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [refreshInterval])

  // 格式化倒计时显示
  const formatCountdown = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}${t("秒")}`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}${t("分")} ${remainingSeconds}${t("秒")}`
  }

  // 添加获取店铺出力数据的模拟函数
  const fetchShopOutputData = async () => {
    setIsLoadingShopOutput(true)
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 模拟今日店铺出力数据 - 后续将替换为真实API调用
      const mockShopData = [
        { id: "1", name: "北京店", category: "一线城市", output: 345 },
        { id: "2", name: "上海店", category: "一线城市", output: 289 },
        { id: "3", name: "广州店", category: "一线城市", output: 254 },
        { id: "4", name: "深圳店", category: "一线城市", output: 267 },
        { id: "5", name: "杭州店", category: "二线城市", output: 187 },
        { id: "6", name: "成都店", category: "二线城市", output: 176 },
        { id: "7", name: "南京店", category: "二线城市", output: 164 },
        { id: "8", name: "武汉店", category: "二线城市", output: 156 },
        { id: "9", name: "西安店", category: "二线城市", output: 143 },
        { id: "10", name: "长沙店", category: "三线城市", output: 95 },
        { id: "11", name: "合肥店", category: "三线城市", output: 87 },
        { id: "12", name: "济南店", category: "三线城市", output: 92 },
      ]

      // 模拟明日预测数据 - 基于今日数据略微增加或减少
      const mockTomorrowData = mockShopData.map(shop => ({
        ...shop,
        output: Math.round(shop.output * (0.9 + Math.random() * 0.3)) // 在90%-120%之间随机浮动
      }))

      setShopOutputData(mockShopData)
      setShopOutputTomorrowData(mockTomorrowData)
    } catch (error) {
      console.error("获取店铺出力数据失败:", error)
    } finally {
      setIsLoadingShopOutput(false)
    }
  }

  // 初始化加载店铺出力数据
  useEffect(() => {
    fetchShopOutputData()
  }, [])

  // 获取今日出力总量数据的函数
  const fetchTodayTotalOutput = useCallback(async () => {
    setIsLoadingTodayOutput(true)
    setOutputError(null)
    try {
      // 开发环境下，如果API未准备好，使用模拟数据
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        await new Promise(resolve => setTimeout(resolve, 600))
        setTodayTotalOutput(Math.floor(Math.random() * 1000) + 1500)
        return
      }

      const todayOutputData = await dashboardApi.getTodayShopOutputs()
      setTodayTotalOutput(todayOutputData.total_quantity || 0)
    } catch (error) {
      console.error("[Dashboard] 获取今日出力总量失败:", error)
      setOutputError(error instanceof Error ? error.message : "未知错误")
      // 设置默认值
      setTodayTotalOutput(0)
    } finally {
      setIsLoadingTodayOutput(false)
    }
  }, [])

  // 获取明日出力预测总量数据的函数
  const fetchTomorrowTotalOutput = useCallback(async () => {
    setIsLoadingTomorrowOutput(true)
    setOutputError(null)
    try {
      // 开发环境下，如果API未准备好，使用模拟数据
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        await new Promise(resolve => setTimeout(resolve, 600))
        setTomorrowTotalOutput(Math.floor(Math.random() * 1200) + 1600)
        return
      }

      const tomorrowOutputData = await dashboardApi.getTomorrowShopOutputs()
      setTomorrowTotalOutput(tomorrowOutputData.total_predicted_quantity || 0)
    } catch (error) {
      console.error("[Dashboard] 获取明日出力预测总量失败:", error)
      setOutputError(error instanceof Error ? error.message : "未知错误")
      // 设置默认值
      setTomorrowTotalOutput(0)
    } finally {
      setIsLoadingTomorrowOutput(false)
    }
  }, [])

  // 加载出力数据
  useEffect(() => {
    fetchTodayTotalOutput()
    fetchTomorrowTotalOutput()
  }, [fetchTodayTotalOutput, fetchTomorrowTotalOutput])

  // 在handleRefresh函数中添加出力数据刷新
  const handleRefresh = async () => {
    setIsLoading(true)
    setError(null) // 重置错误状态
    try {
      // 重新获取所有数据
      const todayStatsResponse = await shippingApi.getShippingStats({
        date: today,
      })
      setTodayStats(todayStatsResponse || { total: { total: 0 }, by_courier: [] }) // 添加默认值

      // 获取明日总数数据
      const tomorrow = format(new Date(new Date().setDate(new Date().getDate() + 1)), "yyyy-MM-dd")
      const tomorrowStatsResponse = await shippingApi.getShippingStats({
        date: tomorrow,
      })

      // 更新shippingData中的明日数据
      if (shippingData.fetchTomorrowData) {
        await shippingData.fetchTomorrowData()
      }

      const monthlyStatsResponse = await shippingApi.getShippingStats({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      })
      setMonthlyStats(monthlyStatsResponse || { total: { total: 0 } }) // 添加默认值

      // 获取上月统计数据
      const lastMonth = new Date().getMonth() === 0 ? 12 : new Date().getMonth()
      const lastMonthYear = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()
      const lastMonthStatsResponse = await shippingApi.getShippingStats({
        month: lastMonth,
        year: lastMonthYear,
      }).catch(() => null)
      setLastMonthStats(lastMonthStatsResponse || { total: { total: 0 } }) // 添加默认值

      // 获取近7日统计数据
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const weeklyStatsResponse = await shippingApi.getShippingStats({
        date_from: format(sevenDaysAgo, "yyyy-MM-dd"),
        date_to: today,
      })
      setWeeklyStats(weeklyStatsResponse || { total: { total: 0 }, by_date: [] }) // 添加默认值

      // 获取上周统计数据
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      const lastWeekStatsResponse = await shippingApi.getShippingStats({
        date_from: format(fourteenDaysAgo, "yyyy-MM-dd"),
        date_to: format(sevenDaysAgo, "yyyy-MM-dd"),
      }).catch(() => null)
      setLastWeekStats(lastWeekStatsResponse || { total: { total: 0 } }) // 添加默认值

      const recentEntriesResponse = await shippingApi.getShippingRecords({
        page: 1,
        perPage: 10,
        sortBy: "created_at",
        sortOrder: "DESC",
      })
      setRecentEntries(recentEntriesResponse.records || []) // 添加默认值

      // 刷新店铺出力数据
      fetchShopOutputData();

      // 刷新出力数据
      fetchTodayTotalOutput()
      fetchTomorrowTotalOutput()
    } catch (error) {
      console.error("刷新数据失败:", error)
      // 设置默认数据，确保UI正常显示
      setTodayStats({ total: { total: 0 }, by_courier: [] })
      setMonthlyStats({ total: { total: 0 } })
      setLastMonthStats({ total: { total: 0 } })
      setWeeklyStats({ total: { total: 0 }, by_date: [] })
      setLastWeekStats({ total: { total: 0 } })
      // 设置错误状态
      setError(error instanceof Error ? error.message : t("未知错误，请检查API服务是否可用"))
    } finally {
      setIsLoading(false)
    }
  }

  // 映射新旧标签页名称
  const mapTabName = (newTab: string) => {
    switch (newTab) {
      case "shipping": return "shipping";    // 发货统计
      case "output": return "output";        // 出力统计
      default: return newTab;                // Overview 保持不变
    }
  }

  // 处理标签切换
  const handleTabChange = (tab: string) => {
    setActiveTab(tab) // 直接设置为传入的标签名称，不再需要映射
  }

  return (
    (<div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNav />
      <main className="container mx-auto px-4 py-6">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium">{t("数据加载失败")}</h3>
              <p className="text-sm mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />{t("重试")}</Button>
            </div>
          </div>
        )}

        {/* 标签页切换UI */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex">
              <button
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === "overview"
                    ? "bg-white text-gray-900 border-b-2 border-gray-900"
                    : "bg-gray-50 text-gray-500 hover:text-gray-900"
                )}
                onClick={() => handleTabChange("overview")}
              >
                {t("Overview")}
              </button>
              <button
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === "shipping"
                    ? "bg-white text-gray-900 border-b-2 border-gray-900"
                    : "bg-gray-50 text-gray-500 hover:text-gray-900"
                )}
                onClick={() => handleTabChange("shipping")}
              >
                {t("发货统计")}
              </button>
              <button
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === "output"
                    ? "bg-white text-gray-900 border-b-2 border-gray-900"
                    : "bg-gray-50 text-gray-500 hover:text-gray-900"
                )}
                onClick={() => handleTabChange("output")}
              >
                {t("出力统计")}
              </button>
            </div>
          </div>
        </div>

        {/* Overview标签页 */}
        {activeTab === "overview" && (
          <>
            {/* 概览汇总卡片 */}
            <div className="mb-6">
              <Card className={cn(
                "transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <CardHeader>
                  <CardTitle className="text-lg">{t("今日数据概览")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {/* 发货总量部分 */}
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-4">{t("发货数据")}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4 flex flex-col items-center justify-center bg-blue-50">
                          <div className="text-sm text-gray-600 mb-1">{t("今日发货总量")}</div>
                          <div className="text-3xl font-bold text-blue-700">
                            {todayStats?.total?.total || 0}
                          </div>
                        </div>
                        <div className="border rounded-lg p-4 flex flex-col items-center justify-center bg-orange-50">
                          <div className="text-sm text-gray-600 mb-1">{t("明日预测总量")}</div>
                          <div className="text-3xl font-bold text-orange-700">
                            {shippingData.tomorrowTotal || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 出力总量部分 - 使用API数据 */}
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-4">{t("出力数据")}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4 flex flex-col items-center justify-center bg-green-50">
                          <div className="text-sm text-gray-600 mb-1">{t("今日出力总量")}</div>
                          {isLoadingTodayOutput ? (
                            <div className="h-10 flex items-center justify-center">
                              <RefreshCw className="h-5 w-5 animate-spin text-green-700" />
                            </div>
                          ) : (
                            <div className="text-3xl font-bold text-green-700">{todayTotalOutput}</div>
                          )}
                        </div>
                        <div className="border rounded-lg p-4 flex flex-col items-center justify-center bg-purple-50">
                          <div className="text-sm text-gray-600 mb-1">{t("明日出力预测")}</div>
                          {isLoadingTomorrowOutput ? (
                            <div className="h-10 flex items-center justify-center">
                              <RefreshCw className="h-5 w-5 animate-spin text-purple-700" />
                            </div>
                          ) : (
                            <div className="text-3xl font-bold text-purple-700">{tomorrowTotalOutput}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 快速操作区域 */}
            <div>
              <Card
                className={cn(
                  "transition-all duration-500",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                )}
                style={{ transitionDelay: "800ms" }}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{t("快速操作")}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <QuickActionCard
                    title={t("添加今日发货数据")}
                    description={t("录入今日的发货数量")}
                    icon={<PlusCircle className="h-5 w-5" />}
                    href="/shipping-data"
                  />
                  <QuickActionCard
                    title={t("查看本月统计")}
                    description={t("查看本月的发货统计数据")}
                    icon={<BarChart2 className="h-5 w-5" />}
                    href="/stats"
                  />
                  <QuickActionCard
                    title={t("管理店铺出力")}
                    description={t("查看和管理店铺出力数据")}
                    icon={<Store className="h-5 w-5" />}
                    href="/shop-output"
                  />
                  <QuickActionCard
                    title={t("管理快递类型")}
                    description={t("添加或编辑快递类型")}
                    icon={<Package className="h-5 w-5" />}
                    href="/courier-types"
                  />
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* 发货统计标签页 */}
        {activeTab === "shipping" && (
          <>
            {/* 今日各快递类型实时发货量 */}
            <div className="mb-6">
              <StatCard
                title={t("今日各快递类型实时发货量")}
                icon={<Package className="h-5 w-5" />}
                isLoading={isLoading}
                isVisible={isVisible}
                delay={100}
                headerRight={
                  <div className="flex items-center space-x-2">
                    <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md flex items-center">
                      <RefreshCw className="h-3 w-3 mr-1 text-gray-500" />
                      {t("下次刷新")}: <span className="font-medium ml-1">{formatCountdown(nextRefreshTime)}</span>
                    </div>
                    <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue placeholder={t("刷新间隔")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30000">{t("30秒")}</SelectItem>
                        <SelectItem value="60000">{t("1分钟")}</SelectItem>
                        <SelectItem value="120000">{t("2分钟")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        refreshTodayStats();
                        setNextRefreshTime(parseInt(refreshInterval) / 1000);
                      }}
                      disabled={isRefreshingTodayStats}
                    >
                      <RefreshCw className={cn("h-4 w-4", isRefreshingTodayStats && "animate-spin")} />
                    </Button>
                  </div>
                }
              >
                {/* 卡片内容，分层级显示快递类型 */}
                {todayStats && (todayStats.by_courier || []).length > 0 ? (
                  <div className="flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* 渲染所有快递类型 */}
                      {activeCourierTypes.map((courierType) => {
                        // 获取该快递类型的统计数据
                        const typeStat = (todayStats.by_courier || []).find(
                          (stat) => stat.courier_id.toString() === courierType.id.toString()
                        );
                        const typeQuantity = typeStat ? typeStat.total : 0;

                        // 创建快递类型卡片
                        return (
                          <div key={courierType.id} className="border rounded-lg p-3 flex flex-col items-center">
                            <div className="text-sm font-medium text-gray-700 mb-2">{courierType.name}</div>
                            <div className="text-2xl font-bold">{typeQuantity}</div>
                          </div>
                        );
                      })}

                      {activeCourierTypes.length === 0 && (
                        <div className="col-span-3 text-center text-gray-500 py-2">{t("暂无活跃快递类型")}</div>
                      )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col">
                      <div className="flex w-full">
                        <div className="w-4/5 flex flex-col items-center">
                          <div className="text-sm text-gray-500 mb-1">{t("今日总数")}</div>
                          <div className="text-4xl font-bold" style={{ color: '#16803C' }}>
                            {todayStats.total && todayStats.total.total ? todayStats.total.total : 0}
                          </div>
                        </div>
                        <div className="w-1/5 flex flex-col items-center border-l border-gray-200">
                          <div className="text-sm text-gray-500 mb-1">{t("预计明日总数")}</div>
                          <div className="text-4xl font-bold" style={{ color: '#ff8c00' }}>
                            {shippingData.tomorrowTotal || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-2">{t("暂无今日数据")}</div>
                )}
              </StatCard>
            </div>

            {/* 数据概览区域 - 三个卡片同行显示 */}
            <div className="grid grid-cols-1 md:grid-cols-10 gap-4 mb-6">
              {/* 近7日发货量 */}
              <StatCard
                title={t("近7日发货量")}
                icon={<TrendingUp className="h-5 w-5" />}
                isLoading={isLoading}
                isVisible={isVisible}
                delay={200}
                className="md:col-span-6"
              >
                {weeklyStats && weeklyStats.total ? (
                  <div className="flex flex-col h-full justify-between">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-1">{weeklyStats.total.total || 0}</div>
                      <div className="flex items-center justify-center text-sm mb-4">
                        <span className="text-gray-500 mr-2">{t("同比上周:")}</span>
                        {weeklyGrowth !== null ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              weeklyGrowth >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            )}
                          >
                            {weeklyGrowth >= 0 ? "+" : ""}{weeklyGrowth}%
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700">
                            --
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mt-auto">
                      {dailyData.map((day, index) => {
                        const dayDate = new Date(day.date);
                        const isToday = format(dayDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                        return (
                          <div key={index} className="flex flex-col items-center p-2">
                            <div className={cn(
                              "text-sm font-medium mb-1",
                              isToday ? "text-blue-600 font-bold" : ""
                            )}>
                              {day.total || 0}
                            </div>
                            <div className="text-xs text-gray-900">{format(dayDate, 'MM-dd')}</div>
                            <div className={cn(
                              "text-xs",
                              isToday ? "text-blue-600 font-semibold" : "text-gray-500"
                            )}>
                              {t(`weekday.full.${format(dayDate, 'EEEE').toLowerCase()}`)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-2">{t("暂无近7日数据")}</div>
                )}
              </StatCard>

              {/* 本月发货总量 */}
              <StatCard
                title={t("本月发货总量")}
                icon={<Calendar className="h-5 w-5" />}
                isLoading={isLoading}
                isVisible={isVisible}
                delay={300}
                className="md:col-span-2"
              >
                {monthlyStats && monthlyStats.total ? (
                  <div className="space-y-3 h-full flex flex-col justify-between">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">{monthlyStats.total.total || 0}</div>
                      <div className="text-sm text-gray-500">{t("上月同期:")}{lastMonthStats && lastMonthStats.total ? (
                        <span className="font-medium text-gray-700">{lastMonthStats.total.total || 0}</span>
                      ) : (
                        <span className="font-medium text-gray-500">--</span>
                      )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 h-24">
                      <div className="h-full w-4 bg-gray-100 rounded-full relative">
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-full"
                          style={{ height: `${monthProgress}%` }}
                        ></div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">{t("月进度")}</div>
                        <div className="font-medium">{monthProgress}%</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-2">{t("暂无本月数据")}</div>
                )}
              </StatCard>

              {/* 当前活跃快递类型 */}
              <StatCard
                title={t("当前活跃快递类型")}
                icon={<Package className="h-5 w-5" />}
                isLoading={isLoading}
                isVisible={isVisible}
                delay={400}
                className="md:col-span-2"
              >
                <div className="space-y-3">
                  <div className="text-3xl font-bold">{activeCourierTypes.length}</div>

                  {/* 层级展示快递类型 */}
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {activeCourierTypes.map(courierType => (
                      <div key={courierType.id} className="space-y-1">
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 mr-1">
                            {courierType.name}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Link href="/courier-types">
                      <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                        {t("管理快递类型")} <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </StatCard>
            </div>

            {/* 合并的数据可视化区域 */}
            <div className="mb-6">
              <Card
                className={cn(
                  "transition-all duration-500",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: "500ms" }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{t("发货数据分析")}</CardTitle>
                      <CardDescription>{t("发货趋势与快递类型分布")}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder={t("选择时间范围")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7days">{t("最近7天")}</SelectItem>
                          <SelectItem value="14days">{t("最近14天")}</SelectItem>
                          <SelectItem value="30days">{t("最近30天")}</SelectItem>
                          <SelectItem value="thisMonth">{t("本月")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedCourierType} onValueChange={setSelectedCourierType}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder={t("选择快递类型")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("所有类型")}</SelectItem>
                          {activeCourierTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* 最近7天发货趋势 */}
                    <div className="lg:col-span-3">
                      <div className="space-y-1 mb-3">
                        <div className="text-sm font-medium">{t("最近7天发货趋势")}</div>
                        <div className="text-xs text-gray-500">{t("按快递类型统计的每日发货量")}</div>
                      </div>
                      <ShippingTrendChart
                        timeRange={selectedTimeRange}
                        courierType={selectedCourierType}
                        isLoading={isLoading}
                      />
                    </div>

                    {/* 快递类型分布 */}
                    <div className="lg:col-span-2">
                      <div className="space-y-1 mb-3">
                        <div className="text-sm font-medium">{t("快递类型分布")}</div>
                        <div className="text-xs text-gray-500">{t("按快递类型统计的发货占比")}</div>
                      </div>
                      <CourierDistributionChart
                        timeRange={selectedTimeRange}
                        isLoading={isLoading}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* 出力统计标签页 */}
        {activeTab === "output" && (
          <>
            {/* 店铺出力数据卡片区域 */}
            <div className="mb-6">
              <ShopOutputCard
                title={t("今日店铺出力")}
                className={cn(
                  "transition-all duration-500",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: "600ms" }}
              />
            </div>

            {/* 明日店铺出力数据卡片区域 */}
            <div className="mb-6">
              <ShopOutputTomorrowCard
                title={t("明日店铺出力")}
                className={cn(
                  "transition-all duration-500",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: "700ms" }}
              />
            </div>
          </>
        )}
      </main>
    </div>)
  );
}
