import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { RefreshCw, Download, BarChart, LineChart, PieChart, Calendar } from 'lucide-react';
import type { StatsDimension } from './ShopOutputStats';
import type { DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';


interface StatsControlPanelProps {
      selectedDimension: StatsDimension;
      onDimensionChange: (dimension: StatsDimension) => void;
      dateRange: DateRange;
      onDateRangeChange: (range: DateRange) => void;
      onRefresh: () => void;
}

const StatsControlPanel: React.FC<StatsControlPanelProps> = ({
      selectedDimension,
      onDimensionChange,
      dateRange,
      onDateRangeChange,
      onRefresh,
}) => {
      const { t } = useTranslation('stats'); // 使用'stats'命名空间
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

      return (
            <Card>
                  <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="space-y-2 w-full md:w-auto">
                                    <div className="text-sm font-medium">{t('统计维度')}</div>
                                    <ToggleGroup type="single" value={selectedDimension} onValueChange={(value) => value && onDimensionChange(value as StatsDimension)}>
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
                                          <ToggleGroupItem value="date" aria-label={t('按日期')} className="flex items-center">
                                                {getDimensionIcon('date')}
                                                {t('按日期')}
                                          </ToggleGroupItem>
                                    </ToggleGroup>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full md:w-auto">
                                    <div className="w-full sm:w-auto">
                                          <DateRangePicker
                                                value={dateRange}
                                                onChange={onDateRangeChange}
                                          />
                                    </div>
                                    <div className="flex items-center gap-2">
                                          <Button variant="outline" size="sm" onClick={onRefresh}>
                                                <RefreshCw className="h-4 w-4 mr-1" />
                                                {t('刷新')}
                                          </Button>
                                          <Button variant="outline" size="sm">
                                                <Download className="h-4 w-4 mr-1" />
                                                {t('导出')}
                                          </Button>
                                    </div>
                              </div>
                        </div>
                  </CardContent>
            </Card>
      );
};

export default StatsControlPanel; 