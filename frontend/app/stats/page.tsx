"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, BarChart2, Download, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatisticsTable } from "@/components/stats/statistics-table"
import { StatisticsChart } from "@/components/stats/statistics-chart"
import { StatisticsFilter } from "@/components/stats/statistics-filter"
import { ExportDataDialog } from "@/components/stats/export-data-dialog"
import { useStatisticsData } from "@/hooks/use-statistics-data"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"

export default function StatsPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("table")
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  const { data, isLoading, error, timeRange, courierTypeFilter, setTimeRange, setCourierTypeFilter, refetch } =
    useStatisticsData()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNav />
      
      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <PageHeader 
          title="统计分析" 
          description="查看和导出发货数据统计分析" 
          className="max-w-5xl mx-auto"
          action={
            <Button
              className="bg-blue-600 hover:bg-blue-700 transition-all duration-300"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Download className="mr-2 h-4 w-4" />
              导出数据
            </Button>
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
                <CardTitle className="text-lg font-medium">发货数据统计</CardTitle>
                <StatisticsFilter
                  timeRange={timeRange}
                  courierTypeFilter={courierTypeFilter}
                  onTimeRangeChange={setTimeRange}
                  onCourierTypeFilterChange={setCourierTypeFilter}
                  onRefresh={refetch}
                  isLoading={isLoading}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>表格视图</span>
                  </TabsTrigger>
                  <TabsTrigger value="chart" className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    <span>图表视图</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="table" className="animate-fade-in">
                  <StatisticsTable data={data} isLoading={isLoading} error={error} onRetry={refetch} />
                </TabsContent>

                <TabsContent value="chart" className="animate-fade-in">
                  <StatisticsChart data={data} isLoading={isLoading} error={error} onRetry={refetch} />
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
      </main>
    </div>
  )
}
