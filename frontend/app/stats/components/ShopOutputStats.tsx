import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import StatsControlPanel from './StatsControlPanel';
import StatsFilterPanel from './StatsFilterPanel';
import StatsDataDisplay from './StatsDataDisplay';
import { useRouter, useSearchParams } from 'next/navigation';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { getCategoryStats } from '@/lib/api/stats';
import { CategoryStatsItem } from '@/lib/types/stats';
import { useTranslation } from 'react-i18next';


export type StatsDimension = 'category' | 'shop' | 'courier' | 'date';

const ShopOutputStats = () => {
      const { t } = useTranslation('stats'); // 使用'stats'命名空间
      const router = useRouter();
      const searchParams = useSearchParams();
      const [isLoading, setIsLoading] = useState(false);
      const [selectedDimension, setSelectedDimension] = useState<StatsDimension>(() => {
            // 从URL参数或localStorage中获取初始维度，默认为'category'
            const dimensionFromUrl = searchParams.get('dimension') as StatsDimension;
            const storedDimension = typeof window !== 'undefined' ?
                  localStorage.getItem('selectedStatsDimension') as StatsDimension : null;
            return dimensionFromUrl || storedDimension || 'category';
      });
      const [dateRange, setDateRange] = useState<DateRange>({
            from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // 当前月第一天
            to: new Date(), // 今天
      });
      const [categoryData, setCategoryData] = useState<CategoryStatsItem[]>([]);
      const [filters, setFilters] = useState<{
            courier_ids?: string[];
            category_ids?: string[];
            shop_ids?: string[];
      }>({});

      // 当维度变化时更新URL和localStorage
      useEffect(() => {
            // 更新localStorage
            localStorage.setItem('selectedStatsDimension', selectedDimension);

            // 更新URL参数
            const params = new URLSearchParams(searchParams.toString());
            params.set('dimension', selectedDimension);
            router.push(`?${params.toString()}`, { scroll: false });
      }, [selectedDimension, router, searchParams]);

      // 获取数据的函数
      const fetchData = async () => {
            setIsLoading(true);
            try {
                  // 根据选择的统计维度获取不同的数据
                  if (selectedDimension === 'category') {
                        const dateFrom = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
                        const dateTo = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

                        // 构建API请求参数
                        const params: any = {
                              date_from: dateFrom,
                              date_to: dateTo,
                        };

                        // 添加筛选条件
                        if (filters.courier_ids && filters.courier_ids.length > 0) {
                              // 确保courier_id是数字类型
                              const courierId = parseInt(filters.courier_ids[0]);
                              if (!isNaN(courierId) && courierId !== -1) {
                                    params.courier_id = courierId;
                              }
                        }

                        console.log('请求类别统计数据，参数:', params);

                        // 调用API并更新状态
                        const data = await getCategoryStats(params);
                        console.log('类别统计API响应:', data);
                        setCategoryData(data);
                  } else if (selectedDimension === 'shop') {
                        // 暂时留空，未来实现
                        console.log('店铺统计维度暂未实现');
                  } else if (selectedDimension === 'courier') {
                        // 暂时留空，未来实现
                        console.log('快递类型统计维度暂未实现');
                  }
            } catch (error) {
                  console.error('获取数据失败:', error);
                  alert('获取数据失败，请重试');
            } finally {
                  setIsLoading(false);
            }
      };

      // 当组件挂载、维度变化或日期范围变化时获取数据
      useEffect(() => {
            fetchData();
      }, [selectedDimension, dateRange, filters]);

      const handleDimensionChange = (dimension: StatsDimension) => {
            setSelectedDimension(dimension);
      };

      const handleDateRangeChange = (range: DateRange) => {
            setDateRange(range);
      };

      const handleRefresh = () => {
            fetchData();
      };

      const handleFilterChange = (newFilters: any) => {
            setFilters(newFilters);
      };

      const handleResetFilters = () => {
            setFilters({});
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
                        onFilterChange={handleFilterChange}
                        onResetFilters={handleResetFilters}
                  />

                  <StatsDataDisplay
                        isLoading={isLoading}
                        selectedDimension={selectedDimension}
                        categoryData={categoryData}
                  />
            </div>
      );
};

export default ShopOutputStats; 