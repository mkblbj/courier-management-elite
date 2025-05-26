import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
      LineChart,
      Line,
      BarChart,
      Bar,
      XAxis,
      YAxis,
      CartesianGrid,
      Tooltip,
      Legend,
      ResponsiveContainer,
      ReferenceLine
} from 'recharts';
import { TrendingUp, BarChart3, LineChart as LineChartIcon, Calendar } from 'lucide-react';
import { DateStatsItem } from '@/lib/types/stats';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DateStatsChartProps {
      data: DateStatsItem[];
      isLoading?: boolean;
      groupBy?: 'day' | 'week' | 'month' | 'year';
}

type ChartType = 'line' | 'bar';

const DateStatsChart: React.FC<DateStatsChartProps> = ({
      data,
      isLoading = false,
      groupBy = 'day'
}) => {
      const { t } = useTranslation('stats');
      const [chartType, setChartType] = useState<ChartType>('line');
      const [showMovingAverage, setShowMovingAverage] = useState(true);
      const [showComparison, setShowComparison] = useState(true);
      const [movingAveragePeriod, setMovingAveragePeriod] = useState(7);

      // 处理和格式化数据
      const chartData = useMemo(() => {
            if (!data || data.length === 0) return [];

            // 按日期排序
            const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            return sortedData.map((item, index) => {
                  // 格式化日期显示
                  let formattedDate;
                  try {
                        if (groupBy === 'week') {
                              const [year, week] = item.date.split('-');
                              formattedDate = `${year}年第${week}周`;
                        } else if (groupBy === 'month') {
                              const [year, month] = item.date.split('-');
                              formattedDate = `${year}年${month}月`;
                        } else if (groupBy === 'year') {
                              formattedDate = `${item.date}年`;
                        } else {
                              // day
                              const date = parseISO(item.date);
                              formattedDate = format(date, 'MM-dd', { locale: zhCN });
                        }
                  } catch (error) {
                        formattedDate = item.date;
                  }

                  // 计算移动平均线
                  let movingAverage = null;
                  if (showMovingAverage && index >= movingAveragePeriod - 1) {
                        const sum = sortedData
                              .slice(index - movingAveragePeriod + 1, index + 1)
                              .reduce((acc, curr) => acc + curr.total_quantity, 0);
                        movingAverage = Math.round(sum / movingAveragePeriod);
                  }

                  return {
                        ...item,
                        formattedDate,
                        movingAverage,
                        // 为了图表显示，确保数值类型正确
                        total_quantity: Number(item.total_quantity) || 0,
                        percentage: Number(item.percentage) || 0,
                        shops_count: Number(item.shops_count) || 0,
                        mom_change_rate: Number(item.mom_change_rate) || 0,
                        yoy_change_rate: Number(item.yoy_change_rate) || 0
                  };
            });
      }, [data, groupBy, showMovingAverage, movingAveragePeriod]);

      // 计算统计信息
      const stats = useMemo(() => {
            if (!chartData || chartData.length === 0) return null;

            const totalQuantity = chartData.reduce((sum, item) => sum + item.total_quantity, 0);
            const avgQuantity = totalQuantity / chartData.length;
            const maxQuantity = Math.max(...chartData.map(item => item.total_quantity));
            const minQuantity = Math.min(...chartData.map(item => item.total_quantity));

            // 计算趋势
            const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
            const secondHalf = chartData.slice(Math.floor(chartData.length / 2));

            const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.total_quantity, 0) / firstHalf.length;
            const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.total_quantity, 0) / secondHalf.length;

            const trendRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

            return {
                  totalQuantity,
                  avgQuantity: Math.round(avgQuantity),
                  maxQuantity,
                  minQuantity,
                  trendRate: Math.round(trendRate * 10) / 10,
                  trendType: trendRate > 5 ? 'increase' : trendRate < -5 ? 'decrease' : 'stable'
            };
      }, [chartData]);

      // 自定义Tooltip
      const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                        <div className="bg-background border rounded-lg shadow-lg p-3 space-y-2">
                              <p className="font-semibold">{label}</p>
                              <div className="space-y-1">
                                    <p className="text-sm">
                                          <span className="text-muted-foreground">总出力量:</span>
                                          <span className="font-mono ml-2">{data.total_quantity.toLocaleString()}</span>
                                    </p>
                                    <p className="text-sm">
                                          <span className="text-muted-foreground">活跃店铺:</span>
                                          <span className="ml-2">{data.shops_count}</span>
                                    </p>
                                    {data.percentage > 0 && (
                                          <p className="text-sm">
                                                <span className="text-muted-foreground">占比:</span>
                                                <span className="ml-2">{data.percentage.toFixed(1)}%</span>
                                          </p>
                                    )}
                                    {showMovingAverage && data.movingAverage && (
                                          <p className="text-sm">
                                                <span className="text-muted-foreground">{movingAveragePeriod}日均线:</span>
                                                <span className="font-mono ml-2">{data.movingAverage.toLocaleString()}</span>
                                          </p>
                                    )}
                                    {showComparison && (
                                          <>
                                                {data.mom_change_rate !== 0 && (
                                                      <p className="text-sm">
                                                            <span className="text-muted-foreground">环比:</span>
                                                            <span className={`ml-2 ${data.mom_change_type === 'increase' ? 'text-green-600' : data.mom_change_type === 'decrease' ? 'text-red-600' : ''}`}>
                                                                  {data.mom_change_rate > 0 ? '+' : ''}{data.mom_change_rate.toFixed(1)}%
                                                            </span>
                                                      </p>
                                                )}
                                                {data.yoy_change_rate !== 0 && (
                                                      <p className="text-sm">
                                                            <span className="text-muted-foreground">同比:</span>
                                                            <span className={`ml-2 ${data.yoy_change_type === 'increase' ? 'text-green-600' : data.yoy_change_type === 'decrease' ? 'text-red-600' : ''}`}>
                                                                  {data.yoy_change_rate > 0 ? '+' : ''}{data.yoy_change_rate.toFixed(1)}%
                                                            </span>
                                                      </p>
                                                )}
                                          </>
                                    )}
                              </div>
                        </div>
                  );
            }
            return null;
      };

      if (isLoading) {
            return (
                  <Card>
                        <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    趋势图表
                              </CardTitle>
                        </CardHeader>
                        <CardContent>
                              <div className="flex justify-center items-center h-80">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              </div>
                        </CardContent>
                  </Card>
            );
      }

      if (!chartData || chartData.length === 0) {
            return (
                  <Card>
                        <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    趋势图表
                              </CardTitle>
                        </CardHeader>
                        <CardContent>
                              <div className="text-center py-16 text-muted-foreground">
                                    暂无数据
                              </div>
                        </CardContent>
                  </Card>
            );
      }

      return (
            <Card>
                  <CardHeader>
                        <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    趋势图表
                              </CardTitle>

                              {/* 统计信息 */}
                              {stats && (
                                    <div className="flex items-center gap-4 text-sm">
                                          <div className="text-center">
                                                <div className="text-muted-foreground">总量</div>
                                                <div className="font-mono font-semibold">{stats.totalQuantity.toLocaleString()}</div>
                                          </div>
                                          <div className="text-center">
                                                <div className="text-muted-foreground">平均</div>
                                                <div className="font-mono font-semibold">{stats.avgQuantity.toLocaleString()}</div>
                                          </div>
                                          <div className="text-center">
                                                <div className="text-muted-foreground">趋势</div>
                                                <Badge
                                                      variant={stats.trendType === 'increase' ? 'default' : stats.trendType === 'decrease' ? 'destructive' : 'secondary'}
                                                      className={stats.trendType === 'increase' ? 'bg-green-100 text-green-800' : ''}
                                                >
                                                      {stats.trendRate > 0 ? '+' : ''}{stats.trendRate}%
                                                </Badge>
                                          </div>
                                    </div>
                              )}
                        </div>

                        {/* 控制面板 */}
                        <div className="flex items-center justify-between pt-4 border-t">
                              <div className="flex items-center gap-4">
                                    {/* 图表类型切换 */}
                                    <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as ChartType)}>
                                          <ToggleGroupItem value="line" aria-label="折线图">
                                                <LineChartIcon className="h-4 w-4" />
                                                <span className="ml-1">折线图</span>
                                          </ToggleGroupItem>
                                          <ToggleGroupItem value="bar" aria-label="柱状图">
                                                <BarChart3 className="h-4 w-4" />
                                                <span className="ml-1">柱状图</span>
                                          </ToggleGroupItem>
                                    </ToggleGroup>
                              </div>

                              <div className="flex items-center gap-6">
                                    {/* 移动平均线开关 */}
                                    <div className="flex items-center gap-2">
                                          <Switch
                                                id="moving-average"
                                                checked={showMovingAverage}
                                                onCheckedChange={setShowMovingAverage}
                                          />
                                          <Label htmlFor="moving-average" className="text-sm">
                                                {movingAveragePeriod}日均线
                                          </Label>
                                    </div>

                                    {/* 同比环比开关 */}
                                    <div className="flex items-center gap-2">
                                          <Switch
                                                id="comparison"
                                                checked={showComparison}
                                                onCheckedChange={setShowComparison}
                                          />
                                          <Label htmlFor="comparison" className="text-sm">
                                                同比环比
                                          </Label>
                                    </div>
                              </div>
                        </div>
                  </CardHeader>

                  <CardContent>
                        <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'line' ? (
                                          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                <XAxis
                                                      dataKey="formattedDate"
                                                      tick={{ fontSize: 12 }}
                                                      angle={-45}
                                                      textAnchor="end"
                                                      height={60}
                                                />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />

                                                {/* 主要数据线 */}
                                                <Line
                                                      type="monotone"
                                                      dataKey="total_quantity"
                                                      stroke="#2563eb"
                                                      strokeWidth={2}
                                                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                                                      activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                                                      name="总出力量"
                                                />

                                                {/* 移动平均线 */}
                                                {showMovingAverage && (
                                                      <Line
                                                            type="monotone"
                                                            dataKey="movingAverage"
                                                            stroke="#f59e0b"
                                                            strokeWidth={2}
                                                            strokeDasharray="5 5"
                                                            dot={false}
                                                            name={`${movingAveragePeriod}日均线`}
                                                      />
                                                )}

                                                {/* 平均值参考线 */}
                                                {stats && (
                                                      <ReferenceLine
                                                            y={stats.avgQuantity}
                                                            stroke="#6b7280"
                                                            strokeDasharray="2 2"
                                                            label={{ value: "平均值", position: "top" }}
                                                      />
                                                )}
                                          </LineChart>
                                    ) : (
                                          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                <XAxis
                                                      dataKey="formattedDate"
                                                      tick={{ fontSize: 12 }}
                                                      angle={-45}
                                                      textAnchor="end"
                                                      height={60}
                                                />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />

                                                {/* 主要数据柱 */}
                                                <Bar
                                                      dataKey="total_quantity"
                                                      fill="#2563eb"
                                                      name="总出力量"
                                                      radius={[2, 2, 0, 0]}
                                                />

                                                {/* 移动平均线 */}
                                                {showMovingAverage && (
                                                      <Line
                                                            type="monotone"
                                                            dataKey="movingAverage"
                                                            stroke="#f59e0b"
                                                            strokeWidth={2}
                                                            strokeDasharray="5 5"
                                                            dot={false}
                                                            name={`${movingAveragePeriod}日均线`}
                                                      />
                                                )}

                                                {/* 平均值参考线 */}
                                                {stats && (
                                                      <ReferenceLine
                                                            y={stats.avgQuantity}
                                                            stroke="#6b7280"
                                                            strokeDasharray="2 2"
                                                            label={{ value: "平均值", position: "top" }}
                                                      />
                                                )}
                                          </BarChart>
                                    )}
                              </ResponsiveContainer>
                        </div>
                  </CardContent>
            </Card>
      );
};

export default DateStatsChart; 