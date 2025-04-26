"use client"

import { useEffect, useState } from "react"
import { shippingApi } from "@/services/shipping-api"
import { format, subDays } from "date-fns"
import { LoadingSpinner } from "@/components/loading-spinner"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface CourierDistributionChartProps {
  timeRange: string
  isLoading: boolean
}

export function CourierDistributionChart({ timeRange, isLoading }: CourierDistributionChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"]

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true)
      setError(null)
      try {
        // 计算日期范围
        const today = new Date()
        let startDate

        switch (timeRange) {
          case "7days":
            startDate = subDays(today, 6)
            break
          case "14days":
            startDate = subDays(today, 13)
            break
          case "30days":
            startDate = subDays(today, 29)
            break
          case "thisMonth":
            startDate = new Date(today.getFullYear(), today.getMonth(), 1)
            break
          default:
            startDate = subDays(today, 6)
        }

        // 构建API请求参数
        const params = {
          date_from: format(startDate, "yyyy-MM-dd"),
          date_to: format(today, "yyyy-MM-dd"),
          type: "pie",
        }

        console.log("饼图请求参数:", params)

        // 获取图表数据
        const response = await shippingApi.getChartData(params)
        
        console.log("饼图API响应:", response)

        // 检查响应数据是否有效
        if (!response || !response.labels || !response.datasets || !response.datasets[0] || !response.datasets[0].data) {
          console.error("饼图数据格式无效:", response)
          setError("返回的数据格式无效")
          setChartData([])
          return
        }

        // 检查数据是否为空
        if (response.labels.length === 0 || response.datasets[0].data.length === 0) {
          console.log("饼图没有数据")
          setChartData([])
          return
        }
        
        // 处理数据格式以适应图表组件
        const formattedData = response.labels.map((label: string, index: number) => ({
          name: label,
          value: response.datasets[0].data[index],
        }))
        
        console.log("格式化后的饼图数据:", formattedData)
        setChartData(formattedData)
      } catch (error) {
        console.error("获取饼图数据失败:", error)
        setError(error instanceof Error ? error.message : "获取图表数据失败")
        setChartData([]) // 清空数据，不显示任何图表
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [timeRange])

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[300px] text-red-500">
        <div>加载饼图数据失败</div>
        <div className="text-sm mt-2">{error}</div>
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="flex justify-center items-center h-[300px] text-gray-500">
        所选时间范围内没有数据
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} 件`, "数量"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
