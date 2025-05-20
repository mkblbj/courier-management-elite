import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { RefreshCw, Download } from 'lucide-react';
import type { StatsDimension } from './ShopOutputStats';

interface StatsControlPanelProps {
      selectedDimension: StatsDimension;
      onDimensionChange: (dimension: StatsDimension) => void;
      dateRange: { from: Date | undefined; to: Date | undefined };
      onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
      onRefresh: () => void;
}

const StatsControlPanel: React.FC<StatsControlPanelProps> = ({
      selectedDimension,
      onDimensionChange,
      dateRange,
      onDateRangeChange,
      onRefresh,
}) => {
      return (
            <Card>
                  <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="space-y-2 w-full md:w-auto">
                                    <div className="text-sm font-medium">统计维度</div>
                                    <ToggleGroup type="single" value={selectedDimension} onValueChange={(value) => value && onDimensionChange(value as StatsDimension)}>
                                          <ToggleGroupItem value="category" aria-label="按店铺类别">
                                                按店铺类别
                                          </ToggleGroupItem>
                                          <ToggleGroupItem value="shop" aria-label="按店铺">
                                                按店铺
                                          </ToggleGroupItem>
                                          <ToggleGroupItem value="courier" aria-label="按快递类型">
                                                按快递类型
                                          </ToggleGroupItem>
                                          <ToggleGroupItem value="date" aria-label="按日期">
                                                按日期
                                          </ToggleGroupItem>
                                    </ToggleGroup>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full md:w-auto">
                                    <div className="w-full sm:w-auto">
                                          <DatePickerWithRange
                                                dateRange={dateRange}
                                                onDateRangeChange={onDateRangeChange}
                                          />
                                    </div>
                                    <div className="flex items-center gap-2">
                                          <Button variant="outline" size="sm" onClick={onRefresh}>
                                                <RefreshCw className="h-4 w-4 mr-1" />
                                                刷新
                                          </Button>
                                          <Button variant="outline" size="sm">
                                                <Download className="h-4 w-4 mr-1" />
                                                导出
                                          </Button>
                                    </div>
                              </div>
                        </div>
                  </CardContent>
            </Card>
      );
};

export default StatsControlPanel; 