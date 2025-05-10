"use client";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";

import { useEffect, useState } from "react"
import { shippingApi } from "@/services/shipping-api"
import { format, subDays } from "date-fns"
import { LoadingSpinner } from "@/components/loading-spinner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts"
import { useCourierTypes } from "@/hooks/use-courier-types"

interface ShippingTrendChartProps {
  timeRange: string
  courierType: string
  isLoading: boolean
  showHierarchy?: boolean // 控制是否显示层级数据
}

export function ShippingTrendChart({ timeRange, courierType, isLoading, showHierarchy = false }: ShippingTrendChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { courierTypes: courierTypesList } = useCourierTypes(); // 重命名为避免冲突

  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true)
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
        const params: any = {
          date_from: format(startDate, "yyyy-MM-dd"),
          date_to: format(today, "yyyy-MM-dd"),
          chart_type: "shipping_trend", // 指定图表类型，帮助后端区分
          include_details: "true" // 请求包含详细数据，按快递类型划分
        }

        // 如果选择了特定快递类型
        if (courierType !== "all") {
          params.courier_id = courierType
        }

        // 使用getChartData API获取图表数据
        console.log("趋势图API请求参数:", JSON.stringify(params));
        const chartEndpoint = `https://devcourier.toiroworld.com/api/shipping/chart?${new URLSearchParams(params).toString()}`;
        console.log("趋势图完整API URL:", chartEndpoint);

        // 直接调用API获取数据
        const response = await fetch(chartEndpoint);
        const result = await response.json();
        console.log("趋势图API原始响应:", JSON.stringify(result));

        // 检查API响应格式
        if (!result.success || !result.data) {
          console.error("API响应格式错误:", result);
          setChartData([]);
          setLoading(false);
          return;
        }

        const chartData = result.data;

        // 检查数据结构，确保有必要的字段
        if (!chartData || !chartData.labels || !Array.isArray(chartData.labels) ||
          !chartData.datasets || !Array.isArray(chartData.datasets) ||
          !chartData.datasets[0] || !Array.isArray(chartData.datasets[0].data)) {
          console.error("API返回的图表数据格式不正确:", chartData);
          setChartData([]);
          setLoading(false);
          return;
        }

        // 确保labels和data长度一致，防止索引越界
        const labels = chartData.labels || [];
        const data = chartData.datasets[0].data || [];
        const minLength = Math.min(labels.length, data.length);

        console.log(`图表数据长度检查: labels=${labels.length}, data=${data.length}, 使用长度=${minLength}`);

        // 转换为柱状图所需的格式
        const formattedData = [];
        for (let i = 0; i < minLength; i++) {
          try {
            const dateStr = labels[i];
            const value = typeof data[i] === 'string' ? parseInt(data[i], 10) : data[i];

            console.log(`处理日期[${i}]: ${dateStr}, 值: ${value}, 类型: ${typeof data[i]}`);

            // 尝试解析日期
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
              console.error(`无效日期[${i}]: ${dateStr}`);
              continue;
            }

            // 格式化日期为更友好的展示格式
            const formattedDate = format(date, "MM-dd");
            const weekday = format(date, "EEEE").toLowerCase();

            let dataItem: any = {
              date: formattedDate,
              weekday: weekday,
              fullDate: date,
              "发货总数": value || 0
            };

            // 如果需要展示层级数据并且API返回了详细数据
            if (showHierarchy && chartData.details && Array.isArray(chartData.details)) {
              // 查找当前日期的详细数据
              const dateDetails = chartData.details.find(detail =>
                format(new Date(detail.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
              );

              if (dateDetails && dateDetails.courierData && Array.isArray(dateDetails.courierData)) {
                // 添加每种快递类型的数据
                dateDetails.courierData.forEach(courierItem => {
                  const courierName = courierItem.name || `未知类型${courierItem.id}`;
                  dataItem[courierName] = courierItem.count || 0;
                });
              }
            }
            // 模拟层级数据（如果API未返回详细数据）
            else if (showHierarchy && !chartData.details) {
              // 为测试添加一些模拟数据
              const mockCourierTypes = ["顺丰", "申通", "圆通", "韵达", "中通"];
              const total = value || 0;

              // 随机分配总数到各个快递类型
              let remaining = total;
              mockCourierTypes.forEach((type, idx) => {
                if (idx === mockCourierTypes.length - 1) {
                  dataItem[type] = remaining;
                } else {
                  const share = Math.floor(remaining * Math.random() * 0.5);
                  dataItem[type] = share;
                  remaining -= share;
                }
              });
            }

            formattedData.push(dataItem);
          } catch (err) {
            console.error(`日期处理错误[${i}]:`, err);
          }
        }

        console.log("处理后的趋势图表数据:", formattedData);
        if (formattedData.length === 0) {
          console.warn("处理后没有有效数据可显示");
        }

        // 按日期排序
        formattedData.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());

        setChartData(formattedData);
      } catch (error) {
        console.error("获取图表数据失败:", error)
        setChartData([]) // 清空数据，不显示任何图表
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [timeRange, courierType, t, showHierarchy, courierTypesList])

  if (loading || isLoading) {
    return (
      (<div className="flex justify-center items-center h-[300px]">
        <LoadingSpinner size="lg" text={t("加载中...")} />
      </div>)
    );
  }

  // 从图表数据中获取所有数据键
  const dataKeys = chartData.length > 0
    ? Object.keys(chartData[0]).filter(key => key !== 'date' && key !== 'weekday' && key !== 'fullDate')
    : []

  // 动态颜色配置
  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8",
    "#82CA9D", "#FF6B6B", "#6A7FDB", "#41B3A3", "#E27D60"
  ];

  // 自定义工具提示内容
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // 找到与当前标签匹配的数据项
      const dataItem = chartData.find(item => item.date === label);

      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-medium text-gray-700">{`${label} (${dataItem && t(`weekday.short.${dataItem.weekday}`)})`}</p>
          <div className="mt-2">
            {payload.map((entry: any, index: number) => (
              <p key={`item-${index}`} style={{ color: entry.color }}>
                {`${entry.name}: ${entry.value}`}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // 自定义X轴标签组件，显示日期和星期
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;

    try {
      // 查找对应的数据项
      const dataItem = chartData.find(item => item.date === payload.value);
      if (!dataItem) {
        console.log(`未找到对应的日期数据: ${payload.value}`);
        return null;
      }

      // 获取星期几
      const weekday = dataItem.weekday || '';

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
    } catch (error) {
      console.error('渲染X轴标签时出错:', error);
      return (
        <g transform={`translate(${x},${y})`}>
          <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={12}>
            {payload.value}
          </text>
        </g>
      );
    }
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={<CustomXAxisTick />}
            tickLine={false}
          />
          <YAxis
            tickCount={5}
            axisLine={false}
            tickLine={false}
            width={30}
            tickFormatter={(value) => value === 0 ? '0' : `${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* 如果启用层级显示，添加堆叠柱状图 */}
          {showHierarchy && dataKeys.length > 1 ? (
            // 堆叠柱状图模式 - 展示各个快递类型
            dataKeys.filter(key => key !== "发货总数").map((key, index) => (
              <Bar
                key={`bar-${key}-${index}`}
                dataKey={key}
                stackId="a"
                fill={COLORS[index % COLORS.length]}
                name={key}
              />
            ))
          ) : (
            // 非堆叠模式 - 仅展示总数
            <Bar
              dataKey="发货总数"
              fill={theme === "dark" ? "#8884d8" : "#6366f1"}
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              name={t('dashboard.shipping_trend.count')}
            />
          )}

          {/* 添加折线展示趋势 */}
          <Line
            type="monotone"
            dataKey="发货总数"
            stroke={theme === "dark" ? "#ff7300" : "#ff6b3d"}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={t("趋势线")}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
