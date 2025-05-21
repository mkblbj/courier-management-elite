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

const CategoryStatsChart: React.FC<CategoryStatsChartProps> = ({ data, isLoading = false }) => {
      const { t } = useTranslation('stats'); // 使用'stats'命名空间
      const [activeChartType, setActiveChartType] = useState<'pie' | 'bar'>('pie');
      const [activeIndex, setActiveIndex] = useState<number | null>(null);
      const [chartData, setChartData] = useState<any[]>([]);

      // 数据转换处理
      useEffect(() => {
            if (data && data.length > 0) {
                  console.log('原始类别数据:', data);

                  // 确保数据有效
                  const validData = data.filter(item =>
                        item && typeof item.total_quantity !== 'undefined' &&
                        Number(item.total_quantity) > 0
                  );

                  const processedData = validData.map((item, index) => ({
                        ...item,
                        name: item.category_name || `${t('类别')}${index + 1}`,
                        // 确保value是数字类型
                        value: typeof item.total_quantity === 'string'
                              ? parseFloat(item.total_quantity)
                              : Number(item.total_quantity),
                        color: COLORS[index % COLORS.length]
                  }));

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

      // 饼图激活扇形的自定义渲染
      const renderActiveShape = (props: any) => {
            const RADIAN = Math.PI / 180;
            const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
                  fill, payload, percent, value } = props;
            const sin = Math.sin(-RADIAN * midAngle);
            const cos = Math.cos(-RADIAN * midAngle);
            const sx = cx + (outerRadius + 10) * cos;
            const sy = cy + (outerRadius + 10) * sin;
            const mx = cx + (outerRadius + 30) * cos;
            const my = cy + (outerRadius + 30) * sin;
            const ex = mx + (cos >= 0 ? 1 : -1) * 22;
            const ey = my;
            const textAnchor = cos >= 0 ? 'start' : 'end';

            return (
                  <g>
                        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
                              {payload.name}
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
                        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${t('出力量')} ${value}`}</text>
                        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                              {`(${t('占比')} ${(percent * 100).toFixed(2)}%)`}
                        </text>
                  </g>
            );
      };

      return (
            <Card>
                  <CardContent className="pt-6">
                        <Tabs value={activeChartType} onValueChange={(value) => setActiveChartType(value as 'pie' | 'bar')}>
                              <div className="flex justify-between items-center mb-4">
                                    <TabsList>
                                          <TabsTrigger value="pie">{t('饼图')}</TabsTrigger>
                                          <TabsTrigger value="bar">{t('柱状图')}</TabsTrigger>
                                    </TabsList>
                              </div>

                              {isLoading ? (
                                    <div className="flex justify-center items-center h-80">
                                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                                                                  >
                                                                        {chartData.map((entry, index) => (
                                                                              <Cell key={`cell-${index}`} fill={entry.color} />
                                                                        ))}
                                                                  </Pie>
                                                                  <Tooltip />
                                                                  <Legend />
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
                                                                  <CartesianGrid strokeDasharray="3 3" />
                                                                  <XAxis dataKey="name" />
                                                                  <YAxis />
                                                                  <Tooltip />
                                                                  <Legend />
                                                                  <Bar dataKey="value" name={t('出力量')} fill="#8884d8">
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