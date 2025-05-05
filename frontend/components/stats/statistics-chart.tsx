"use client";
import { useTranslation } from "react-i18next";

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
  Treemap,
} from "recharts"
import type { StatisticsData } from "@/hooks/use-statistics-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StatisticsChartProps {
  data: StatisticsData | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
  viewMode?: "flat" | "hierarchical"
  onViewModeChange?: (mode: "flat" | "hierarchical") => void
}

export function StatisticsChart({ 
  data, 
  isLoading, 
  error, 
  onRetry,
  viewMode = "flat",
  onViewModeChange
}: StatisticsChartProps) {
  const {
    t: t
  } = useTranslation();

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
      (<div className="flex justify-center items-center h-[400px]">
        <LoadingSpinner size="lg" text={t("加载中...")} />
      </div>)
    );
  }

  if (error) {
    return <ApiError message={error} onRetry={onRetry} />
  }

  if (!data) {
    return <div className="text-center py-8 text-muted-foreground">{t("暂无统计数据")}</div>;
  }

  // 准备饼图数据 - 平铺视图
  const flatPieData = data.byCourier.map((item) => ({
    name: item.courierName,
    value: Number(item.total) || 0,
  }))

  // 准备饼图数据 - 层级视图
  const prepareHierarchicalPieData = () => {
    if (!data.hierarchical || data.hierarchical.length === 0) return [];
    
    // 使用母类型的total_with_children作为数据
    return data.hierarchical.map(item => ({
      name: item.name,
      value: Number(item.total_with_children) || 0,
      children: item.children.map(child => ({
        name: child.name,
        value: Number(child.total_with_children) || 0,
      }))
    }));
  };
  
  const hierarchicalPieData = prepareHierarchicalPieData();
  
  // 准备矩形树图数据
  const prepareTreemapData = () => {
    if (!data.hierarchical || data.hierarchical.length === 0) return [];
    
    return data.hierarchical.map(parent => ({
      name: parent.name,
      value: parent.own_total, // 仅母类型自身的数据
      children: parent.children.map(child => ({
        name: child.name,
        value: child.total_with_children,
        parentName: parent.name
      }))
    }));
  };
  
  const treemapData = prepareTreemapData();

  // 准备柱状图数据
  const barData = data.byDate.map((item) => {
    const dateObj = new Date(item.date);
    const result: any = {
      date: format(dateObj, "MM-dd"),
      weekday: format(dateObj, "EEEE").toLowerCase(),
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
  const courierNames = data.byCourier.map((item) => item.courierName)

  // 自定义X轴标签组件，显示日期和星期
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const dataItem = barData.find(item => item.date === payload.value);
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
  
  // 自定义矩形树图tooltip
  const CustomTreemapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white p-2 border rounded shadow-md text-sm">
          <p className="font-medium">{data.name}</p>
          <p>{t("数量")}: {data.value}</p>
          {data.parentName && <p>{t("父类型")}: {data.parentName}</p>}
        </div>
      );
    }
    
    return null;
  };

  // 自定义矩形树图内容
  const CustomTreemapContent = ({ root, depth, x, y, width, height, index, name, value }: any) => {
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: COLORS[index % COLORS.length],
            stroke: '#fff',
            strokeWidth: 2,
            opacity: depth === 1 ? 0.8 : 1,
          }}
        />
        {width > 50 && height > 25 ? (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={10}
          >
            {name}
          </text>
        ) : null}
        {width > 50 && height > 50 ? (
          <text
            x={x + width / 2}
            y={y + height / 2 + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={9}
          >
            {value}
          </text>
        ) : null}
      </g>
    );
  };

  return (
    (<div className="space-y-6">
      {/* 添加视图模式切换按钮 */}
      {onViewModeChange && (
        <div className="flex justify-end">
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "flat" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "rounded-none border-0",
                viewMode === "flat" ? "bg-primary text-primary-foreground" : "bg-transparent hover:bg-muted"
              )}
              onClick={() => onViewModeChange("flat")}
            >
              {t("平铺视图")}
            </Button>
            <Button
              variant={viewMode === "hierarchical" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "rounded-none border-0",
                viewMode === "hierarchical" ? "bg-primary text-primary-foreground" : "bg-transparent hover:bg-muted"
              )}
              onClick={() => onViewModeChange("hierarchical")}
            >
              {t("层级视图")}
            </Button>
          </div>
        </div>
      )}
      
      <Tabs value={chartType} onValueChange={setChartType} className="w-full">
        <TabsList className="w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="distribution">{t("快递类型分布")}</TabsTrigger>
          <TabsTrigger value="trend">{t("发货趋势")}</TabsTrigger>
          {viewMode === "hierarchical" && data.hierarchical && data.hierarchical.length > 0 && (
            <TabsTrigger value="treemap">{t("层级占比")}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="distribution" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-center">
                {viewMode === "flat" ? t("快递类型分布") : t("母类型分布（含子类型统计）")}
                {viewMode === "hierarchical" && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {t("注意：图表显示的是包含子类型在内的总数据")}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={viewMode === "flat" ? flatPieData : hierarchicalPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {(viewMode === "flat" ? flatPieData : hierarchicalPieData).map((entry, index) => (
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
              <CardTitle className="text-lg font-medium text-center">{t("发货趋势")}</CardTitle>
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
                      bottom: 20, // 增加底部边距以容纳星期显示
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={<CustomXAxisTick />} height={60} />
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
        
        {/* 添加矩形树图视图 - 仅在层级视图模式下显示 */}
        <TabsContent value="treemap" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-center">
                {t("快递类型层级占比")}
                <div className="text-xs text-muted-foreground mt-1">
                  {t("注意：深色块表示母类型自身数据，浅色块表示子类型数据")}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemapData}
                    dataKey="value"
                    nameKey="name"
                    aspectRatio={1}
                    stroke="#fff"
                    content={<CustomTreemapContent />}
                  >
                    <Tooltip content={<CustomTreemapTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>)
  );
}
