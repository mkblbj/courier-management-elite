import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Loader2, AlertCircle } from 'lucide-react';
import type { StatsDimension } from './ShopOutputStats';
import CategoryStatsTable from './CategoryStatsTable';
import CategoryStatsChart from './CategoryStatsChart';
import DateStatsTable from './DateStatsTable';
import DateStatsChart from './DateStatsChart';
import DateDetailModal from './DateDetailModal';
import { CategoryStatsItem, DateStatsItem } from '@/lib/types/stats';
import { useTranslation } from 'react-i18next';

interface StatsDataDisplayProps {
      isLoading: boolean;
      selectedDimension: StatsDimension;
      categoryData?: CategoryStatsItem[];
      dateData?: DateStatsItem[];
      groupBy?: 'day' | 'week' | 'month' | 'year';
      onDateClick?: (date: string) => void;
}

const StatsDataDisplay: React.FC<StatsDataDisplayProps> = ({
      isLoading,
      selectedDimension,
      categoryData = [],
      dateData = [],
      groupBy = 'day',
      onDateClick
}) => {
      const { t } = useTranslation('stats');
      const [selectedDate, setSelectedDate] = useState<string | null>(null);
      const [isModalOpen, setIsModalOpen] = useState(false);

      const handleDateClick = (date: string) => {
            setSelectedDate(date);
            setIsModalOpen(true);
            onDateClick?.(date);
      };

      const selectedDateData = selectedDate ? dateData.find(item => item.date === selectedDate) : null;

      // 检查是否有数据
      const hasData = () => {
            switch (selectedDimension) {
                  case 'category':
                        return categoryData.length > 0;
                  case 'date':
                        return dateData.length > 0;
                  default:
                        return false;
            }
      };

      // 获取维度显示名称
      const getDimensionDisplayName = () => {
            switch (selectedDimension) {
                  case 'category':
                        return t('店铺类别统计');
                  case 'shop':
                        return t('店铺统计');
                  case 'courier':
                        return t('快递类型统计');
                  case 'date':
                        return t('日期统计');
                  default:
                        return t('数据统计');
            }
      };

      // 渲染空数据状态
      const renderEmptyState = () => (
            <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('暂无数据')}</h3>
                  <p className="text-muted-foreground text-center">
                        {t('当前时间范围内没有找到相关统计数据，请尝试调整筛选条件')}
                  </p>
            </div>
      );

      return (
            <div className="space-y-4">
                  {/* 图表区域 */}
                  <Card>
                        <CardHeader>
                              <CardTitle className="text-lg">{getDimensionDisplayName()} - {t('数据图表')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                              {isLoading ? (
                                    <div className="flex justify-center items-center h-60">
                                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                          <span className="ml-2 text-muted-foreground">{t('正在加载图表数据...')}</span>
                                    </div>
                              ) : hasData() ? (
                                    <>
                                          {selectedDimension === 'category' && (
                                                <CategoryStatsChart data={categoryData} />
                                          )}
                                          {selectedDimension === 'date' && (
                                                <DateStatsChart
                                                      data={dateData}
                                                      isLoading={isLoading}
                                                      groupBy={groupBy}
                                                />
                                          )}
                                    </>
                              ) : (
                                    renderEmptyState()
                              )}
                        </CardContent>
                  </Card>

                  {/* 数据表格 */}
                  <Card>
                        <CardHeader>
                              <CardTitle className="text-lg">{getDimensionDisplayName()} - {t('详细数据')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                              {isLoading ? (
                                    <div className="flex justify-center items-center h-40">
                                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                          <span className="ml-2 text-muted-foreground">{t('正在加载表格数据...')}</span>
                                    </div>
                              ) : hasData() ? (
                                    <>
                                          {selectedDimension === 'category' && (
                                                <CategoryStatsTable data={categoryData} />
                                          )}
                                          {selectedDimension === 'date' && (
                                                <DateStatsTable
                                                      data={dateData}
                                                      isLoading={isLoading}
                                                      onDateClick={onDateClick}
                                                      groupBy={groupBy}
                                                />
                                          )}
                                    </>
                              ) : (
                                    renderEmptyState()
                              )}
                        </CardContent>
                  </Card>

                  {/* 日期详情模态框 */}
                  {selectedDimension === 'date' && (
                        <DateDetailModal
                              isOpen={isModalOpen}
                              onClose={() => setIsModalOpen(false)}
                              date={selectedDate || ''}
                              groupBy={groupBy}
                              data={selectedDateData}
                        />
                  )}
            </div>
      );
};

export default StatsDataDisplay; 