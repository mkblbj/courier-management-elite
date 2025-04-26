"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, TrendingUp, Package, ChevronRight, Calendar, PlusCircle, BarChart2, Download, AlertCircle, Clock } from "lucide-react"
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
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import useI18n from "@/hooks/use-i18n"

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
  const { t } = useI18n();
  
  const shippingData = useShippingData()

  // 获取今日日期
  const today = format(new Date(), "yyyy-MM-dd")
  const currentMonth = format(new Date(), "yyyy-MM")

  // 添加自动刷新功能
  const { 
    refreshInterval, 
    isRefreshing,
    timeRemaining,
    getFormattedTimeRemaining, 
    getFormattedInterval 
  } = useAutoRefresh(handleRefresh);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 加载仪表盘数据
  useEffect(() => {
    fetchDashboardData();
  }, [today])

  // 获取所有仪表盘数据
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
      setError(error instanceof Error ? error.message : "未知错误，请检查API服务是否可用")
    } finally {
      setIsLoading(false)
    }
  }

  // 刷新数据
  async function handleRefresh() {
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
      setError(error instanceof Error ? error.message : "未知错误，请检查API服务是否可用")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateWeeklyGrowth = () => {
    if (!weeklyStats || !lastWeekStats) return 0;
    
    const currentWeekTotal = weeklyStats.total?.total || 0;
    const lastWeekTotal = lastWeekStats.total?.total || 0;
    
    if (lastWeekTotal === 0) return currentWeekTotal > 0 ? 100 : 0;
    
    return ((currentWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
  }

  const generateDailyData = () => {
    if (!weeklyStats || !weeklyStats.by_date) return [];
    
    return weeklyStats.by_date.map((item: any) => ({
      date: item.date,
      value: item.total,
    }));
  }

  const calculateMonthlyGrowth = () => {
    if (!monthlyStats || !lastMonthStats) return 0;
    
    const currentMonthTotal = monthlyStats.total?.total || 0;
    const lastMonthTotal = lastMonthStats.total?.total || 0;
    
    if (lastMonthTotal === 0) return currentMonthTotal > 0 ? 100 : 0;
    
    return ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  }

  // 获取活跃快递类型
  const activeCourierTypes = (todayStats && todayStats.by_courier ? todayStats.by_courier : [])
    .filter((item: any) => item.total > 0)
    .map((item: any) => {
      const courierType = courierTypes.find(type => type.id === Number(item.courier_type_id));
      return {
        id: item.courier_type_id,
        name: courierType ? courierType.name : `类型 ${item.courier_type_id}`,
        code: courierType ? courierType.code : `${item.courier_type_id}`,
        total: item.total,
      };
    });

  // 渲染开发模式下的自动刷新时间指示器
  const renderAutoRefreshIndicator = () => {
    if (process.env.NODE_ENV === 'development' && refreshInterval) {
      return (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-2 text-xs flex items-center space-x-2 z-50">
          <Clock className="h-3 w-3 text-blue-500" />
          <span>{t('dashboard.autoRefreshTime', { time: getFormattedInterval() })}</span>
          {timeRemaining !== null && (
            <span className="text-gray-400">({getFormattedTimeRemaining()})</span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNav />
      
      {/* 自动刷新指示器 */}
      {renderAutoRefreshIndicator()}
      
      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        {/* 显示错误信息 */}
        {error && (
          <div
            className={cn(
              "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
            style={{ transitionDelay: "100ms" }}
          >
            <div className="flex">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* 数据统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {/* 今日发货数据 */}
          <StatCard
            title={t('dashboard.todayShipping')}
            icon={<Calendar className="h-5 w-5" />}
            isLoading={isLoading}
            isVisible={isVisible}
            delay={100}
          >
            <div className="space-y-3">
              <div className="text-3xl font-bold">{todayStats?.total?.total || 0}</div>
              <div className="flex items-end gap-1">
                <Progress value={50} className="h-2" />
                <span className="text-xs text-gray-500">{format(new Date(), "MM/dd")}</span>
              </div>
            </div>
          </StatCard>

          {/* 本周总数 */}
          <StatCard
            title={t('dashboard.weeklyTotal')}
            icon={<TrendingUp className="h-5 w-5" />}
            isLoading={isLoading}
            isVisible={isVisible}
            delay={200}
          >
            <div className="space-y-3">
              <div className="text-3xl font-bold">{weeklyStats?.total?.total || 0}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {calculateWeeklyGrowth().toFixed(1)}%
                </span>
                <Badge
                  variant={calculateWeeklyGrowth() > 0 ? "success" : calculateWeeklyGrowth() < 0 ? "destructive" : "outline"}
                  className="text-xs"
                >
                  {calculateWeeklyGrowth() > 0 
                    ? t('dashboard.growth')
                    : calculateWeeklyGrowth() < 0 
                    ? t('dashboard.decline')
                    : t('dashboard.noChange')}
                </Badge>
              </div>
            </div>
          </StatCard>

          {/* 本月总数 */}
          <StatCard
            title={t('dashboard.monthlyTotal')}
            icon={<TrendingUp className="h-5 w-5" />}
            isLoading={isLoading}
            isVisible={isVisible}
            delay={300}
          >
            <div className="space-y-3">
              <div className="text-3xl font-bold">{monthlyStats?.total?.total || 0}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {calculateMonthlyGrowth().toFixed(1)}%
                </span>
                <Badge
                  variant={calculateMonthlyGrowth() > 0 ? "success" : calculateMonthlyGrowth() < 0 ? "destructive" : "outline"}
                  className="text-xs"
                >
                  {calculateMonthlyGrowth() > 0 
                    ? t('dashboard.growth')
                    : calculateMonthlyGrowth() < 0 
                    ? t('dashboard.decline')
                    : t('dashboard.noChange')}
                </Badge>
              </div>
            </div>
          </StatCard>

          {/* 本月分布 */}
          <StatCard
            title={t('dashboard.monthlyGrowth')}
            icon={<Package className="h-5 w-5" />}
            isLoading={isLoading}
            isVisible={isVisible}
            delay={400}
            className="md:col-span-2"
          >
            {monthlyStats && monthlyStats.by_date && monthlyStats.by_date.length > 0 ? (
              <div>
                <div className="text-3xl font-bold mb-3">{monthlyStats.total.total}</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.min(100, (monthlyStats.total.total / 500) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-2">{t('common.noData')}</div>
            )}
          </StatCard>

          {/* 当前活跃快递类型 */}
          <StatCard
            title={t('dashboard.activeCourierTypes')}
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
                  <CardTitle className="text-lg">{t('dashboard.shippingAnalysis')}</CardTitle>
                  <CardDescription>{t('dashboard.shippingTrend')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder={t('dashboard.timeRange')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">{t('dashboard.last7Days')}</SelectItem>
                      <SelectItem value="14days">{t('dashboard.last14Days')}</SelectItem>
                      <SelectItem value="30days">{t('dashboard.last30Days')}</SelectItem>
                      <SelectItem value="thisMonth">{t('dashboard.thisMonth')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedCourierType} onValueChange={setSelectedCourierType}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      {activeCourierTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleRefresh} 
                    disabled={isLoading || isRefreshing}
                  >
                    <RefreshCw className={cn("h-4 w-4", (isLoading || isRefreshing) && "animate-spin")} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* 最近7天发货趋势 */}
                <div className="lg:col-span-3">
                  <div className="space-y-1 mb-3">
                    <div className="text-sm font-medium">{t('dashboard.shippingTrend')}</div>
                    <div className="text-xs text-gray-500">{t('dashboard.dailyShipping')}</div>
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
                    <div className="text-sm font-medium">{t('dashboard.shippingDistribution')}</div>
                    <div className="text-xs text-gray-500">{t('dashboard.courierDistribution')}</div>
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
                    <CardTitle className="text-lg">{t('dashboard.recentEntries')}</CardTitle>
                    <CardDescription>{t('nav.shippingData')}</CardDescription>
                  </div>
                  <Link href="/shipping-data">
                    <Button variant="outline" size="sm" className="gap-1">
                      {t('common.viewAll')}
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
                <CardTitle className="text-lg">{t('dashboard.quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <QuickActionCard
                  title={t('dashboard.addTodayData')}
                  description={t('dashboard.todayShipping')}
                  icon={<PlusCircle className="h-5 w-5" />}
                  href="/shipping-data"
                />
                <QuickActionCard
                  title={t('dashboard.viewMonthlyStats')}
                  description={t('dashboard.viewMonthlyStats')}
                  icon={<BarChart2 className="h-5 w-5" />}
                  href="/stats"
                />
                <QuickActionCard
                  title={t('dashboard.exportReport')}
                  description={t('dashboard.exportReport')}
                  icon={<Download className="h-5 w-5" />}
                  href="/stats"
                />
                <QuickActionCard
                  title={t('dashboard.manageCourierTypes')}
                  description={t('dashboard.manageCourierTypes')}
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
