"use client";

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiError } from "@/components/api-error"
import { LoadingSpinner } from "@/components/loading-spinner"
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
  ResponsiveContainer
} from "recharts"
import { useTranslation } from "react-i18next";
import type { StatisticsData } from "@/hooks/use-statistics-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDisplayDate } from "@/lib/date-utils" // 添加时区格式化工具
import { Skeleton } from "@/components/ui/skeleton"

interface StatisticsChartProps {
  data: StatisticsData | null
  isLoading: boolean
  error: string | null
}

export function StatisticsChart({ data, isLoading, error }: StatisticsChartProps) {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  // 过滤掉名字中包含"未指定"的快递类型
  const filterUnspecifiedCouriers = (items: any[]) => {
    return items.filter(item => !item.courierName?.includes('未指定'))
  }

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return <ApiError message={error} onRetry={() => { }} />;
  }

  if (!data) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        {t("无数据可显示")}
      </div>
    );
  }

  // 过滤数据
  const filteredByCourier = filterUnspecifiedCouriers(data.byCourier)
  const filteredByDate = data.byDate.map(dateItem => ({
    ...dateItem,
    details: dateItem.details ? filterUnspecifiedCouriers(dateItem.details) : []
  }))

  // 准备柱状图数据
  const barData = filteredByDate.map((item) => {
    const dateObj = new Date(item.date);
    const result: any = {
      // 使用时区日期格式化替代format
      date: formatDisplayDate(dateObj, "MM-dd"),
      weekday: formatDisplayDate(dateObj, "EEEE").toLowerCase(),
      fullDate: dateObj, // 存储完整日期对象以便后续使用
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
  const courierTypes = Array.from(
    new Set(
      filteredByDate
        .flatMap((item) => item.details || [])
        .map((detail) => detail.courierName)
    )
  );

  // 准备饼图数据
  let pieData = filteredByCourier
    .filter((item) => item.total > 0) // 只保留有数据的项目
    .map((item) => ({
      name: item.courierName,
      value: item.total,
    }));

  // 饼图颜色
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FF6B6B",
    "#6A7FDB",
    "#41B3A3",
    "#E27D60",
  ];

  // 自定义工具提示内容
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // 找到与当前标签匹配的数据项
      const dataItem = barData.find(item => item.date === payload[0].payload.date);

      return (
        <div className="bg-background dark:bg-gray-800 p-4 border rounded shadow-lg">
          <p className="font-medium text-gray-700">{`${label} (${dataItem ? dataItem.weekday : ''})`}</p>
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

  // 自定义饼图工具提示
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = pieData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((data.value / total) * 100).toFixed(2);

      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-700">{data.name}</p>
          <p style={{ color: data.color }}>{`数量: ${data.value.toLocaleString()}`}</p>
          <p style={{ color: data.color }}>{`占比: ${percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill="#666"
          fontSize={12}
        >
          {payload.value}
        </text>
        <text
          x={0}
          y={16}
          dy={12}
          textAnchor="middle"
          fill="#999"
          fontSize={10}
        >
          {/* 使用对应的星期几 */}
          {barData.find(item => item.date === payload.value)?.weekday
            ? t(`weekday.short.${barData.find(item => item.date === payload.value)?.weekday}`)
            : ''}
        </text>
      </g>
    );
  };

  // 渲染饼图
  const renderPieChart = () => {
    if (pieData.length === 0) {
      return (
        <div className="h-[400px] w-full flex items-center justify-center">
          <p className="text-muted-foreground">{t("没有数据可以显示饼图")}</p>
        </div>
      );
    }

    // 计算总数，用于显示百分比
    const total = pieData.reduce((sum, item) => sum + item.value, 0);
    const pieDataWithTotal = pieData.map(item => ({ ...item, total }));

    // 自定义标签函数，只显示占比大于等于5%的标签
    const renderCustomLabel = ({ name, percent }: any) => {
      // 只有当占比大于等于5%时才显示标签
      if (percent >= 0.05) {
        return `${name} (${(percent * 100).toFixed(1)}%)`;
      }
      return null; // 小于5%的不显示标签
    };

    // 自定义图例格式化函数
    const formatLegend = (value: string, entry: any) => {
      const percent = ((entry.payload.value / total) * 100).toFixed(1);
      return (
        <span className="text-sm text-slate-700">
          {value} ({percent}% - {entry.payload.value.toLocaleString()})
        </span>
      );
    };

    return (
      <div className="h-[500px] w-full flex flex-col">
        {/* 饼图容器 */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieDataWithTotal}
                cx="50%"
                cy="45%" // 稍微上移，为下方图例留出空间
                labelLine={true}
                label={renderCustomLabel}
                outerRadius={100} // 稍微减小半径，为图例留出空间
                fill="#8884d8"
                dataKey="value"
              >
                {pieDataWithTotal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={80}
                formatter={formatLegend}
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '12px',
                  lineHeight: '1.5'
                }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // 渲染柱状图
  const renderBarChart = () => {
    if (barData.length === 0) {
      return (
        <div className="h-[400px] w-full flex items-center justify-center">
          <p className="text-muted-foreground">{t("没有数据可以显示柱状图")}</p>
        </div>
      );
    }

    return (
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={<CustomXAxisTick />} height={60} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {courierTypes.map((courierType, index) => (
              <Bar
                key={`bar-${courierType}`}
                dataKey={courierType}
                stackId="a"
                fill={COLORS[index % COLORS.length]}
                name={courierType}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          {t("数据可视化")}
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChartType("bar")}
            className={cn(
              chartType === "bar" && "bg-muted"
            )}
          >
            {t("柱状图")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChartType("pie")}
            className={cn(
              chartType === "pie" && "bg-muted"
            )}
          >
            {t("饼图")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chartType === "bar" && renderBarChart()}
        {chartType === "pie" && renderPieChart()}
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md font-medium">
          <Skeleton className="h-5 w-40" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </CardContent>
    </Card>
  );
}
