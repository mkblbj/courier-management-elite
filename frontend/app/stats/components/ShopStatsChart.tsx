import React, { useState, useMemo, useCallback, memo } from 'react';
import { ShopStatsItem } from '@/lib/types/stats';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
      BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
      Cell, Pie, PieChart, Sector, Text
} from 'recharts';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';

interface ShopStatsChartProps {
      data: ShopStatsItem[];
      groupByCategory?: boolean;
      maxDataPoints?: number; // 新增：最大数据点数量，用于性能优化
      enableLazyLoading?: boolean; // 新增：是否启用懒加载
}

// 生成一组良好对比的图表颜色
const CHART_COLORS = [
      '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe',
      '#8b5cf6', '#a78bfa', '#c4b5fd',
      '#ec4899', '#f472b6', '#fbcfe8',
      '#ef4444', '#f87171', '#fecaca',
      '#f59e0b', '#fbbf24', '#fde68a',
      '#10b981', '#34d399', '#a7f3d0'
];

// 使用 memo 优化组件重渲染
const ShopStatsChart: React.FC<ShopStatsChartProps> = memo(({
      data,
      groupByCategory = true,
      maxDataPoints = 20,
      enableLazyLoading = true
}) => {
      const { t } = useTranslation('stats');
      const { theme } = useTheme();
      const [chartType, setChartType] = useState<'bar' | 'stacked-bar' | 'pie'>('bar');
      const [activeIndex, setActiveIndex] = useState<number | null>(null);

      // 基础文字颜色根据主题
      const textColor = theme === 'dark' ? '#f1f5f9' : '#334155';

      // 图表鼠标悬停处理 - 使用 useCallback 优化
      const onPieEnter = useCallback((_: any, index: number) => {
            setActiveIndex(index);
      }, []);

      const onPieLeave = useCallback(() => {
            setActiveIndex(null);
      }, []);

      // 数据预处理和优化 - 使用 useMemo 缓存计算结果
      const processedData = useMemo(() => {
            if (!data || data.length === 0) {
                  return [];
            }

            // 根据图表类型和数据量进行优化
            let processedData = [...data];

            // 如果数据量过大，进行采样或聚合
            if (processedData.length > maxDataPoints) {
                  if (chartType === 'pie') {
                        // 饼图：取前N个数据，其余合并为"其他"
                        const topData = processedData
                              .sort((a, b) => b.total_quantity - a.total_quantity)
                              .slice(0, maxDataPoints - 1);

                        const otherData = processedData.slice(maxDataPoints - 1);
                        const otherTotal = otherData.reduce((sum, item) => sum + item.total_quantity, 0);

                        if (otherTotal > 0) {
                              topData.push({
                                    shop_id: -1,
                                    shop_name: '其他',
                                    total_quantity: otherTotal,
                                    category_name: '其他'
                              } as ShopStatsItem);
                        }

                        processedData = topData;
                  } else {
                        // 柱状图：取前N个数据
                        processedData = processedData
                              .sort((a, b) => b.total_quantity - a.total_quantity)
                              .slice(0, maxDataPoints);
                  }
            }

            return processedData;
      }, [data, maxDataPoints, chartType]);

      // 按类别分类或直接展示所有店铺 - 使用 useMemo 优化
      const chartData = useMemo((): any[] => {
            if (!processedData || processedData.length === 0) {
                  return [];
            }

            if (chartType === 'pie') {
                  // 饼图数据 - 每个店铺一个扇区
                  return processedData.map((shop, index) => ({
                        name: shop.shop_name,
                        value: shop.total_quantity,
                        color: CHART_COLORS[index % CHART_COLORS.length],
                        categoryName: shop.category_name
                  }));
            } else if (chartType === 'stacked-bar' && groupByCategory) {
                  // 堆叠柱状图数据 - 按类别分组
                  const categoriesMap = new Map<string, { name: string, total: number, shops: Record<string, number> }>();

                  processedData.forEach(shop => {
                        const categoryName = shop.category_name || '未分类';

                        if (!categoriesMap.has(categoryName)) {
                              categoriesMap.set(categoryName, {
                                    name: categoryName,
                                    total: 0,
                                    shops: {}
                              });
                        }

                        const category = categoriesMap.get(categoryName)!;
                        category.shops[shop.shop_name] = shop.total_quantity;
                        category.total += shop.total_quantity;
                  });

                  return Array.from(categoriesMap.values());
            } else {
                  // 标准柱状图数据 - 每个店铺一个柱
                  return processedData.map((shop, index) => ({
                        name: shop.shop_name,
                        value: shop.total_quantity,
                        color: CHART_COLORS[index % CHART_COLORS.length],
                        categoryName: shop.category_name
                  }));
            }
      }, [processedData, chartType, groupByCategory]);

      // 获取堆叠柱状图的店铺名称列表 - 使用 useMemo 优化
      const stackedBarShopNames = useMemo((): string[] => {
            const shopNames = new Set<string>();
            processedData.forEach(shop => shopNames.add(shop.shop_name));
            return Array.from(shopNames).slice(0, maxDataPoints);
      }, [processedData, maxDataPoints]);

      // 自定义饼图活跃扇区 - 使用 useCallback 优化
      const renderActiveShape = useCallback((props: any) => {
            const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

            return (
                  <g>
                        <text x={cx} y={cy - 20} textAnchor="middle" fill={textColor} className="text-lg font-medium">
                              {payload.name}
                        </text>
                        <text x={cx} y={cy} textAnchor="middle" fill={textColor}>
                              {value} ({(percent * 100).toFixed(2)}%)
                        </text>
                        <Sector
                              cx={cx}
                              cy={cy}
                              innerRadius={innerRadius}
                              outerRadius={outerRadius + 8}
                              startAngle={startAngle}
                              endAngle={endAngle}
                              fill={fill}
                        />
                        <Sector
                              cx={cx}
                              cy={cy}
                              startAngle={startAngle}
                              endAngle={endAngle}
                              innerRadius={outerRadius + 10}
                              outerRadius={outerRadius + 12}
                              fill={fill}
                        />
                  </g>
            );
      }, [textColor]);

      // 自定义工具提示内容 - 使用 useCallback 优化
      const CustomTooltip = useCallback(({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                  return (
                        <Card className="bg-background p-2">
                              <CardContent className="p-2">
                                    <p className="font-medium">{label}</p>
                                    <p>{`${t('总量')}: ${payload[0].value.toLocaleString()}`}</p>
                                    {payload[0].payload.categoryName && (
                                          <p>{`${t('类别')}: ${payload[0].payload.categoryName}`}</p>
                                    )}
                              </CardContent>
                        </Card>
                  );
            }
            return null;
      }, [t]);

      // 自定义堆叠柱状图工具提示 - 使用 useCallback 优化
      const StackedBarTooltip = useCallback(({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                  // 过滤掉数值为0的项
                  const nonZeroPayloads = payload.filter((p: any) => p.value > 0);

                  return (
                        <Card className="bg-background p-2">
                              <CardContent className="p-2">
                                    <p className="font-medium">{label}</p>
                                    {nonZeroPayloads.map((p: any, index: number) => (
                                          <p key={index} style={{ color: p.color }}>
                                                {`${p.name}: ${p.value.toLocaleString()}`}
                                          </p>
                                    ))}
                                    <p className="font-medium mt-1 pt-1 border-t border-muted">
                                          {`${t('总量')}: ${nonZeroPayloads.reduce((sum: number, p: any) => sum + p.value, 0).toLocaleString()}`}
                                    </p>
                              </CardContent>
                        </Card>
                  );
            }
            return null;
      }, [t]);

      // 图表切换处理 - 使用 useCallback 优化
      const handleChartTypeChange = useCallback((value: string) => {
            setChartType(value as 'bar' | 'stacked-bar' | 'pie');
            setActiveIndex(null); // 重置活跃索引
      }, []);

      if (data.length === 0) {
            return (
                  <div className="flex items-center justify-center h-60 bg-muted/20 rounded-md">
                        <p className="text-muted-foreground">{t('暂无数据')}</p>
                  </div>
            );
      }

      return (
            <div className="space-y-4">
                  {/* 性能提示 */}
                  {data.length > maxDataPoints && (
                        <div className="text-sm text-muted-foreground bg-muted/20 p-2 rounded">
                              <span className="font-medium">性能优化：</span>
                              显示前 {maxDataPoints} 个数据点（共 {data.length} 个）
                        </div>
                  )}

                  <Tabs defaultValue="bar" value={chartType} onValueChange={handleChartTypeChange}>
                        <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="bar">{t('柱状图')}</TabsTrigger>
                              <TabsTrigger value="stacked-bar">{t('堆叠柱状图')}</TabsTrigger>
                              <TabsTrigger value="pie">{t('饼图')}</TabsTrigger>
                        </TabsList>

                        {/* 柱状图 */}
                        <TabsContent value="bar" className="pt-4">
                              <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                          <BarChart
                                                data={chartData}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                                          >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                      dataKey="name"
                                                      tick={{ fill: textColor }}
                                                      angle={-45}
                                                      textAnchor="end"
                                                      interval={0}
                                                />
                                                <YAxis tick={{ fill: textColor }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                                <Bar dataKey="value" name={t('出力量')} minPointSize={2}>
                                                      {chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                      ))}
                                                </Bar>
                                          </BarChart>
                                    </ResponsiveContainer>
                              </div>
                        </TabsContent>

                        {/* 堆叠柱状图 */}
                        <TabsContent value="stacked-bar" className="pt-4">
                              <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                          {groupByCategory ? (
                                                <BarChart
                                                      data={chartData}
                                                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                                                >
                                                      <CartesianGrid strokeDasharray="3 3" />
                                                      <XAxis
                                                            dataKey="name"
                                                            tick={{ fill: textColor }}
                                                            angle={-45}
                                                            textAnchor="end"
                                                      />
                                                      <YAxis tick={{ fill: textColor }} />
                                                      <Tooltip content={<StackedBarTooltip />} />
                                                      <Legend layout="horizontal" verticalAlign="top" />
                                                      {stackedBarShopNames.map((shopName, index) => (
                                                            <Bar
                                                                  key={shopName}
                                                                  dataKey={`shops.${shopName}`}
                                                                  stackId="a"
                                                                  name={shopName}
                                                                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                            />
                                                      ))}
                                                </BarChart>
                                          ) : (
                                                <BarChart
                                                      data={chartData}
                                                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                                                >
                                                      <CartesianGrid strokeDasharray="3 3" />
                                                      <XAxis
                                                            dataKey="name"
                                                            tick={{ fill: textColor }}
                                                            angle={-45}
                                                            textAnchor="end"
                                                      />
                                                      <YAxis tick={{ fill: textColor }} />
                                                      <Tooltip content={<CustomTooltip />} />
                                                      <Bar dataKey="value" fill="#8884d8" name={t('出力量')}>
                                                            {chartData.map((entry, index) => (
                                                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                      </Bar>
                                                </BarChart>
                                          )}
                                    </ResponsiveContainer>
                              </div>
                        </TabsContent>

                        {/* 饼图 */}
                        <TabsContent value="pie" className="pt-4">
                              <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                          <PieChart>
                                                <Pie
                                                      activeIndex={activeIndex !== null ? activeIndex : undefined}
                                                      activeShape={renderActiveShape}
                                                      data={chartData}
                                                      cx="50%"
                                                      cy="50%"
                                                      innerRadius={60}
                                                      outerRadius={100}
                                                      fill="#8884d8"
                                                      dataKey="value"
                                                      onMouseEnter={onPieEnter}
                                                      onMouseLeave={onPieLeave}
                                                >
                                                      {chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                      ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend formatter={(value, entry, index) => <span style={{ color: textColor }}>{value}</span>} />
                                          </PieChart>
                                    </ResponsiveContainer>
                              </div>
                        </TabsContent>
                  </Tabs>

                  <div className="text-center text-sm text-muted-foreground">
                        {data.length > maxDataPoints ?
                              `注: 图表显示前 ${maxDataPoints} 个数据点，共 ${data.length} 个店铺` :
                              `注: 显示全部 ${data.length} 个店铺的数据`
                        }
                  </div>
            </div>
      );
});

ShopStatsChart.displayName = 'ShopStatsChart';

export default ShopStatsChart; 