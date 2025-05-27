import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { RefreshCw, Download, BarChart, LineChart, PieChart, Calendar } from 'lucide-react';
import type { StatsDimension } from './ShopOutputStats';
import type { DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';
import ExportDialog from './ExportDialog';
import { getExportData, exportData, type ExportOptions } from '@/lib/services/export';
import { toast } from 'sonner';

// 定义月年范围类型
interface MonthYearRange {
      from?: { year: number; month?: number };
      to?: { year: number; month?: number };
}

interface StatsControlPanelProps {
      selectedDimension: StatsDimension;
      onDimensionChange: (dimension: StatsDimension) => void;
      dateRange: DateRange;
      onDateRangeChange: (range: DateRange) => void;
      monthRange?: MonthYearRange;
      onMonthRangeChange?: (range: MonthYearRange | undefined) => void;
      yearRange?: MonthYearRange;
      onYearRangeChange?: (range: MonthYearRange | undefined) => void;
      onRefresh: () => void;
      groupBy?: 'day' | 'week' | 'month' | 'year';
      onGroupByChange?: (groupBy: 'day' | 'week' | 'month' | 'year') => void;
      // 导出相关的可选筛选条件
      shopId?: number;
      categoryId?: number;
      courierId?: number;
}

const StatsControlPanel: React.FC<StatsControlPanelProps> = ({
      selectedDimension,
      onDimensionChange,
      dateRange,
      onDateRangeChange,
      monthRange,
      onMonthRangeChange,
      yearRange,
      onYearRangeChange,
      onRefresh,
      groupBy = 'day',
      onGroupByChange,
      shopId,
      categoryId,
      courierId,
}) => {
      const { t } = useTranslation('stats'); // 使用'stats'命名空间

      // 导出相关状态
      const [exportDialogOpen, setExportDialogOpen] = useState(false);
      const [isExporting, setIsExporting] = useState(false);
      const [exportProgress, setExportProgress] = useState(0);
      const [exportError, setExportError] = useState<string | undefined>();

      // 格式化日期为字符串
      const formatDateForApi = (date: Date | undefined): string | undefined => {
            if (!date) return undefined;
            return date.toISOString().split('T')[0];
      };

      // 获取当前的日期范围
      const getCurrentDateRange = () => {
            let fromDate: string | undefined;
            let toDate: string | undefined;

            if (selectedDimension === 'date' && groupBy === 'month' && monthRange) {
                  if (monthRange.from) {
                        fromDate = `${monthRange.from.year}-${String(monthRange.from.month || 1).padStart(2, '0')}-01`;
                  }
                  if (monthRange.to) {
                        const lastDay = new Date(monthRange.to.year, monthRange.to.month || 12, 0).getDate();
                        toDate = `${monthRange.to.year}-${String(monthRange.to.month || 12).padStart(2, '0')}-${lastDay}`;
                  }
            } else if (selectedDimension === 'date' && groupBy === 'year' && yearRange) {
                  if (yearRange.from) {
                        fromDate = `${yearRange.from.year}-01-01`;
                  }
                  if (yearRange.to) {
                        toDate = `${yearRange.to.year}-12-31`;
                  }
            } else {
                  fromDate = formatDateForApi(dateRange?.from);
                  toDate = formatDateForApi(dateRange?.to);
            }

            return { fromDate, toDate };
      };

      // 处理导出
      const handleExport = async (options: ExportOptions) => {
            try {
                  setIsExporting(true);
                  setExportProgress(0);
                  setExportError(undefined);

                  const { fromDate, toDate } = getCurrentDateRange();

                  // 获取导出数据
                  setExportProgress(20);
                  const data = await getExportData({
                        dateFrom: fromDate,
                        dateTo: toDate,
                        shopId,
                        categoryId,
                        courierId,
                  });

                  if (data.length === 0) {
                        toast.warning('没有可导出的数据');
                        return;
                  }

                  // 执行导出
                  setExportProgress(50);
                  await exportData(data, options, (progress) => {
                        setExportProgress(50 + progress * 0.5);
                  });

                  setExportProgress(100);
                  toast.success(`成功导出 ${data.length} 条数据`);
                  setExportDialogOpen(false);
            } catch (error) {
                  console.error('导出失败:', error);
                  const errorMessage = error instanceof Error ? error.message : '导出失败';
                  setExportError(errorMessage);
                  toast.error(errorMessage);
            } finally {
                  setIsExporting(false);
                  setTimeout(() => {
                        setExportProgress(0);
                        setExportError(undefined);
                  }, 2000);
            }
      };

      // 获取每个维度对应的图标
      const getDimensionIcon = (dimension: StatsDimension) => {
            switch (dimension) {
                  case 'category':
                        return <BarChart className="h-4 w-4 mr-1" />;
                  case 'shop':
                        return <PieChart className="h-4 w-4 mr-1" />;
                  case 'courier':
                        return <LineChart className="h-4 w-4 mr-1" />;
                  case 'date':
                        return <Calendar className="h-4 w-4 mr-1" />;
                  default:
                        return null;
            }
      };

      // 根据分组方式渲染合适的时间筛选器
      const renderTimeFilter = () => {
            // 只有在日期维度时才显示时间筛选器
            if (selectedDimension !== 'date') {
                  return (
                        <div className="w-full sm:w-auto">
                              <DateRangePicker
                                    value={dateRange}
                                    onChange={onDateRangeChange}
                              />
                        </div>
                  );
            }

            switch (groupBy) {
                  case 'day':
                  case 'week':
                        return (
                              <div className="w-full sm:w-auto">
                                    <DateRangePicker
                                          value={dateRange}
                                          onChange={onDateRangeChange}
                                    />
                              </div>
                        );
                  case 'month':
                        return (
                              <div className="w-full sm:w-auto">
                                    <MonthYearPicker
                                          mode="month"
                                          value={monthRange}
                                          onChange={onMonthRangeChange || (() => { })}
                                    />
                              </div>
                        );
                  case 'year':
                        return (
                              <div className="w-full sm:w-auto">
                                    <MonthYearPicker
                                          mode="year"
                                          value={yearRange}
                                          onChange={onYearRangeChange || (() => { })}
                                    />
                              </div>
                        );
                  default:
                        return (
                              <div className="w-full sm:w-auto">
                                    <DateRangePicker
                                          value={dateRange}
                                          onChange={onDateRangeChange}
                                    />
                              </div>
                        );
            }
      };

      return (
            <>
                  <Card>
                        <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="space-y-2 w-full md:w-auto">
                                          <div className="text-sm font-medium">{t('统计维度')}</div>
                                          <ToggleGroup type="single" value={selectedDimension} onValueChange={(value) => value && onDimensionChange(value as StatsDimension)}>
                                                <ToggleGroupItem value="date" aria-label={t('按日期')} className="flex items-center">
                                                      {getDimensionIcon('date')}
                                                      {t('按日期')}
                                                </ToggleGroupItem>
                                                <ToggleGroupItem value="category" aria-label={t('按店铺类别')} className="flex items-center">
                                                      {getDimensionIcon('category')}
                                                      {t('按店铺类别')}
                                                </ToggleGroupItem>
                                                <ToggleGroupItem value="shop" aria-label={t('按店铺')} className="flex items-center">
                                                      {getDimensionIcon('shop')}
                                                      {t('按店铺')}
                                                </ToggleGroupItem>
                                                <ToggleGroupItem value="courier" aria-label={t('按快递类型')} className="flex items-center">
                                                      {getDimensionIcon('courier')}
                                                      {t('按快递类型')}
                                                </ToggleGroupItem>
                                          </ToggleGroup>

                                          {/* 日期分组选择 - 仅在日期维度时显示 */}
                                          {selectedDimension === 'date' && onGroupByChange && (
                                                <div className="space-y-2">
                                                      <div className="text-sm font-medium">{t('分组方式')}</div>
                                                      <ToggleGroup type="single" value={groupBy} onValueChange={(value) => value && onGroupByChange(value as 'day' | 'week' | 'month' | 'year')}>
                                                            <ToggleGroupItem value="day" aria-label={t('按日')} className="text-xs">
                                                                  {t('按日')}
                                                            </ToggleGroupItem>
                                                            <ToggleGroupItem value="week" aria-label={t('按周')} className="text-xs">
                                                                  {t('按周')}
                                                            </ToggleGroupItem>
                                                            <ToggleGroupItem value="month" aria-label={t('按月')} className="text-xs">
                                                                  {t('按月')}
                                                            </ToggleGroupItem>
                                                            <ToggleGroupItem value="year" aria-label={t('按年')} className="text-xs">
                                                                  {t('按年')}
                                                            </ToggleGroupItem>
                                                      </ToggleGroup>
                                                </div>
                                          )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full md:w-auto">
                                          {renderTimeFilter()}
                                          <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={onRefresh}>
                                                      <RefreshCw className="h-4 w-4 mr-1" />
                                                      {t('刷新')}
                                                </Button>
                                                <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => setExportDialogOpen(true)}
                                                      disabled={isExporting}
                                                >
                                                      <Download className="h-4 w-4 mr-1" />
                                                      {t('导出')}
                                                </Button>
                                          </div>
                                    </div>
                              </div>
                        </CardContent>
                  </Card>

                  {/* 导出对话框 */}
                  <ExportDialog
                        open={exportDialogOpen}
                        onOpenChange={setExportDialogOpen}
                        onExport={handleExport}
                        dateRange={(() => {
                              const { fromDate, toDate } = getCurrentDateRange();
                              return fromDate && toDate ? { from: fromDate, to: toDate } : undefined;
                        })()}
                        isExporting={isExporting}
                        exportProgress={exportProgress}
                        exportError={exportError}
                  />
            </>
      );
};

export default StatsControlPanel; 