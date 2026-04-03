import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
      LineChart,
      Line,
      XAxis,
      YAxis,
      CartesianGrid,
      Tooltip,
      Legend,
      ResponsiveContainer,
      ReferenceLine
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { DateStatsItem } from '@/lib/types/stats';
import { useTranslation } from 'react-i18next';
import { format, parseISO, getDay } from 'date-fns';
import { zhCN, enUS, ja } from 'date-fns/locale';

interface DateStatsChartProps {
      data: DateStatsItem[];
      isLoading?: boolean;
      groupBy?: 'day' | 'week' | 'month' | 'year';
      maxDataPoints?: number; // 最大数据点数量
      enableLazyLoading?: boolean; // 是否启用懒加载
}

const DateStatsChart: React.FC<DateStatsChartProps> = ({
      data,
      isLoading = false,
      groupBy = 'day',
      maxDataPoints = 100,
      enableLazyLoading = true
}) => {
      const { t, i18n } = useTranslation('stats');
      const [showMovingAverage, setShowMovingAverage] = useState(true);
      const [showComparison, setShowComparison] = useState(true);
      const [movingAveragePeriod, setMovingAveragePeriod] = useState(7);
      const [isChartVisible, setIsChartVisible] = useState(!enableLazyLoading);

      // 使用 ref 来避免不必要的重新计算
      const chartContainerRef = useRef<HTMLDivElement>(null);
      const observerRef = useRef<IntersectionObserver | null>(null);

      // 懒加载逻辑
      useEffect(() => {
            if (enableLazyLoading && chartContainerRef.current) {
                  observerRef.current = new IntersectionObserver(
                        (entries) => {
                              entries.forEach((entry) => {
                                    if (entry.isIntersecting) {
                                          setIsChartVisible(true);
                                          observerRef.current?.disconnect();
                                    }
                              });
                        },
                        { threshold: 0.1 }
                  );

                  observerRef.current.observe(chartContainerRef.current);

                  return () => {
                        observerRef.current?.disconnect();
                  };
            }
      }, [enableLazyLoading]);

      // 数据采样和优化
      const sampledData = useMemo(() => {
            if (!data || data.length === 0) return [];

            let processedData = [...data];

            // 如果数据量过大，进行采样
            if (processedData.length > maxDataPoints) {
                  const step = Math.ceil(processedData.length / maxDataPoints);
                  processedData = processedData.filter((_, index) => index % step === 0);
            }

            return processedData;
      }, [data, maxDataPoints]);

      // 处理和格式化数据
      const chartData = useMemo(() => {
            if (!sampledData || sampledData.length === 0) return [];

            // 按日期排序
            const sortedData = [...sampledData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            return sortedData.map((item, index) => {
                  // 获取当前语言的 date-fns locale
                  const getDateLocale = () => {
                        const currentLang = i18n.language || 'zh-CN';
                        switch (currentLang) {
                              case 'en':
                              case 'English':
                                    return enUS;
                              case 'ja':
                              case '日本語':
                                    return ja;
                              default:
                                    return zhCN;
                        }
                  };

                  // 获取星期的翻译
                  const getWeekdayTranslation = (date: Date, useShort: boolean = true) => {
                        const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        const weekdayKey = weekdays[dayOfWeek];
                        const translationKey = useShort ? `weekday.short.${weekdayKey}` : `weekday.full.${weekdayKey}`;
                        return t(translationKey, { ns: 'common' });
                  };

                  // 格式化日期显示
                  let formattedDate;
                  try {
                        const currentLang = i18n.language || 'zh-CN';
                        const locale = getDateLocale();

                        if (groupBy === 'week') {
                              const [year, week] = item.date.split('-');
                              if (currentLang === 'en' || currentLang === 'English') {
                                    formattedDate = `W${week} ${year}`;
                              } else if (currentLang === 'ja' || currentLang === '日本語') {
                                    formattedDate = `${year}年第${week}週`;
                              } else {
                                    formattedDate = `${year}年第${week}周`;
                              }
                        } else if (groupBy === 'month') {
                              const [year, month] = item.date.split('-');
                              if (currentLang === 'en' || currentLang === 'English') {
                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    formattedDate = `${monthNames[parseInt(month) - 1]} ${year}`;
                              } else {
                                    formattedDate = `${year}年${month}月`;
                              }
                        } else if (groupBy === 'year') {
                              if (currentLang === 'en' || currentLang === 'English') {
                                    formattedDate = item.date;
                              } else {
                                    formattedDate = `${item.date}年`;
                              }
                        } else {
                              // day - 根据数据量决定显示格式
                              const date = parseISO(item.date);
                              const weekday = getWeekdayTranslation(date, true);

                              // 如果数据点很多，只显示月-日格式
                              if (sampledData.length > 30) {
                                    const formattedDateOnly = format(date, 'MM-dd');
                                    formattedDate = `${formattedDateOnly}`;
                              } else if (sampledData.length > 15) {
                                    const formattedDateOnly = format(date, 'MM-dd');
                                    formattedDate = `${formattedDateOnly} (${weekday})`;
                              } else {
                                    const formattedDateOnly = format(date, 'yyyy-MM-dd');
                                    formattedDate = `${formattedDateOnly} (${weekday})`;
                              }
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
      }, [sampledData, groupBy, showMovingAverage, movingAveragePeriod, t, i18n.language]);

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

      // 自定义Tooltip - 使用 useCallback 避免重新创建
      const CustomTooltip = useCallback(({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                        <div className="bg-background border rounded-lg shadow-lg p-3 space-y-2">
                              <p className="font-semibold">{label}</p>
                              <div className="space-y-1">
                                    <p className="text-sm">
                                          <span className="text-muted-foreground">{t('总出力量')}:</span>
                                          <span className="font-mono ml-2">{data.total_quantity.toLocaleString()}</span>
                                    </p>
                                    <p className="text-sm">
                                          <span className="text-muted-foreground">{t('活跃店铺')}:</span>
                                          <span className="ml-2">{data.shops_count}</span>
                                    </p>
                                    {data.percentage > 0 && (
                                          <p className="text-sm">
                                                <span className="text-muted-foreground">{t('占比')}:</span>
                                                <span className="ml-2">{data.percentage.toFixed(1)}%</span>
                                          </p>
                                    )}
                                    {showMovingAverage && data.movingAverage && (
                                          <p className="text-sm">
                                                {/* 日均线（移动平均线）含义
                                                日均线是一种技术分析工具，用于平滑数据波动，显示趋势：
                                                计算方式
                                                7日均线：取当前日期及前6天共7天的平均值
                                                动态计算：每个数据点都基于其前N天的平均值
                                                趋势显示：帮助识别数据的整体走向，过滤掉短期波动
                                                实际意义
                                                趋势识别：平滑的曲线更容易看出上升/下降趋势
                                                噪音过滤：减少单日异常数据的影响
                                                预测参考：可作为未来走势的参考线
                                                📊 日均线含义解释
                                                日均线（移动平均线）是数据分析中的重要工具：
                                                计算方式：取连续N天数据的平均值（如7日均线 = 当天及前6天的平均值）
                                                作用：平滑数据波动，显示整体趋势
                                                应用场景：
                                                识别上升/下降趋势
                                                过滤短期异常波动
                                                作为预测参考线 */}
                                                <span className="text-muted-foreground">{t('{{movingAveragePeriod}}日均线', { movingAveragePeriod })}:</span>
                                                <span className="font-mono ml-2">{data.movingAverage.toLocaleString()}</span>
                                          </p>
                                    )}
                                    {showComparison && (
                                          <>
                                                {data.mom_change_rate !== 0 && (
                                                      <p className="text-sm">
                                                            <span className="text-muted-foreground">{t('环比')}:</span>
                                                            <span className={`ml-2 ${data.mom_change_type === 'increase' ? 'text-green-600' : data.mom_change_type === 'decrease' ? 'text-red-600' : ''}`}>
                                                                  {data.mom_change_rate > 0 ? '+' : ''}{data.mom_change_rate.toFixed(1)}%
                                                            </span>
                                                      </p>
                                                )}
                                                {data.yoy_change_rate !== 0 && (
                                                      <p className="text-sm">
                                                            <span className="text-muted-foreground">{t('同比')}:</span>
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
      }, [showMovingAverage, movingAveragePeriod, showComparison, t]);

      if (isLoading) {
            return (
                  <Card>
                        <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    {t('趋势图表')}
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
                                    {t('趋势图表')}
                              </CardTitle>
                        </CardHeader>
                        <CardContent>
                              <div className="text-center py-16 text-muted-foreground">
                                    {t('no_data')}
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
                                    {t('趋势图表')}
                                    {data.length > maxDataPoints && (
                                          <Badge variant="secondary" className="text-xs">
                                                {t('sampled')} {chartData.length}/{data.length}
                                          </Badge>
                                    )}
                              </CardTitle>

                              {/* 统计信息 */}
                              {stats && (
                                    <div className="flex items-center gap-4 text-sm">
                                          <div className="text-center">
                                                <div className="text-muted-foreground">{t('总量')}</div>
                                                <div className="font-mono font-semibold">{stats.totalQuantity.toLocaleString()}</div>
                                          </div>
                                          <div className="text-center">
                                                <div className="text-muted-foreground">{t('平均')}</div>
                                                <div className="font-mono font-semibold">{stats.avgQuantity.toLocaleString()}</div>
                                          </div>
                                          <div className="text-center">
                                                <div className="text-muted-foreground">{t('趋势')}</div>
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
                              <div className="flex items-center gap-6">
                                    {/* 移动平均线开关 */}
                                    <div className="flex items-center gap-2">
                                          <Switch
                                                id="moving-average"
                                                checked={showMovingAverage}
                                                onCheckedChange={setShowMovingAverage}
                                          />
                                          <Label htmlFor="moving-average" className="text-sm">
                                                {t('{{movingAveragePeriod}}日均线', { movingAveragePeriod })}
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
                                                {t('同比环比')}
                                          </Label>
                                    </div>
                              </div>
                        </div>
                  </CardHeader>

                  <CardContent>
                        <div ref={chartContainerRef} className="h-96">
                              {isChartVisible ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 100 }}>
                                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                <XAxis
                                                      dataKey="formattedDate"
                                                      tick={{ fontSize: 10 }}
                                                      angle={-45}
                                                      textAnchor="end"
                                                      height={100}
                                                      interval={chartData.length > 20 ? "preserveStartEnd" : chartData.length > 10 ? "preserveStart" : 0}
                                                      minTickGap={chartData.length > 30 ? 10 : 5}
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
                                                      dot={{ fill: '#2563eb', strokeWidth: 2, r: chartData.length > 50 ? 2 : 4 }}
                                                      activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: '#ffffff' }}
                                                      name={t('总出力量')}
                                                      connectNulls={false}
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
                                                            activeDot={{ r: 4, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
                                                            name={t('{{movingAveragePeriod}}日均线', { movingAveragePeriod })}
                                                            connectNulls={false}
                                                      />
                                                )}

                                                {/* 平均值参考线 */}
                                                {stats && (
                                                      <ReferenceLine
                                                            y={stats.avgQuantity}
                                                            stroke="#6b7280"
                                                            strokeDasharray="2 2"
                                                            label={{ value: t('平均值'), position: "top" }}
                                                      />
                                                )}
                                          </LineChart>
                                    </ResponsiveContainer>
                              ) : (
                                    <div className="flex justify-center items-center h-full">
                                          <div className="text-center">
                                                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                                <p className="text-muted-foreground">{t('图表正在加载...')}</p>
                                          </div>
                                    </div>
                              )}
                        </div>
                  </CardContent>
            </Card>
      );
};

export default DateStatsChart; 