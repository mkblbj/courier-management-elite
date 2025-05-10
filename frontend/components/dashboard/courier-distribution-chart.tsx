"use client";
import { useTranslation } from "react-i18next";

import { useEffect, useState } from "react"
import { shippingApi } from "@/services/shipping-api"
import { format, subDays } from "date-fns"
import { LoadingSpinner } from "@/components/loading-spinner"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useCourierTypes } from "@/hooks/use-courier-types"

interface CourierDistributionChartProps {
  timeRange: string
  isLoading: boolean
  showHierarchy?: boolean // 新增属性，表示是否显示层级结构
}

// 创建一个格式化后的数据类型
interface FormattedChartData {
  name: string;
  fullName: string;
  value: number;
}

export function CourierDistributionChart({ timeRange, isLoading, showHierarchy = false }: CourierDistributionChartProps) {
  const { t } = useTranslation();

  const [chartData, setChartData] = useState<FormattedChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { courierTypes } = useCourierTypes() // 使用hook获取快递类型数据
  // 保存代码到完整名称的映射
  const [codeToFullNameMap, setCodeToFullNameMap] = useState<Record<string, string>>({})

  // 颜色数组
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6", "#f43f5e", "#d946ef", "#84cc16", "#0ea5e9", "#a855f7"]

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true)
      setError(null)
      try {
        // 创建快递类型名称到code的映射和code到完整名称的映射
        const courierCodeMap: Record<string, string> = {}
        const newCodeToFullNameMap: Record<string, string> = {}

        courierTypes.forEach(courier => {
          if (courier.name && courier.code) {
            courierCodeMap[courier.name] = courier.code
            newCodeToFullNameMap[courier.code] = courier.name
          }
        })

        // 更新代码到完整名称的映射
        setCodeToFullNameMap(newCodeToFullNameMap)

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

        console.log("饼图请求参数:", JSON.stringify(params))

        // 获取图表数据
        const response = await shippingApi.getChartData(params)

        console.log("饼图API原始响应:", response)

        // 确保响应是对象类型
        let processedResponse = response || { labels: [], datasets: [{ data: [] }] }

        // 如果响应是null或undefined，使用默认值
        if (!processedResponse) {
          console.warn("饼图API返回空响应")
          setChartData([])
          setLoading(false)
          return
        }

        // 检查并提取可能嵌套的数据
        if (processedResponse.data && typeof processedResponse.data === 'object') {
          console.log("检测到嵌套数据结构，提取内部data字段")
          processedResponse = processedResponse.data
        }

        console.log("处理后的饼图数据:", processedResponse)

        // 检查必要的数据字段
        if (!processedResponse.labels || !Array.isArray(processedResponse.labels) ||
          !processedResponse.datasets || !Array.isArray(processedResponse.datasets) ||
          !processedResponse.datasets[0] || !Array.isArray(processedResponse.datasets[0].data)) {
          console.error("饼图数据格式无效:", processedResponse)
          setError(t("返回的数据格式无效"))
          setChartData([])
          setLoading(false)
          return
        }

        // 检查数据是否实际包含值
        const hasData = processedResponse.labels.length > 0 &&
          processedResponse.datasets[0].data.some((value: number) => value > 0)

        if (!hasData) {
          console.log("饼图没有有效数据")
          setChartData([])
          setLoading(false)
          return
        }

        // 确保标签和数据数组长度一致
        const dataLength = processedResponse.datasets[0].data.length
        const labelsLength = processedResponse.labels.length
        const validLabels = processedResponse.labels.slice(0, dataLength)
        const validData = processedResponse.datasets[0].data.slice(0, labelsLength)

        // 基本格式化数据处理
        let formattedData: FormattedChartData[] = validLabels.map((label: string, index: number) => {
          const fullName = label || `未知类型${index + 1}`
          // 使用映射表获取code，如果没有对应的code则使用原名称
          const code = courierCodeMap[fullName] || fullName

          return {
            name: code, // 使用code作为显示名称
            fullName: fullName, // 保存完整名称
            value: Number(validData[index]) || 0,
          }
        }).filter(item => item.value > 0)

        console.log("最终格式化的饼图数据:", formattedData)

        if (formattedData.length === 0) {
          console.log("没有非零数据可显示")
          setChartData([])
        } else {
          setChartData(formattedData)
        }
      } catch (error) {
        console.error("获取饼图数据失败:", error)
        setError(error instanceof Error ? error.message : "获取图表数据失败")
        setChartData([]) // 清空数据，不显示任何图表
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [timeRange, courierTypes, t, showHierarchy])

  // 图例格式化函数，将code转换为完整名称
  const renderLegendText = (value: string, entry: any) => {
    const fullName = codeToFullNameMap[value] || value;
    return fullName;
  }

  // 检查是否真的有数据要显示
  const hasDisplayableData = chartData.length > 0 && chartData.some(item => item.value > 0)

  if (loading || isLoading) {
    return (
      (<div className="flex justify-center items-center h-[300px]">
        <LoadingSpinner size="lg" text={t("加载中...")} />
      </div>)
    );
  }

  if (error) {
    return (
      (<div className="flex flex-col justify-center items-center h-[300px] text-red-500">
        <div>{t("加载饼图数据失败")}</div>
        <div className="text-sm mt-2">{error}</div>
      </div>)
    );
  }

  if (!hasDisplayableData) {
    return (<div className="flex justify-center items-center h-[300px] text-gray-500">{t("所选时间范围内没有数据")}</div>);
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
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => {
              const item = props.payload;
              return [`${value} 件`, item.fullName || name];
            }}
          />
          <Legend formatter={renderLegendText} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
