import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import StatsControlPanel from './StatsControlPanel';
import StatsFilterPanel from './StatsFilterPanel';
import StatsDataDisplay from './StatsDataDisplay';

export type StatsDimension = 'category' | 'shop' | 'courier' | 'date';

const ShopOutputStats = () => {
      const [isLoading, setIsLoading] = useState(false);
      const [selectedDimension, setSelectedDimension] = useState<StatsDimension>('shop');
      const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
            from: undefined,
            to: undefined,
      });

      const handleDimensionChange = (dimension: StatsDimension) => {
            setSelectedDimension(dimension);
      };

      const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
            setDateRange(range);
      };

      const handleRefresh = () => {
            setIsLoading(true);
            // 模拟加载
            setTimeout(() => {
                  setIsLoading(false);
            }, 1000);
      };

      return (
            <div className="space-y-4">
                  <StatsControlPanel
                        selectedDimension={selectedDimension}
                        onDimensionChange={handleDimensionChange}
                        dateRange={dateRange}
                        onDateRangeChange={handleDateRangeChange}
                        onRefresh={handleRefresh}
                  />

                  <StatsFilterPanel
                        selectedDimension={selectedDimension}
                  />

                  <StatsDataDisplay
                        isLoading={isLoading}
                        selectedDimension={selectedDimension}
                  />
            </div>
      );
};

export default ShopOutputStats; 