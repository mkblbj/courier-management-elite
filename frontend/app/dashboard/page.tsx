"use client";
import { useTranslation } from "react-i18next";

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, TrendingUp, Package, ChevronRight, Calendar, PlusCircle, BarChart2, Download, AlertCircle } from "lucide-react"
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
import { RecentEntries } from "@/components/recent-entries"
import { useShippingData } from "@/hooks/use-shipping-data"

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

  const shippingData = useShippingData()

  // 获取今日日期
  const today = format(new Date(), "yyyy-MM-dd")
  const currentMonth = format(new Date(), "yyyy-MM")

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

  // 刷新数据
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

  // 获取活跃的快递类型
  const activeCourierTypes = courierTypes.filter((type) => type.is_active)

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
        
        {/* 今日各快递类型实时发货量 - 单独占一行 */}
        <div className="mb-6">
          <StatCard
            title={t("今日各快递类型实时发货量")}
            icon={<Package className="h-5 w-5" />}
            isLoading={isLoading}
            isVisible={isVisible}
            delay={100}
          >
            {todayStats && (todayStats.by_courier || []).length > 0 ? (
              <div className="flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {activeCourierTypes.map((type) => {
                    const courierStat = (todayStats.by_courier || []).find(
                      (stat) => stat.courier_id.toString() === type.id.toString(),
                    )
                    const quantity = courierStat ? courierStat.total : 0

                    return (
                      <div key={type.id} className="border rounded-lg p-3 flex flex-col items-center">
                        <div className="text-sm font-medium text-gray-700 mb-2">{type.name}</div>
                        <div className="text-2xl font-bold">{quantity}</div>
                      </div>
                    )
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
                          {format(dayDate, 'EEE')}
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
              <div className="flex flex-wrap gap-2">
                {activeCourierTypes.slice(0, 5).map((type) => (
                  <Badge key={type.id} variant="outline" className="bg-blue-50 text-blue-700">
                    {type.name}
                  </Badge>
                ))}
                {activeCourierTypes.length > 5 && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-700">
                    +{activeCourierTypes.length - 5}
                  </Badge>
                )}
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
                  <CourierDistributionChart timeRange={selectedTimeRange} isLoading={isLoading} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 操作区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 最近录入数据 */}
          <div className="lg:col-span-2">
            <Card
              className={cn(
                "transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{ transitionDelay: "700ms" }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{t("最近录入数据")}</CardTitle>
                    <CardDescription>{t("发货记录管理")}</CardDescription>
                  </div>
                  <Link href="/shipping-data">
                    <Button variant="outline" size="sm" className="gap-1">{t("查看全部")}<ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <RecentEntries
                  entries={shippingData.entries}
                  totalRecords={shippingData.totalRecords}
                  currentPage={shippingData.currentPage}
                  totalPages={shippingData.totalPages}
                  pageSize={shippingData.pageSize}
                  dateFilter={shippingData.dateFilter}
                  onUpdate={shippingData.updateEntry}
                  onDelete={shippingData.deleteEntry}
                  onRefresh={shippingData.refetch}
                  onPageChange={shippingData.changePage}
                  onPageSizeChange={shippingData.changePageSize}
                  onFilterChange={shippingData.setFilter}
                  onClearFilters={shippingData.clearFilters}
                  isLoading={shippingData.isLoading}
                />
              </CardContent>
            </Card>
          </div>

          {/* 快速操作 */}
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
              <CardContent className="grid grid-cols-1 gap-4">
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
                  title={t("导出报表")}
                  description={t("导出发货数据报表")}
                  icon={<Download className="h-5 w-5" />}
                  href="/stats"
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
        </div>
      </main>
    </div>)
  );
}
