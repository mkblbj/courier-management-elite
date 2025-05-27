"use client"
import { useTranslation } from "react-i18next";

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, BarChart2, Download, FileText, HelpCircle, BarChart, LineChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatisticsTable } from "@/components/stats/statistics-table"
import { StatisticsChart } from "@/components/stats/statistics-chart"
import { StatisticsFilter } from "@/components/stats/statistics-filter"
import { ExportDataDialog } from "@/components/stats/export-data-dialog"
import { useStatisticsData } from "@/hooks/use-statistics-data"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { subDays } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ShopOutputStats from "./components/ShopOutputStats"
import { useSearchParams, useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

// 创建一个内部组件来使用useSearchParams，以便用Suspense包装
function StatsPageContent() {
  const { t } = useTranslation();
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("table")
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  // 获取当前激活的统计类型
  const statsType = searchParams.get('type') || 'shipping'

  // 切换统计类型
  const handleStatsTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', value)
    router.push(`?${params.toString()}`)
  }

  const {
    data,
    isLoading,
    error,
    timeRange,
    courierTypeFilter,
    refetch,
    setTimeRange,
    setCourierTypeFilter
  } = useStatisticsData()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 重置函数 - 将所有筛选条件重置为默认值
  const handleReset = () => {
    // 重置为当月
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    setTimeRange({
      from: firstDayOfMonth,
      to: today,
    })

    // 重置快递类型筛选
    setCourierTypeFilter([])

    // 重新加载数据
    refetch()
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <DashboardNav />
      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <div
          className={cn(
            "transition-all duration-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          {/* 统计类型选择卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-5xl mx-auto">
            {/* 发货数据统计卡片 */}
            <div
              className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${statsType === 'shipping'
                ? 'border-primary bg-primary/10 dark:bg-primary/5'
                : 'border-border hover:border-primary/40'
                }`}
              onClick={() => handleStatsTypeChange('shipping')}
            >
              <div className="flex items-center gap-3 mb-2">
                <BarChart className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-medium">{t("发货数据统计")}</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                {t("查看和分析发货数据的各项指标和趋势")}
              </p>
            </div>

            {/* 出力统计卡片 */}
            <div
              className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${statsType === 'shop-output'
                ? 'border-primary bg-primary/10 dark:bg-primary/5'
                : 'border-border hover:border-primary/40'
                }`}
              onClick={() => handleStatsTypeChange('shop-output')}
            >
              <div className="flex items-center gap-3 mb-2">
                <LineChart className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-medium">{t("店铺出力统计")}</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                {t("查看和分析店铺出力数据的各项指标和趋势")}
              </p>
            </div>
          </div>

          {/* 发货数据统计内容 */}
          {statsType === 'shipping' && (
            <Card className="border max-w-5xl mx-auto">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center">
                    <CardTitle className="text-lg font-medium">{t("发货数据统计")}</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{t("统计数据展示了按不同快递类型的发货量分布情况。")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatisticsFilter
                      timeRange={timeRange}
                      courierTypeFilter={courierTypeFilter}
                      onTimeRangeChange={setTimeRange}
                      onCourierTypeFilterChange={setCourierTypeFilter}
                      onRefresh={refetch}
                      onReset={handleReset}
                      isLoading={isLoading}
                    />
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 transition-all duration-300"
                      onClick={() => setIsExportDialogOpen(true)}
                    >
                      <Download className="mr-2 h-4 w-4" />{t("导出数据")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="table" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{t("表格视图")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="chart" className="flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      <span>{t("图表视图")}</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="table" className="animate-fade-in">
                    <StatisticsTable
                      data={data}
                      isLoading={isLoading}
                      error={error}
                      onRetry={refetch}
                    />
                  </TabsContent>

                  <TabsContent value="chart" className="animate-fade-in">
                    <StatisticsChart
                      data={data}
                      isLoading={isLoading}
                      error={error}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* 出力统计内容 */}
          {statsType === 'shop-output' && (
            <div className="max-w-5xl mx-auto">
              <ShopOutputStats />
            </div>
          )}
        </div>

        <ExportDataDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          timeRange={timeRange}
          courierTypeFilter={courierTypeFilter}
          statsType={statsType as 'shipping' | 'shop-output'}
        />
      </main>
    </div>
  )
}

// 定义loading状态
function StatsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <DashboardNav />
      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>

          <Skeleton className="h-[500px] rounded-lg" />
        </div>
      </main>
    </div>
  )
}

export default function StatsPage() {
  return (
    <Suspense fallback={<StatsPageSkeleton />}>
      <StatsPageContent />
    </Suspense>
  );
}
