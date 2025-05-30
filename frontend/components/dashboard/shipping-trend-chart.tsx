"use client";
import { useTranslation } from "react-i18next";

import { useEffect, useState } from "react"
import { shippingApi } from "@/services/shipping-api"
import { format, subDays } from "date-fns"
import { LoadingSpinner } from "@/components/loading-spinner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, Cell } from "recharts"
import { useCourierTypes } from "@/hooks/use-courier-types"

interface ShippingTrendChartProps {
  timeRange: string
  courierType: string
  isLoading: boolean
}

export function ShippingTrendChart({ timeRange, courierType, isLoading }: ShippingTrendChartProps) {
  const { t } = useTranslation();

  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true)
      try {
        // 计算日期范围（排除今天）
        const today = new Date()
        const yesterday = subDays(today, 1)
        let startDate

        switch (timeRange) {
          case "7days":
            startDate = subDays(yesterday, 6)
            break
          case "14days":
            startDate = subDays(yesterday, 13)
            break
          case "30days":
            startDate = subDays(yesterday, 29)
            break
          case "thisMonth":
            startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), 1)
            break
          default:
            startDate = subDays(yesterday, 6)
        }

        // 构建API请求参数
        const params: any = {
          date_from: format(startDate, "yyyy-MM-dd"),
          date_to: format(yesterday, "yyyy-MM-dd"),
        }

        // 如果选择了特定快递类型
        if (courierType !== "all") {
          params.courier_id = courierType
        }

        // 获取发货记录数据
        const response = await shippingApi.getShippingStatsDetails(params)

        // 按日期分组处理数据
        const dateMap = new Map<string, any>()

        // 初始化日期范围内的所有日期
        let currentDate = new Date(startDate)
        while (currentDate <= yesterday) {
          const dateStr = format(currentDate, "MM-dd")
          const weekday = format(currentDate, "EEEE").toLowerCase()
          dateMap.set(dateStr, {
            date: dateStr,
            weekday: weekday, // 存储星期信息
            fullDate: new Date(currentDate), // 存储完整日期对象以便后续使用
            totalShipping: 0 // 初始化当天总发货量
          })

          currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
        }

        // 获取所有快递类型并初始化（过滤掉"未指定"的快递类型）
        const courierTypes = new Set<string>()
        if (response.by_date_and_courier && Array.isArray(response.by_date_and_courier)) {
          response.by_date_and_courier.forEach((item: any) => {
            if (item.courier_name && !item.courier_name.includes('未指定')) {
              courierTypes.add(item.courier_name)
            }
          })
        }

        // 为每个日期初始化所有快递类型为0
        dateMap.forEach((value) => {
          courierTypes.forEach((courierName) => {
            value[courierName] = 0
          })
        })

        // 填充实际数据
        if (response.by_date_and_courier && Array.isArray(response.by_date_and_courier)) {
          response.by_date_and_courier.forEach((item: any) => {
            if (item.date && item.courier_name && !item.courier_name.includes('未指定')) {
              const dateKey = format(new Date(item.date), "MM-dd")
              if (dateMap.has(dateKey)) {
                const dateData = dateMap.get(dateKey)
                const itemTotal = Number(item.total) || 0
                dateData[item.courier_name] = itemTotal
                // 累加到当天总发货量
                dateData.totalShipping += itemTotal
              }
            }
          })
        }

        // 转换为数组
        const formattedData = Array.from(dateMap.values()).sort((a, b) => {
          const dateA = new Date(`${new Date().getFullYear()}-${a.date}`)
          const dateB = new Date(`${new Date().getFullYear()}-${b.date}`)
          return dateA.getTime() - dateB.getTime()
        })

        setChartData(formattedData)
      } catch (error) {
        console.error("获取图表数据失败:", error)
        setChartData([]) // 清空数据，不显示任何图表
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [timeRange, courierType, t])

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <LoadingSpinner size="lg" text={t("加载中...")} />
      </div>
    );
  }

  // 从图表数据中获取所有快递类型（过滤掉"未指定"的快递类型）
  const courierTypes = chartData.length > 0
    ? Object.keys(chartData[0]).filter(key =>
      key !== 'date' &&
      key !== 'weekday' &&
      key !== 'fullDate' &&
      key !== 'totalShipping' &&
      !key.includes('未指定')
    )
    : []

  // 自定义X轴标签组件，显示日期和星期
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const dataItem = chartData.find(item => item.date === payload.value);
    const weekday = dataItem?.weekday;

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={12}>
          {payload.value}
        </text>
        <text x={0} y={0} dy={32} textAnchor="middle" fill="#666" fontSize={10}>
          {t(`weekday.short.${weekday}`)}
        </text>
      </g>
    );
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 0,
            bottom: 20, // 增加底部边距以容纳星期显示
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={<CustomXAxisTick />} height={60} />
          <YAxis />
          <Tooltip />
          <Legend />
          {courierTypes.map((type, index) => {
            const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]
            return (
              <Bar key={type} dataKey={type} fill={colors[index % colors.length]} />
            )
          })}
          <Line
            type="monotone"
            dataKey="totalShipping"
            stroke="#ea580c"
            strokeWidth={2}
            dot={{ r: 4 }}
            name={t("总发货量")}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
