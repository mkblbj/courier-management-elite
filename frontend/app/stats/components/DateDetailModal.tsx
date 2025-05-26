import React, { useState, useEffect } from 'react';
import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, TrendingUp, TrendingDown, Minus, Package, Store, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DateDetailModalProps {
      isOpen: boolean;
      onClose: () => void;
      date: string;
      groupBy: 'day' | 'week' | 'month' | 'year';
      data?: {
            total_quantity: number;
            shops_count?: number;
            couriers_count?: number;
            avg_quantity?: number;
            mom_change_rate?: number;
            mom_change_type?: 'increase' | 'decrease' | 'unchanged';
            yoy_change_rate?: number;
            yoy_change_type?: 'increase' | 'decrease' | 'unchanged';
            percentage?: number;
      };
}

const DateDetailModal: React.FC<DateDetailModalProps> = ({
      isOpen,
      onClose,
      date,
      groupBy,
      data
}) => {
      const { t } = useTranslation('stats');
      const [isLoading, setIsLoading] = useState(false);

      // 格式化日期显示
      const formatDateDisplay = (dateStr: string, groupBy: string) => {
            try {
                  const currentLang = t('language') || 'zh-CN';

                  if (groupBy === 'day') {
                        const date = new Date(dateStr);
                        const formattedDate = format(date, 'yyyy-MM-dd');
                        const dayOfWeek = getDay(date);
                        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        const weekdayKey = weekdays[dayOfWeek];
                        const weekdayFull = t(`weekday.full.${weekdayKey}`, { ns: 'common' });
                        return `${formattedDate} (${weekdayFull})`;
                  } else if (groupBy === 'week') {
                        const [year, week] = dateStr.split('-');
                        if (currentLang === 'en' || currentLang === 'English') {
                              return `Week ${week}, ${year}`;
                        } else if (currentLang === 'ja' || currentLang === '日本語') {
                              return `${year}年第${week}週`;
                        } else {
                              return `${year}年第${week}周`;
                        }
                  } else if (groupBy === 'month') {
                        const [year, month] = dateStr.split('-');
                        if (currentLang === 'en' || currentLang === 'English') {
                              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                              return `${monthNames[parseInt(month) - 1]} ${year}`;
                        } else if (currentLang === 'ja' || currentLang === '日本語') {
                              return `${year}年${month}月`;
                        } else {
                              return `${year}年${month}月`;
                        }
                  } else if (groupBy === 'year') {
                        if (currentLang === 'en' || currentLang === 'English') {
                              return dateStr;
                        } else {
                              return `${dateStr}年`;
                        }
                  }
                  return dateStr;
            } catch (error) {
                  return dateStr;
            }
      };

      // 获取变化趋势图标和颜色
      const getTrendIcon = (changeType: string, changeRate: number) => {
            if (changeType === 'increase') {
                  return <TrendingUp className="h-4 w-4 text-green-600" />;
            } else if (changeType === 'decrease') {
                  return <TrendingDown className="h-4 w-4 text-red-600" />;
            } else {
                  return <Minus className="h-4 w-4 text-gray-500" />;
            }
      };

      const getTrendColor = (changeType: string) => {
            if (changeType === 'increase') {
                  return 'bg-green-100 text-green-800 border-green-200';
            } else if (changeType === 'decrease') {
                  return 'bg-red-100 text-red-800 border-red-200';
            } else {
                  return 'bg-gray-100 text-gray-800 border-gray-200';
            }
      };

      const formatChangeRate = (rate: number) => {
            if (rate === 0) return '0%';
            return `${rate > 0 ? '+' : ''}${rate}%`;
      };

      return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    {formatDateDisplay(date, groupBy)} - {t('详细统计')}
                              </DialogTitle>
                              <DialogDescription>
                                    {t('查看该时间段的详细出力数据统计信息')}
                              </DialogDescription>
                        </DialogHeader>

                        {isLoading ? (
                              <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                    <span>{t('正在加载详细数据...')}</span>
                              </div>
                        ) : data ? (
                              <div className="space-y-6">
                                    {/* 核心指标卡片 */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                          <Card>
                                                <CardHeader className="pb-2">
                                                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                                            <Package className="h-4 w-4" />
                                                            {t('总出力量')}
                                                      </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                      <div className="text-2xl font-bold">{data.total_quantity.toLocaleString()}</div>
                                                      <div className="text-xs text-muted-foreground mt-1">
                                                            {t('占比')} {data.percentage}%
                                                      </div>
                                                </CardContent>
                                          </Card>

                                          <Card>
                                                <CardHeader className="pb-2">
                                                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                                            <Store className="h-4 w-4" />
                                                            {t('活跃店铺')}
                                                      </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                      <div className="text-2xl font-bold">{data.shops_count || 0}</div>
                                                      <div className="text-xs text-muted-foreground mt-1">
                                                            {t('家店铺')}
                                                      </div>
                                                </CardContent>
                                          </Card>

                                          <Card>
                                                <CardHeader className="pb-2">
                                                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                                            <Truck className="h-4 w-4" />
                                                            {t('快递类型')}
                                                      </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                      <div className="text-2xl font-bold">{data.couriers_count}</div>
                                                      <div className="text-xs text-muted-foreground mt-1">
                                                            {t('种类型')}
                                                      </div>
                                                </CardContent>
                                          </Card>

                                          <Card>
                                                <CardHeader className="pb-2">
                                                      <CardTitle className="text-sm font-medium text-muted-foreground">
                                                            {t('平均出力量')}
                                                      </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                      <div className="text-2xl font-bold">{data.avg_quantity.toFixed(2)}</div>
                                                      <div className="text-xs text-muted-foreground mt-1">
                                                            {t('单量/天')}
                                                      </div>
                                                </CardContent>
                                          </Card>
                                    </div>

                                    {/* 变化趋势分析 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <Card>
                                                <CardHeader>
                                                      <CardTitle className="text-base">{t('环比变化')}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                      <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                  {getTrendIcon(data.mom_change_type, data.mom_change_rate)}
                                                                  <span className="text-sm text-muted-foreground">
                                                                        {t('与上期相比')}
                                                                  </span>
                                                            </div>
                                                            <Badge className={getTrendColor(data.mom_change_type)}>
                                                                  {formatChangeRate(data.mom_change_rate)}
                                                            </Badge>
                                                      </div>
                                                      <div className="mt-2 text-xs text-muted-foreground">
                                                            {data.mom_change_type === 'increase' && t('相比上期有所增长')}
                                                            {data.mom_change_type === 'decrease' && t('相比上期有所下降')}
                                                            {data.mom_change_type === 'unchanged' && t('相比上期保持不变')}
                                                      </div>
                                                </CardContent>
                                          </Card>

                                          <Card>
                                                <CardHeader>
                                                      <CardTitle className="text-base">{t('同比变化')}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                      <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                  {getTrendIcon(data.yoy_change_type, data.yoy_change_rate)}
                                                                  <span className="text-sm text-muted-foreground">
                                                                        {t('与去年同期相比')}
                                                                  </span>
                                                            </div>
                                                            <Badge className={getTrendColor(data.yoy_change_type)}>
                                                                  {formatChangeRate(data.yoy_change_rate)}
                                                            </Badge>
                                                      </div>
                                                      <div className="mt-2 text-xs text-muted-foreground">
                                                            {data.yoy_change_type === 'increase' && t('相比去年同期有所增长')}
                                                            {data.yoy_change_type === 'decrease' && t('相比去年同期有所下降')}
                                                            {data.yoy_change_type === 'unchanged' && t('相比去年同期保持不变')}
                                                      </div>
                                                </CardContent>
                                          </Card>
                                    </div>

                                    {/* 数据洞察 */}
                                    <Card>
                                          <CardHeader>
                                                <CardTitle className="text-base">{t('数据洞察')}</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                                <div className="space-y-2 text-sm">
                                                      <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">{t('平均每店出力量')}:</span>
                                                            <span className="font-medium">
                                                                  {data.shops_count > 0 ? (data.total_quantity / data.shops_count).toFixed(2) : '0'}
                                                            </span>
                                                      </div>
                                                      <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">{t('平均每类型出力量')}:</span>
                                                            <span className="font-medium">
                                                                  {data.couriers_count > 0 ? (data.total_quantity / data.couriers_count).toFixed(2) : '0'}
                                                            </span>
                                                      </div>
                                                      <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">{t('店铺活跃度')}:</span>
                                                            <span className="font-medium">
                                                                  {data.shops_count > 0 ? t('高') : t('低')}
                                                            </span>
                                                      </div>
                                                </div>
                                          </CardContent>
                                    </Card>
                              </div>
                        ) : (
                              <div className="flex flex-col items-center justify-center py-8">
                                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">{t('暂无详细数据')}</h3>
                                    <p className="text-muted-foreground text-center">
                                          {t('该时间段暂无详细统计数据')}
                                    </p>
                              </div>
                        )}
                  </DialogContent>
            </Dialog>
      );
};

export default DateDetailModal; 