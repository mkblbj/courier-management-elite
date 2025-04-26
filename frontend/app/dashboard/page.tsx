"use client"

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
        setTodayStats(todayStatsResponse)

        // 获取本月统计数据
        const monthlyStatsResponse = await shippingApi.getShippingStats({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        })
        setMonthlyStats(monthlyStatsResponse)
        
        // 获取上月统计数据
        const lastMonth = new Date().getMonth() === 0 ? 12 : new Date().getMonth()
        const lastMonthYear = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()
        const lastMonthStatsResponse = await shippingApi.getShippingStats({
          month: lastMonth,
          year: lastMonthYear,
        }).catch(() => null)
        setLastMonthStats(lastMonthStatsResponse)
        
        // 获取近7日统计数据
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const weeklyStatsResponse = await shippingApi.getShippingStats({
          startDate: format(sevenDaysAgo, "yyyy-MM-dd"),
          endDate: today,
        })
        setWeeklyStats(weeklyStatsResponse)
        
        // 获取上周统计数据
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
        const lastWeekStatsResponse = await shippingApi.getShippingStats({
          startDate: format(fourteenDaysAgo, "yyyy-MM-dd"),
          endDate: format(sevenDaysAgo, "yyyy-MM-dd"),
        }).catch(() => null)
        setLastWeekStats(lastWeekStatsResponse)
        
        // 获取最近录入数据
        const recentEntriesResponse = await shippingApi.getShippingRecords({
          page: 1,
          perPage: 10,
          sortBy: "created_at",
          sortOrder: "DESC",
        })
        setRecentEntries(recentEntriesResponse.records)
      } catch (error) {
        console.error("加载仪表盘数据失败:", error)
        // 设置错误状态
        setError(error instanceof Error ? error.message : "未知错误，请检查API服务是否可用")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [today])

  // 刷新数据
  const handleRefresh = async () => {
    setIsLoading(true)
    setError(null) // 重置错误状态
    try {
      // 重新获取所有数据
      const todayStatsResponse = await shippingApi.getShippingStats({
        date: today,
      })
      setTodayStats(todayStatsResponse)

      const monthlyStatsResponse = await shippingApi.getShippingStats({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      })
      setMonthlyStats(monthlyStatsResponse)
      
      // 获取上月统计数据
      const lastMonth = new Date().getMonth() === 0 ? 12 : new Date().getMonth()
      const lastMonthYear = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()
      const lastMonthStatsResponse = await shippingApi.getShippingStats({
        month: lastMonth,
        year: lastMonthYear,
      }).catch(() => null)
      setLastMonthStats(lastMonthStatsResponse)
      
      // 获取近7日统计数据
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const weeklyStatsResponse = await shippingApi.getShippingStats({
        startDate: format(sevenDaysAgo, "yyyy-MM-dd"),
        endDate: today,
      })
      setWeeklyStats(weeklyStatsResponse)
      
      // 获取上周统计数据
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      const lastWeekStatsResponse = await shippingApi.getShippingStats({
        startDate: format(fourteenDaysAgo, "yyyy-MM-dd"),
        endDate: format(sevenDaysAgo, "yyyy-MM-dd"),
      }).catch(() => null)
      setLastWeekStats(lastWeekStatsResponse)

      const recentEntriesResponse = await shippingApi.getShippingRecords({
        page: 1,
        perPage: 10,
        sortBy: "created_at",
        sortOrder: "DESC",
      })
      setRecentEntries(recentEntriesResponse.records)
    } catch (error) {
      console.error("刷新数据失败:", error)
      // 设置错误状态
      setError(error instanceof Error ? error.message : "未知错误，请检查API服务是否可用")
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNav />

      <main className="container mx-auto px-4 py-6">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium">数据加载失败</h3>
              <p className="text-sm mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                重试
              </Button>
            </div>
          </div>
        )}
        
        {/* 今日各快递类型实时发货量 - 单独占一行 */}
        <div className="mb-6">
          <StatCard
            title="今日各快递类型实时发货量"
            icon={<Package className="h-5 w-5" />}
            isLoading={isLoading}
            isVisible={isVisible}
            delay={100}
          >
            {todayStats && todayStats.by_courier ? (
              <div className="flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {activeCourierTypes.map((type) => {
                    const courierStat = todayStats.by_courier.find(
                      (stat: any) => stat.courier_id.toString() === type.id.toString(),
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
                    <div className="col-span-3 text-center text-gray-500 py-2">暂无活跃快递类型</div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col items-center">
                  <div className="text-sm text-gray-500 mb-1">今日总数</div>
                  <div className="text-4xl font-bold" style={{ color: '#16803C' }}>
                    {todayStats.total ? todayStats.total.total : 0}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-2">暂无今日数据</div>
            )}
          </StatCard>
        </div>
        
        {/* 数据概览区域 - 三个卡片同行显示 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 近7日发货量 */}
          <StatCard
            title="近7日发货量"
            icon={<TrendingUp className="h-5 w-5" />}
            isLoading={isLoading}
            isVisible={isVisible}
            delay={200}
          >
            {weeklyStats && weeklyStats.total ? (
              <div className="flex flex-col">
                <div className="text-3xl font-bold mb-2">{weeklyStats.total.total || 0}</div>
                <div className="flex items-center text-sm">
                  {weeklyGrowth !== null ? (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        weeklyGrowth >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
                        "mr-2"
                      )}
                    >
                      {weeklyGrowth >= 0 ? "+" : ""}{weeklyGrowth}%
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 mr-2">
                      --
                    </Badge>
                  )}
                  <span className="text-gray-500">同比上周</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-2">暂无近7日数据</div>
            )}
          </StatCard>

          {/* 本月发货总量 */}
          <StatCard
            title="本月发货总量"
            icon={<Calendar className="h-5 w-5" />}
            isLoading={isLoading}
            isVisible={isVisible}
            delay={300}
          >
            {monthlyStats && monthlyStats.total ? (
              <div className="space-y-3">
                <div className="text-3xl font-bold">{monthlyStats.total.total || 0}</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">月进度</span>
                    <span className="font-medium">{monthProgress}%</span>
                  </div>
                  <Progress value={monthProgress} className="h-2" />
                </div>
                <div className="text-sm text-gray-500">
                  上月同期: {lastMonthStats && lastMonthStats.total ? (
                    <span className="font-medium text-gray-700">{lastMonthStats.total.total}</span>
                  ) : (
                    <span className="font-medium text-gray-500">暂无上月数据</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-2">暂无本月数据</div>
            )}
          </StatCard>

          {/* 当前活跃快递类型 */}
          <StatCard
            title="当前活跃快递类型"
            icon={<Package className="h-5 w-5" />}
            isLoading={isLoading}
            isVisible={isVisible}
            delay={400}
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
                  <CardTitle className="text-lg">发货数据分析</CardTitle>
                  <CardDescription>发货趋势与快递类型分布</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="选择时间范围" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">最近7天</SelectItem>
                      <SelectItem value="14days">最近14天</SelectItem>
                      <SelectItem value="30days">最近30天</SelectItem>
                      <SelectItem value="thisMonth">本月</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedCourierType} onValueChange={setSelectedCourierType}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="选择快递类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有类型</SelectItem>
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
                    <div className="text-sm font-medium">最近7天发货趋势</div>
                    <div className="text-xs text-gray-500">按快递类型统计的每日发货量</div>
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
                    <div className="text-sm font-medium">快递类型分布</div>
                    <div className="text-xs text-gray-500">按快递类型统计的发货占比</div>
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
                    <CardTitle className="text-lg">最近录入数据</CardTitle>
                    <CardDescription>发货记录管理</CardDescription>
                  </div>
                  <Link href="/shipping-data">
                    <Button variant="outline" size="sm" className="gap-1">
                      查看全部
                      <ChevronRight className="h-4 w-4" />
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
                <CardTitle className="text-lg">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <QuickActionCard
                  title="添加今日发货数据"
                  description="录入今日的发货数量"
                  icon={<PlusCircle className="h-5 w-5" />}
                  href="/shipping-data"
                />
                <QuickActionCard
                  title="查看本月统计"
                  description="查看本月的发货统计数据"
                  icon={<BarChart2 className="h-5 w-5" />}
                  href="/shipping-data"
                />
                <QuickActionCard
                  title="导出报表"
                  description="导出发货数据报表"
                  icon={<Download className="h-5 w-5" />}
                  href="/stats"
                />
                <QuickActionCard
                  title="管理快递类型"
                  description="添加或编辑快递类型"
                  icon={<Package className="h-5 w-5" />}
                  href="/courier-types"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
