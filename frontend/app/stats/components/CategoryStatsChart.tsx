import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryStatsItem } from '@/lib/types/stats';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
      BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
      PieChart, Pie, Sector
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { useTranslation } from "react-i18next";

interface CategoryStatsChartProps {
      data: CategoryStatsItem[];
      isLoading?: boolean;
}

// 颜色数组，用于图表显示
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#8884D8', '#82CA9D', '#FF6B6B', '#8785A2', '#52D4B5'];

// 扩展数据类型，包含占比信息
interface ChartDataItem {
      name: string;
      value: number;
      percentage?: number; // API返回的占比
      color: string;
      category_id: number;
      category_name: string;
      total_quantity: number;
}

const CategoryStatsChart: React.FC<CategoryStatsChartProps> = ({ data, isLoading = false }) => {
      const { t } = useTranslation('stats'); // 使用'stats'命名空间
      const [activeChartType, setActiveChartType] = useState<'pie' | 'bar'>('pie');
      const [activeIndex, setActiveIndex] = useState<number | null>(null);
      const [chartData, setChartData] = useState<ChartDataItem[]>([]);

      // 数据转换处理
      useEffect(() => {
            if (data && data.length > 0) {
                  console.log('原始类别数据:', data);

                  // 确保数据有效
                  const validData = data.filter(item =>
                        item && typeof item.total_quantity !== 'undefined' &&
                        Number(item.total_quantity) > 0
                  );

                  const processedData: ChartDataItem[] = validData.map((item, index) => {
                        const quantity = typeof item.total_quantity === 'string'
                              ? parseFloat(item.total_quantity)
                              : Number(item.total_quantity);

                        // 优先使用API返回的占比数据，如果没有则计算
                        let percentage: number;
                        if (item.percentage !== undefined && item.percentage !== null) {
                              // 直接使用API返回的占比
                              percentage = typeof item.percentage === 'string'
                                    ? parseFloat(item.percentage)
                                    : Number(item.percentage);
                        } else {
                              // 如果API没有返回占比，则手动计算
                              const totalQuantity = validData.reduce((sum, dataItem) => {
                                    const qty = typeof dataItem.total_quantity === 'string'
                                          ? parseFloat(dataItem.total_quantity)
                                          : Number(dataItem.total_quantity);
                                    return sum + (isNaN(qty) ? 0 : qty);
                              }, 0);
                              percentage = totalQuantity > 0 ? (quantity / totalQuantity) * 100 : 0;
                        }

                        return {
                              name: item.category_name || `${t('类别')}${index + 1}`,
                              value: quantity,
                              percentage: percentage,
                              color: COLORS[index % COLORS.length],
                              category_id: item.category_id,
                              category_name: item.category_name,
                              total_quantity: quantity
                        };
                  });

                  console.log('处理后的图表数据:', processedData);
                  setChartData(processedData);
            } else {
                  setChartData([]);
            }
      }, [data]);

      // 处理饼图扇形激活
      const onPieEnter = (_: any, index: number) => {
            setActiveIndex(index);
      };

      // 自定义饼图Tooltip
      const CustomTooltip = ({ active, payload }: any) => {
            if (active && payload && payload.length) {
                  const data = payload[0].payload as ChartDataItem;
                  return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-800">{data.name}</p>
                              <p className="text-blue-600">
                                    {t('出力量')}: <span className="font-medium">{data.value.toLocaleString('zh-CN')}</span>
                              </p>
                              <p className="text-green-600">
                                    {t('占比')}: <span className="font-medium">{data.percentage?.toFixed(2)}%</span>
                              </p>
                        </div>
                  );
            }
            return null;
      };

      // 自定义柱状图Tooltip
      const CustomBarTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                  const data = payload[0].payload as ChartDataItem;
                  return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-800">{label}</p>
                              <p className="text-blue-600">
                                    {t('出力量')}: <span className="font-medium">{data.value.toLocaleString('zh-CN')}</span>
                              </p>
                              {data.percentage !== undefined && (
                                    <p className="text-green-600">
                                          {t('占比')}: <span className="font-medium">{data.percentage.toFixed(2)}%</span>
                                    </p>
                              )}
                        </div>
                  );
            }
            return null;
      };

      // 饼图激活扇形的自定义渲染
      const renderActiveShape = (props: any) => {
            const RADIAN = Math.PI / 180;
            const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
                  fill, payload } = props;
            const sin = Math.sin(-RADIAN * midAngle);
            const cos = Math.cos(-RADIAN * midAngle);
            const sx = cx + (outerRadius + 10) * cos;
            const sy = cy + (outerRadius + 10) * sin;
            const mx = cx + (outerRadius + 30) * cos;
            const my = cy + (outerRadius + 30) * sin;
            const ex = mx + (cos >= 0 ? 1 : -1) * 22;
            const ey = my;
            const textAnchor = cos >= 0 ? 'start' : 'end';

            const data = payload as ChartDataItem;

            return (
                  <g>
                        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-medium">
                              {data.name}
                        </text>
                        <Sector
                              cx={cx}
                              cy={cy}
                              innerRadius={innerRadius}
                              outerRadius={outerRadius}
                              startAngle={startAngle}
                              endAngle={endAngle}
                              fill={fill}
                        />
                        <Sector
                              cx={cx}
                              cy={cy}
                              startAngle={startAngle}
                              endAngle={endAngle}
                              innerRadius={outerRadius + 6}
                              outerRadius={outerRadius + 10}
                              fill={fill}
                        />
                        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
                        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
                        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-sm font-medium">
                              {`${t('出力量')} ${data.value.toLocaleString('zh-CN')}`}
                        </text>
                        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#666" className="text-xs">
                              {`${t('占比')} ${data.percentage?.toFixed(2)}%`}
                        </text>
                  </g>
            );
      };

      return (
            <Card className="shadow-sm border-slate-200">
                  <CardContent className="pt-6">
                        <Tabs value={activeChartType} onValueChange={(value) => setActiveChartType(value as 'pie' | 'bar')}>
                              <div className="flex justify-between items-center mb-4">
                                    <TabsList className="bg-slate-100">
                                          <TabsTrigger value="pie" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                                                {t('饼图')}
                                          </TabsTrigger>
                                          <TabsTrigger value="bar" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                                                {t('柱状图')}
                                          </TabsTrigger>
                                    </TabsList>
                                    {chartData.length > 0 && (
                                          <div className="text-sm text-slate-600">
                                                共 <span className="font-semibold text-slate-800">{chartData.length}</span> 个类别
                                          </div>
                                    )}
                              </div>

                              {isLoading ? (
                                    <div className="flex justify-center items-center h-80">
                                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                              ) : chartData.length === 0 ? (
                                    <div className="flex justify-center items-center h-80">
                                          <p className="text-muted-foreground">暂无数据</p>
                                    </div>
                              ) : (
                                    <>
                                          <TabsContent value="pie" className="mt-0">
                                                <div className="h-80">
                                                      <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                  <Pie
                                                                        activeIndex={activeIndex !== null ? activeIndex : undefined}
                                                                        activeShape={renderActiveShape}
                                                                        data={chartData}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        innerRadius={60}
                                                                        outerRadius={80}
                                                                        fill="#8884d8"
                                                                        dataKey="value"
                                                                        onMouseEnter={onPieEnter}
                                                                        onMouseLeave={() => setActiveIndex(null)}
                                                                  >
                                                                        {chartData.map((entry, index) => (
                                                                              <Cell key={`cell-${index}`} fill={entry.color} />
                                                                        ))}
                                                                  </Pie>
                                                                  <Tooltip content={<CustomTooltip />} />
                                                                  <Legend
                                                                        formatter={(value, entry: any) => (
                                                                              <span className="text-sm text-slate-700">
                                                                                    {entry.payload.name} ({entry.payload.percentage?.toFixed(1)}%)
                                                                              </span>
                                                                        )}
                                                                  />
                                                            </PieChart>
                                                      </ResponsiveContainer>
                                                </div>
                                          </TabsContent>

                                          <TabsContent value="bar" className="mt-0">
                                                <div className="h-80">
                                                      <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart
                                                                  data={chartData}
                                                                  margin={{
                                                                        top: 5,
                                                                        right: 30,
                                                                        left: 20,
                                                                        bottom: 5,
                                                                  }}
                                                            >
                                                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                                  <XAxis
                                                                        dataKey="name"
                                                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                                                        axisLine={{ stroke: '#cbd5e1' }}
                                                                  />
                                                                  <YAxis
                                                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                                                        axisLine={{ stroke: '#cbd5e1' }}
                                                                  />
                                                                  <Tooltip content={<CustomBarTooltip />} />
                                                                  <Legend />
                                                                  <Bar
                                                                        dataKey="value"
                                                                        name={t('出力量')}
                                                                        fill="#8884d8"
                                                                        radius={[4, 4, 0, 0]}
                                                                  >
                                                                        {chartData.map((entry, index) => (
                                                                              <Cell key={`cell-${index}`} fill={entry.color} />
                                                                        ))}
                                                                  </Bar>
                                                            </BarChart>
                                                      </ResponsiveContainer>
                                                </div>
                                          </TabsContent>
                                    </>
                              )}
                        </Tabs>
                  </CardContent>
            </Card>
      );
};

export default CategoryStatsChart; 