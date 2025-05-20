import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import StatsControlPanel from './StatsControlPanel';
import StatsFilterPanel from './StatsFilterPanel';
import StatsDataDisplay from './StatsDataDisplay';
import { useRouter, useSearchParams } from 'next/navigation';
import type { DateRange } from 'react-day-picker';

export type StatsDimension = 'category' | 'shop' | 'courier' | 'date';

const ShopOutputStats = () => {
      const router = useRouter();
      const searchParams = useSearchParams();
      const [isLoading, setIsLoading] = useState(false);
      const [selectedDimension, setSelectedDimension] = useState<StatsDimension>(() => {
            // 从URL参数或localStorage中获取初始维度，默认为'shop'
            const dimensionFromUrl = searchParams.get('dimension') as StatsDimension;
            const storedDimension = typeof window !== 'undefined' ?
                  localStorage.getItem('selectedStatsDimension') as StatsDimension : null;
            return dimensionFromUrl || storedDimension || 'shop';
      });
      const [dateRange, setDateRange] = useState<DateRange>({
            from: undefined,
            to: undefined,
      });

      // 当维度变化时更新URL和localStorage
      useEffect(() => {
            // 更新localStorage
            localStorage.setItem('selectedStatsDimension', selectedDimension);

            // 更新URL参数
            const params = new URLSearchParams(searchParams.toString());
            params.set('dimension', selectedDimension);
            router.push(`?${params.toString()}`, { scroll: false });
      }, [selectedDimension, router, searchParams]);

      const handleDimensionChange = (dimension: StatsDimension) => {
            setIsLoading(true);
            setSelectedDimension(dimension);

            // 模拟加载过程
            setTimeout(() => {
                  setIsLoading(false);
            }, 500);
      };

      const handleDateRangeChange = (range: DateRange) => {
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
                        isLoading={isLoading}
                  />

                  <StatsDataDisplay
                        isLoading={isLoading}
                        selectedDimension={selectedDimension}
                  />
            </div>
      );
};

export default ShopOutputStats; 