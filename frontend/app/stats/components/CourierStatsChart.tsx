import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourierStatsItem } from '@/lib/types/stats';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Download, Loader2, PieChart as PieChartIcon, BarChart3, TrendingUp } from 'lucide-react';
import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuLabel,
      DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CourierStatsChartProps {
      data: CourierStatsItem[];
      isLoading?: boolean;
      error?: Error | null;
      onRetry?: () => void;
}

const CourierStatsChart: React.FC<CourierStatsChartProps> = ({
      data,
      isLoading = false,
      error = null,
      onRetry,
}) => {
      const { t } = useTranslation('stats');
      const [activeTab, setActiveTab] = useState('pie');

      // 颜色配置
      const COLORS = [
            '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
            '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
            '#87D068', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'
      ];

      // 处理图表数据
      const chartData = useMemo(() => {
            if (!data || data.length === 0) return [];

            return data.map((item, index) => ({
                  name: item.courier_name,
                  value: item.total_quantity,
                  percentage: item.percentage || 0,
                  daily_average: item.daily_average || 0,
                  shops_count: item.shops_count || 0,
                  color: COLORS[index % COLORS.length],
                  mom_change_rate: item.mom_change_rate,
                  yoy_change_rate: item.yoy_change_rate,
            }));
      }, [data]);

      // 自定义Tooltip
      const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-muted-foreground">
                                    {t('总出力量')}: <span className="font-medium text-foreground">{data.value.toLocaleString()}</span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                    {t('占比')}: <span className="font-medium text-foreground">{data.percentage.toFixed(1)}%</span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                    {t('日均出力')}: <span className="font-medium text-foreground">{data.daily_average.toLocaleString()}</span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                    {t('涉及店铺数')}: <span className="font-medium text-foreground">{data.shops_count}</span>
                              </p>
                        </div>
                  );
            }
            return null;
      };

      // 自定义饼图标签
      const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
            if (percent < 0.05) return null; // 小于5%不显示标签

            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);

            return (
                  <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize={12}
                        fontWeight="bold"
                  >
                        {`${(percent * 100).toFixed(0)}%`}
                  </text>
            );
      };

      // 趋势数据处理
      const trendData = useMemo(() => {
            return chartData.map(item => ({
                  name: item.name,
                  current: item.value,
                  mom_change: item.mom_change_rate || 0,
                  yoy_change: item.yoy_change_rate || 0,
            }));
      }, [chartData]);

      if (isLoading) {
            return (
                  <Card>
                        <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    {t('加载中')}...
                              </CardTitle>
                        </CardHeader>
                        <CardContent>
                              <div className="h-[400px] flex items-center justify-center">
                                    <div className="text-center">
                                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                          <p className="text-muted-foreground">{t('正在加载图表数据')}...</p>
                                    </div>
                              </div>
                        </CardContent>
                  </Card>
            );
      }

      if (error) {
            return (
                  <Card>
                        <CardHeader>
                              <CardTitle className="text-destructive">{t('加载失败')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                              <div className="h-[400px] flex items-center justify-center">
                                    <div className="text-center">
                                          <p className="text-muted-foreground mb-4">{error.message}</p>
                                          {onRetry && (
                                                <Button onClick={onRetry} variant="outline">
                                                      {t('重试')}
                                                </Button>
                                          )}
                                    </div>
                              </div>
                        </CardContent>
                  </Card>
            );
      }

      if (!data || data.length === 0) {
            return (
                  <Card>
                        <CardHeader>
                              <CardTitle>{t('按快递类型统计图表')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                              <div className="h-[400px] flex items-center justify-center">
                                    <p className="text-muted-foreground">{t('暂无数据')}</p>
                              </div>
                        </CardContent>
                  </Card>
            );
      }

      return (
            <Card>
                  <CardHeader>
                        <div className="flex justify-between items-center">
                              <CardTitle>{t('按快递类型统计图表')}</CardTitle>
                              <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                          {t('共')} {data.length} {t('个快递类型')}
                                    </span>
                                    <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                      <Download className="h-4 w-4 mr-1" />
                                                      {t('导出图表')}
                                                </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent>
                                                <DropdownMenuLabel>{t('导出格式')}</DropdownMenuLabel>
                                                <DropdownMenuItem>PNG (.png)</DropdownMenuItem>
                                                <DropdownMenuItem>SVG (.svg)</DropdownMenuItem>
                                                <DropdownMenuItem>PDF (.pdf)</DropdownMenuItem>
                                          </DropdownMenuContent>
                                    </DropdownMenu>
                              </div>
                        </div>
                  </CardHeader>
                  <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="pie" className="flex items-center gap-2">
                                          <PieChartIcon className="h-4 w-4" />
                                          <span>{t('饼图')}</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="bar" className="flex items-center gap-2">
                                          <BarChart3 className="h-4 w-4" />
                                          <span>{t('柱状图')}</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="trend" className="flex items-center gap-2">
                                          <TrendingUp className="h-4 w-4" />
                                          <span>{t('趋势图')}</span>
                                    </TabsTrigger>
                              </TabsList>

                              <TabsContent value="pie" className="mt-6">
                                    <div className="h-[500px]">
                                          <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                      <Pie
                                                            data={chartData}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={renderCustomizedLabel}
                                                            outerRadius={150}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                      >
                                                            {chartData.map((entry, index) => (
                                                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                      </Pie>
                                                      <Tooltip content={<CustomTooltip />} />
                                                      <Legend
                                                            verticalAlign="bottom"
                                                            height={36}
                                                            formatter={(value, entry: any) => (
                                                                  <span style={{ color: entry.color }}>
                                                                        {value} ({entry.payload.percentage.toFixed(1)}%)
                                                                  </span>
                                                            )}
                                                      />
                                                </PieChart>
                                          </ResponsiveContainer>
                                    </div>
                              </TabsContent>

                              <TabsContent value="bar" className="mt-6">
                                    <div className="h-[500px]">
                                          <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                      data={chartData}
                                                      margin={{
                                                            top: 20,
                                                            right: 30,
                                                            left: 20,
                                                            bottom: 60,
                                                      }}
                                                >
                                                      <CartesianGrid strokeDasharray="3 3" />
                                                      <XAxis
                                                            dataKey="name"
                                                            angle={-45}
                                                            textAnchor="end"
                                                            height={80}
                                                            interval={0}
                                                      />
                                                      <YAxis />
                                                      <Tooltip content={<CustomTooltip />} />
                                                      <Legend />
                                                      <Bar
                                                            dataKey="value"
                                                            name={t('总出力量')}
                                                            fill="#0088FE"
                                                            radius={[4, 4, 0, 0]}
                                                      />
                                                </BarChart>
                                          </ResponsiveContainer>
                                    </div>
                              </TabsContent>

                              <TabsContent value="trend" className="mt-6">
                                    <div className="h-[500px]">
                                          <ResponsiveContainer width="100%" height="100%">
                                                <LineChart
                                                      data={trendData}
                                                      margin={{
                                                            top: 20,
                                                            right: 30,
                                                            left: 20,
                                                            bottom: 60,
                                                      }}
                                                >
                                                      <CartesianGrid strokeDasharray="3 3" />
                                                      <XAxis
                                                            dataKey="name"
                                                            angle={-45}
                                                            textAnchor="end"
                                                            height={80}
                                                            interval={0}
                                                      />
                                                      <YAxis />
                                                      <Tooltip
                                                            formatter={(value: any, name: string) => [
                                                                  `${value.toFixed(1)}%`,
                                                                  name === 'mom_change' ? t('环比变化') : t('同比变化')
                                                            ]}
                                                      />
                                                      <Legend />
                                                      <Line
                                                            type="monotone"
                                                            dataKey="mom_change"
                                                            stroke="#00C49F"
                                                            strokeWidth={2}
                                                            name={t('环比变化')}
                                                            dot={{ r: 4 }}
                                                      />
                                                      <Line
                                                            type="monotone"
                                                            dataKey="yoy_change"
                                                            stroke="#FF8042"
                                                            strokeWidth={2}
                                                            name={t('同比变化')}
                                                            dot={{ r: 4 }}
                                                      />
                                                </LineChart>
                                          </ResponsiveContainer>
                                    </div>
                              </TabsContent>
                        </Tabs>
                  </CardContent>
            </Card>
      );
};

export default CourierStatsChart; 