import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { RefreshCw, Download, BarChart, LineChart, PieChart, Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import type { StatsDimension } from './ShopOutputStats';
import type { DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';
import ExportDialog from './ExportDialog';
import { getExportData, exportData, type ExportOptions } from '@/lib/services/export';
import { toast } from 'sonner';
import { MultiSelect, MultiSelectItem } from '@/components/ui/multi-select';
import { CourierType, ShopCategory, Shop } from '@/lib/types/stats';
import { Separator } from '@/components/ui/separator';

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
      // 筛选条件相关
      onFilterChange?: (filters: any) => void;
      onResetFilters?: () => void;
      courierTypes?: CourierType[];
      shopCategories?: ShopCategory[];
      shops?: Shop[];
      isFilterLoading?: boolean;
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
      onFilterChange,
      onResetFilters,
      courierTypes = [],
      shopCategories = [],
      shops = [],
      isFilterLoading = false,
}) => {
      const { t } = useTranslation('stats'); // 使用'stats'命名空间

      // 导出相关状态
      const [exportDialogOpen, setExportDialogOpen] = useState(false);
      const [isExporting, setIsExporting] = useState(false);
      const [exportProgress, setExportProgress] = useState(0);
      const [exportError, setExportError] = useState<string | undefined>();

      // 筛选条件相关状态
      const [isFilterExpanded, setIsFilterExpanded] = useState(false);
      const [courierTypeFilter, setCourierTypeFilter] = useState<string[]>([]);
      const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
      const [shopFilter, setShopFilter] = useState<string[]>([]);

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

      // 处理应用筛选按钮点击
      const handleApplyFilter = () => {
            if (onFilterChange) {
                  // 过滤掉无效值（-1是加载中的占位值）
                  const validCourierIds = courierTypeFilter.filter(id => id !== '-1');
                  const validCategoryIds = categoryFilter.filter(id => id !== '-1');
                  const validShopIds = shopFilter.filter(id => id !== '-1');

                  onFilterChange({
                        courier_ids: validCourierIds.length > 0 ? validCourierIds : undefined,
                        category_ids: validCategoryIds.length > 0 ? validCategoryIds : undefined,
                        shop_ids: validShopIds.length > 0 ? validShopIds : undefined
                  });
            }
      };

      // 处理重置筛选按钮点击
      const handleResetFilter = () => {
            setCourierTypeFilter([]);
            setCategoryFilter([]);
            setShopFilter([]);
            if (onResetFilters) {
                  onResetFilters();
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
                        <div className="w-full max-w-sm">
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
                              <div className="w-full max-w-sm">
                                    <DateRangePicker
                                          value={dateRange}
                                          onChange={onDateRangeChange}
                                    />
                              </div>
                        );
                  case 'month':
                        return (
                              <div className="w-full max-w-sm">
                                    <MonthYearPicker
                                          mode="month"
                                          value={monthRange}
                                          onChange={onMonthRangeChange || (() => { })}
                                    />
                              </div>
                        );
                  case 'year':
                        return (
                              <div className="w-full max-w-sm">
                                    <MonthYearPicker
                                          mode="year"
                                          value={yearRange}
                                          onChange={onYearRangeChange || (() => { })}
                                    />
                              </div>
                        );
                  default:
                        return (
                              <div className="w-full max-w-sm">
                                    <DateRangePicker
                                          value={dateRange}
                                          onChange={onDateRangeChange}
                                    />
                              </div>
                        );
            }
      };

      // 渲染快递类型筛选器项
      const renderCourierTypeItems = () => {
            if (courierTypes.length === 0) {
                  return (
                        <MultiSelectItem value="-1">{t('加载中...')}</MultiSelectItem>
                  );
            }

            return courierTypes.map((type) => (
                  <MultiSelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                  </MultiSelectItem>
            ));
      };

      // 渲染店铺类别筛选器项
      const renderShopCategoryItems = () => {
            if (shopCategories.length === 0) {
                  return (
                        <MultiSelectItem value="-1">{t('加载中...')}</MultiSelectItem>
                  );
            }

            return shopCategories.map((category) => (
                  <MultiSelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                  </MultiSelectItem>
            ));
      };

      // 渲染店铺筛选器项
      const renderShopItems = () => {
            if (shops.length === 0) {
                  return (
                        <MultiSelectItem value="-1">{t('加载中...')}</MultiSelectItem>
                  );
            }

            return shops.map((shop) => (
                  <MultiSelectItem key={shop.id} value={shop.id.toString()}>
                        {shop.name}
                  </MultiSelectItem>
            ));
      };

      // 检查是否需要显示筛选条件
      const shouldShowFilters = () => {
            return (selectedDimension === 'category' || selectedDimension === 'shop' || selectedDimension === 'courier') && onFilterChange;
      };

      return (
            <>
                  <Card>
                        <CardContent className="p-4 space-y-5">
                              {/* 第一行：统计维度选择 */}
                              <div className="space-y-3">
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
                              </div>

                              {/* 第二行：分组方式（仅在日期维度时显示） */}
                              {selectedDimension === 'date' && onGroupByChange && (
                                    <div className="space-y-3">
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

                              {/* 第三行：时间范围和操作按钮 */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex-1">
                                          {renderTimeFilter()}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
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
                                          {/* 筛选条件展开按钮 */}
                                          {shouldShowFilters() && (
                                                <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                                >
                                                      <Filter className="h-4 w-4 mr-1" />
                                                      {t('筛选条件')}
                                                      {isFilterExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                                                </Button>
                                          )}
                                    </div>
                              </div>

                              {/* 筛选条件区域 */}
                              {shouldShowFilters() && isFilterExpanded && (
                                    <>
                                          <Separator />
                                          <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                      <Filter className="h-4 w-4" />
                                                      <h4 className="text-sm font-medium">{t('筛选条件')}</h4>
                                                </div>

                                                {isFilterLoading ? (
                                                      <div className="flex justify-center items-center py-4">
                                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                      </div>
                                                ) : (
                                                      <>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                  {/* 快递类型筛选器 - 对于按类别和按店铺维度显示 */}
                                                                  {(selectedDimension === 'category' || selectedDimension === 'shop') && (
                                                                        <div className="space-y-2">
                                                                              <label className="text-sm font-medium">{t('快递类型')}</label>
                                                                              <MultiSelect
                                                                                    value={courierTypeFilter}
                                                                                    onChange={setCourierTypeFilter}
                                                                                    placeholder={t('选择快递类型')}
                                                                              >
                                                                                    {renderCourierTypeItems()}
                                                                              </MultiSelect>
                                                                        </div>
                                                                  )}

                                                                  {/* 店铺类别筛选器 - 对于按店铺或按快递类型维度显示 */}
                                                                  {(selectedDimension === 'shop' || selectedDimension === 'courier') && (
                                                                        <div className="space-y-2">
                                                                              <label className="text-sm font-medium">{t('店铺类别')}</label>
                                                                              <MultiSelect
                                                                                    value={categoryFilter}
                                                                                    onChange={setCategoryFilter}
                                                                                    placeholder={t('选择店铺类别')}
                                                                              >
                                                                                    {renderShopCategoryItems()}
                                                                              </MultiSelect>
                                                                        </div>
                                                                  )}

                                                                  {/* 店铺筛选器 - 对于按快递类型维度显示 */}
                                                                  {selectedDimension === 'courier' && (
                                                                        <div className="space-y-2">
                                                                              <label className="text-sm font-medium">{t('店铺')}</label>
                                                                              <MultiSelect
                                                                                    value={shopFilter}
                                                                                    onChange={setShopFilter}
                                                                                    placeholder={t('选择店铺')}
                                                                              >
                                                                                    {renderShopItems()}
                                                                              </MultiSelect>
                                                                        </div>
                                                                  )}
                                                            </div>

                                                            <div className="flex justify-end space-x-2">
                                                                  <Button variant="outline" size="sm" onClick={handleResetFilter}>
                                                                        {t('重置')}
                                                                  </Button>
                                                                  <Button size="sm" onClick={handleApplyFilter}>
                                                                        {t('应用筛选')}
                                                                  </Button>
                                                            </div>
                                                      </>
                                                )}
                                          </div>
                                    </>
                              )}
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