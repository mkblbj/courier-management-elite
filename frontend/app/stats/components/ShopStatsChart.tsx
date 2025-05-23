import React, { useState } from 'react';
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

const ShopStatsChart: React.FC<ShopStatsChartProps> = ({
      data,
      groupByCategory = true
}) => {
      const { t } = useTranslation('stats');
      const { theme } = useTheme();
      const [chartType, setChartType] = useState<'bar' | 'stacked-bar' | 'pie'>('bar');
      const [activeIndex, setActiveIndex] = useState<number | null>(null);

      // 基础文字颜色根据主题
      const textColor = theme === 'dark' ? '#f1f5f9' : '#334155';

      // 图表鼠标悬停处理
      const onPieEnter = (_: any, index: number) => {
            setActiveIndex(index);
      };

      const onPieLeave = () => {
            setActiveIndex(null);
      };

      // 按类别分类或直接展示所有店铺
      const prepareChartData = (): any[] => {
            if (!data || data.length === 0) {
                  return [];
            }

            if (chartType === 'pie') {
                  // 饼图数据 - 每个店铺一个扇区
                  return data.slice(0, 10).map((shop, index) => ({
                        name: shop.shop_name,
                        value: shop.total_quantity,
                        color: CHART_COLORS[index % CHART_COLORS.length],
                        categoryName: shop.category_name
                  }));
            } else if (chartType === 'stacked-bar' && groupByCategory) {
                  // 堆叠柱状图数据 - 按类别分组
                  const categoriesMap = new Map<string, { name: string, total: number, shops: Record<string, number> }>();

                  data.forEach(shop => {
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
                  return data.slice(0, 15).map((shop, index) => ({
                        name: shop.shop_name,
                        value: shop.total_quantity,
                        color: CHART_COLORS[index % CHART_COLORS.length],
                        categoryName: shop.category_name
                  }));
            }
      };

      // 获取堆叠柱状图的店铺名称列表
      const getStackedBarShopNames = (): string[] => {
            const shopNames = new Set<string>();
            data.forEach(shop => shopNames.add(shop.shop_name));
            return Array.from(shopNames).slice(0, 15); // 限制最多15个店铺
      };

      // 自定义饼图活跃扇区
      const renderActiveShape = (props: any) => {
            const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

            return (
                  <g>
                        <Text x={cx} y={cy} dy={-20} textAnchor="middle" fill={textColor} className="text-lg font-medium">
                              {payload.name}
                        </Text>
                        <Text x={cx} y={cy} textAnchor="middle" fill={textColor}>
                              {value} ({(percent * 100).toFixed(2)}%)
                        </Text>
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
      };

      // 自定义工具提示内容
      const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                  return (
                        <Card className="bg-background p-2">
                              <CardContent className="p-2">
                                    <p className="font-medium">{label}</p>
                                    <p>{`${t('总量')}: ${payload[0].value}`}</p>
                                    {payload[0].payload.categoryName && (
                                          <p>{`${t('类别')}: ${payload[0].payload.categoryName}`}</p>
                                    )}
                              </CardContent>
                        </Card>
                  );
            }
            return null;
      };

      // 自定义堆叠柱状图工具提示
      const StackedBarTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                  // 过滤掉数值为0的项
                  const nonZeroPayloads = payload.filter((p: any) => p.value > 0);

                  return (
                        <Card className="bg-background p-2">
                              <CardContent className="p-2">
                                    <p className="font-medium">{label}</p>
                                    {nonZeroPayloads.map((p: any, index: number) => (
                                          <p key={index} style={{ color: p.color }}>
                                                {`${p.name}: ${p.value}`}
                                          </p>
                                    ))}
                                    <p className="font-medium mt-1 pt-1 border-t border-muted">
                                          {`${t('总量')}: ${nonZeroPayloads.reduce((sum: number, p: any) => sum + p.value, 0)}`}
                                    </p>
                              </CardContent>
                        </Card>
                  );
            }
            return null;
      };

      const chartData = prepareChartData();
      const shopNames = getStackedBarShopNames();

      if (data.length === 0) {
            return (
                  <div className="flex items-center justify-center h-60 bg-muted/20 rounded-md">
                        <p className="text-muted-foreground">{t('暂无数据')}</p>
                  </div>
            );
      }

      return (
            <div className="space-y-4">
                  <Tabs defaultValue="bar" value={chartType} onValueChange={(value) => setChartType(value as 'bar' | 'stacked-bar' | 'pie')}>
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
                                                      {shopNames.map((shopName, index) => (
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
                        {t('注: 柱状图和饼图仅显示前15家店铺的数据')}
                  </div>
            </div>
      );
};

export default ShopStatsChart; 