"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiError } from "@/components/api-error"
import { LoadingSpinner } from "@/components/loading-spinner"
import { format } from "date-fns"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { StatisticsData } from "@/hooks/use-statistics-data"

interface StatisticsChartProps {
  data: StatisticsData | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

export function StatisticsChart({ data, isLoading, error, onRetry }: StatisticsChartProps) {
  const [chartType, setChartType] = useState("distribution")

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#6366f1",
    "#0ea5e9",
    "#14b8a6",
    "#f43f5e",
    "#84cc16",
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    )
  }

  if (error) {
    return <ApiError message={error} onRetry={onRetry} />
  }

  if (!data) {
    return <div className="text-center py-8 text-muted-foreground">暂无统计数据</div>
  }

  // 准备饼图数据
  const pieData = data.byCourier.map((item) => ({
    name: item.courierName,
    value: Number(item.total) || 0,
  }))

  // 准备柱状图数据
  const barData = data.byDate.map((item) => {
    const result: any = {
      date: format(new Date(item.date), "MM-dd"),
    }

    // 为每个快递类型添加数据
    if (item.details) {
      item.details.forEach((detail) => {
        result[detail.courierName] = detail.total
      })
    }

    return result
  })

  // 获取所有快递类型名称（用于柱状图图例）
  const courierNames = data.byCourier.map((item) => item.courierName)

  return (
    <div className="space-y-6">
      <Tabs value={chartType} onValueChange={setChartType} className="w-full">
        <TabsList className="w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="distribution">快递类型分布</TabsTrigger>
          <TabsTrigger value="trend">发货趋势</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-center">快递类型分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} 件`, "数量"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-center">发货趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {courierNames.map((name, index) => (
                      <Bar key={name} dataKey={name} stackId="a" fill={COLORS[index % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
