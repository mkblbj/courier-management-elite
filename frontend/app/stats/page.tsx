"use client"
import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, BarChart2, Download, FileText, HelpCircle } from "lucide-react"
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
import OutputSummary from "@/app/output-data/components/OutputSummary"

export default function StatsPage() {
  const { t } = useTranslation();

  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("table")
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  const {
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
    refetch
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

    // 重置视图模式为平铺视图
    setViewMode("flat")

    // 重新加载数据
    refetch()
  }

  return (
    (<div className="min-h-screen bg-background">
      <DashboardHeader />
      <DashboardNav />
      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <PageHeader
          title={t("统计分析")}
          description={t("查看和导出发货数据统计分析")}
          className="max-w-5xl mx-auto"
          action={
            <Button
              className="bg-blue-600 hover:bg-blue-700 transition-all duration-300"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Download className="mr-2 h-4 w-4" />{t("导出数据")}</Button>
          }
        />

        <div
          className={cn(
            "transition-all duration-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
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
                        <p>{t("母类型数据包含其自身数据和子类型数据之和。切换到层级视图以查看更详细的层级统计。")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <StatisticsFilter
                  timeRange={timeRange}
                  courierTypeFilter={courierTypeFilter}
                  onTimeRangeChange={setTimeRange}
                  onCourierTypeFilterChange={setCourierTypeFilter}
                  onRefresh={refetch}
                  onReset={handleReset}
                  isLoading={isLoading}
                />
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
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    expandedItems={expandedItems}
                    onToggleExpanded={toggleItemExpanded}
                    onToggleAllExpanded={toggleAllExpanded}
                  />
                </TabsContent>

                <TabsContent value="chart" className="animate-fade-in">
                  <StatisticsChart
                    data={data}
                    isLoading={isLoading}
                    error={error}
                    onRetry={refetch}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <ExportDataDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          timeRange={timeRange}
          courierTypeFilter={courierTypeFilter}
        />

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general">{t("一般统计")}</TabsTrigger>
            <TabsTrigger value="shop-output">{t("出力统计")}</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="text-center p-12 text-muted-foreground">{t("一般统计内容")}</div>
          </TabsContent>

          <TabsContent value="shop-output">
            <OutputSummary />
          </TabsContent>
        </Tabs>
      </main>
    </div>)
  );
}
