import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import StatsControlPanel from './StatsControlPanel';
import StatsFilterPanel from './StatsFilterPanel';
import StatsDataDisplay from './StatsDataDisplay';
import { useRouter, useSearchParams } from 'next/navigation';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { getCategoryStats, getShopStats, getCourierTypes, getShopCategories, getShops } from '@/lib/api/stats';
import { CategoryStatsItem, ShopStatsItem, CourierType, ShopCategory, Shop } from '@/lib/types/stats';
import { useTranslation } from 'react-i18next';
import ShopStatsTable from './ShopStatsTable';
import ShopStatsChart from './ShopStatsChart';


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
      const [shopData, setShopData] = useState<ShopStatsItem[]>([]);
      const [error, setError] = useState<Error | null>(null);
      const [filters, setFilters] = useState<{
            courier_ids?: string[];
            category_ids?: string[];
            shop_ids?: string[];
      }>({});

      // 新增筛选器选项数据状态
      const [courierTypes, setCourierTypes] = useState<CourierType[]>([]);
      const [shopCategories, setShopCategories] = useState<ShopCategory[]>([]);
      const [shops, setShops] = useState<Shop[]>([]);
      const [isLoadingFilterData, setIsLoadingFilterData] = useState(false);

      // 当维度变化时更新URL和localStorage
      useEffect(() => {
            // 更新localStorage
            localStorage.setItem('selectedStatsDimension', selectedDimension);

            // 更新URL参数
            const params = new URLSearchParams(searchParams.toString());
            params.set('dimension', selectedDimension);
            router.push(`?${params.toString()}`, { scroll: false });
      }, [selectedDimension, router, searchParams]);

      // 获取筛选器数据
      useEffect(() => {
            const fetchFilterData = async () => {
                  setIsLoadingFilterData(true);
                  try {
                        // 获取快递类型列表
                        const courierTypesData = await getCourierTypes();
                        setCourierTypes(courierTypesData);

                        // 获取店铺类别列表
                        const shopCategoriesData = await getShopCategories();
                        setShopCategories(shopCategoriesData);

                        // 获取店铺列表
                        // 如果选择了类别筛选，则按类别筛选店铺
                        const categoryId = filters.category_ids && filters.category_ids.length > 0
                              ? parseInt(filters.category_ids[0])
                              : undefined;

                        if (categoryId && !isNaN(categoryId)) {
                              const shopsData = await getShops(categoryId);
                              setShops(shopsData);
                        } else {
                              const shopsData = await getShops();
                              setShops(shopsData);
                        }
                  } catch (error) {
                        console.error('获取筛选器数据失败:', error);
                        // 这里可以选择是否显示错误消息
                  } finally {
                        setIsLoadingFilterData(false);
                  }
            };

            fetchFilterData();
      }, [filters.category_ids]); // 当类别筛选变化时，重新获取店铺列表

      // 获取数据的函数
      const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                  const dateFrom = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
                  const dateTo = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

                  // 构建API请求参数
                  const params: any = {
                        date_from: dateFrom,
                        date_to: dateTo,
                  };

                  // 根据选择的统计维度获取不同的数据
                  if (selectedDimension === 'category') {
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
                        // 添加店铺维度的筛选条件
                        if (filters.courier_ids && filters.courier_ids.length > 0) {
                              const courierId = parseInt(filters.courier_ids[0]);
                              if (!isNaN(courierId) && courierId !== -1) {
                                    params.courier_id = courierId;
                              }
                        }

                        if (filters.category_ids && filters.category_ids.length > 0) {
                              const categoryId = parseInt(filters.category_ids[0]);
                              if (!isNaN(categoryId) && categoryId !== -1) {
                                    params.category_id = categoryId;
                              }
                        }

                        // 额外参数，用于获取快递类型分布和趋势数据
                        params.include_courier_distribution = true;
                        params.include_trending_data = true;

                        console.log('请求店铺统计数据，参数:', params);

                        // 调用API获取店铺数据
                        const data = await getShopStats(params);
                        console.log('店铺统计API响应:', data);
                        setShopData(data);
                  } else if (selectedDimension === 'courier') {
                        // 暂时留空，未来实现
                        console.log('快递类型统计维度暂未实现');
                  }
            } catch (error) {
                  console.error('获取数据失败:', error);
                  setError(error instanceof Error ? error : new Error('获取数据失败，请重试'));
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

      // 根据维度渲染不同的数据展示组件
      const renderDataDisplay = () => {
            if (selectedDimension === 'category') {
                  return (
                        <StatsDataDisplay
                              isLoading={isLoading}
                              selectedDimension={selectedDimension}
                              categoryData={categoryData}
                        />
                  );
            } else if (selectedDimension === 'shop') {
                  return (
                        <div className="space-y-4">
                              {/* 图表区域 */}
                              <Card>
                                    <div className="p-4">
                                          <h3 className="text-lg font-medium mb-4">{t('数据图表')}</h3>
                                          <ShopStatsChart data={shopData} />
                                    </div>
                              </Card>

                              {/* 数据表格 */}
                              <Card>
                                    <div className="p-4">
                                          <h3 className="text-lg font-medium mb-4">{t('数据表格')}</h3>
                                          <ShopStatsTable
                                                data={shopData}
                                                isLoading={isLoading}
                                                error={error}
                                                onRetry={handleRefresh}
                                          />
                                    </div>
                              </Card>
                        </div>
                  );
            } else {
                  // 其他维度，使用默认的数据展示
                  return (
                        <StatsDataDisplay
                              isLoading={isLoading}
                              selectedDimension={selectedDimension}
                              categoryData={categoryData}
                        />
                  );
            }
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
                        isLoading={isLoadingFilterData}
                        onFilterChange={handleFilterChange}
                        onResetFilters={handleResetFilters}
                        courierTypes={courierTypes}
                        shopCategories={shopCategories}
                        shops={shops}
                  />

                  {renderDataDisplay()}
            </div>
      );
};

export default ShopOutputStats; 