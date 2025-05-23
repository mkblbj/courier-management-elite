import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import StatsControlPanel from './StatsControlPanel';
import StatsFilterPanel from './StatsFilterPanel';
import StatsDataDisplay from './StatsDataDisplay';
import { useRouter, useSearchParams } from 'next/navigation';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { getCategoryStats, getShopStats, getCourierTypes, getShopCategories, getShops, prefetchStatsData, clearStatsCache } from '@/lib/api/stats';
import { CategoryStatsItem, ShopStatsItem, CourierType, ShopCategory, Shop } from '@/lib/types/stats';
import { useTranslation } from 'react-i18next';
import ShopStatsTable from './ShopStatsTable';
import ShopStatsChart from './ShopStatsChart';
import PerformanceMonitor from './PerformanceMonitor';

export type StatsDimension = 'category' | 'shop' | 'courier' | 'date';

// 性能指标接口
interface PerformanceMetrics {
      loadTime: number;
      cacheHitRate: number;
      dataSize: number;
      renderTime: number;
      memoryUsage?: number;
}

// 数据缓存接口
interface CacheEntry<T> {
      data: T;
      timestamp: number;
      key: string;
}

// 缓存管理类
class StatsCache {
      private cache = new Map<string, CacheEntry<any>>();
      private readonly TTL = 5 * 60 * 1000; // 5分钟缓存

      set<T>(key: string, data: T): void {
            this.cache.set(key, {
                  data,
                  timestamp: Date.now(),
                  key
            });
      }

      get<T>(key: string): T | null {
            const entry = this.cache.get(key);
            if (!entry) return null;

            if (Date.now() - entry.timestamp > this.TTL) {
                  this.cache.delete(key);
                  return null;
            }

            return entry.data;
      }

      clear(): void {
            this.cache.clear();
      }

      clearByPattern(pattern: string): void {
            for (const [key] of this.cache) {
                  if (key.includes(pattern)) {
                        this.cache.delete(key);
                  }
            }
      }
}

const statsCache = new StatsCache();

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

      // 性能监控状态
      const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
      const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
            loadTime: 0,
            cacheHitRate: 0,
            dataSize: 0,
            renderTime: 0
      });
      const [loadStartTime, setLoadStartTime] = useState<number>(0);

      // 检查是否为开发模式
      const isDevelopment = process.env.NODE_ENV === 'development';

      // 生成缓存键
      const generateCacheKey = useCallback((dimension: StatsDimension, params: any) => {
            return `stats_${dimension}_${JSON.stringify(params)}`;
      }, []);

      // 当维度变化时更新URL和localStorage
      useEffect(() => {
            // 更新localStorage
            localStorage.setItem('selectedStatsDimension', selectedDimension);

            // 更新URL参数
            const params = new URLSearchParams(searchParams.toString());
            params.set('dimension', selectedDimension);
            router.push(`?${params.toString()}`, { scroll: false });
      }, [selectedDimension, router, searchParams]);

      // 获取筛选器数据（带缓存）
      const fetchFilterData = useCallback(async () => {
            const cacheKey = `filter_data_${filters.category_ids?.join(',') || 'all'}`;
            const cached = statsCache.get<{
                  courierTypes: CourierType[];
                  shopCategories: ShopCategory[];
                  shops: Shop[];
            }>(cacheKey);

            if (cached) {
                  setCourierTypes(cached.courierTypes);
                  setShopCategories(cached.shopCategories);
                  setShops(cached.shops);
                  return;
            }

            setIsLoadingFilterData(true);
            try {
                  const [courierTypesData, shopCategoriesData] = await Promise.all([
                        getCourierTypes(),
                        getShopCategories()
                  ]);

                  const categoryId = filters.category_ids && filters.category_ids.length > 0
                        ? parseInt(filters.category_ids[0])
                        : undefined;

                  const shopsData = categoryId && !isNaN(categoryId)
                        ? await getShops(categoryId)
                        : await getShops();

                  const filterData = {
                        courierTypes: courierTypesData,
                        shopCategories: shopCategoriesData,
                        shops: shopsData
                  };

                  statsCache.set(cacheKey, filterData);
                  setCourierTypes(courierTypesData);
                  setShopCategories(shopCategoriesData);
                  setShops(shopsData);
            } catch (error) {
                  console.error('获取筛选器数据失败:', error);
            } finally {
                  setIsLoadingFilterData(false);
            }
      }, [filters.category_ids]);

      useEffect(() => {
            fetchFilterData();
      }, [fetchFilterData]);

      // 获取数据的函数（带缓存和错误重试）
      const fetchData = useCallback(async (useCache = true) => {
            const startTime = performance.now();
            setLoadStartTime(startTime);
            setIsLoading(true);
            setError(null);

            try {
                  const dateFrom = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
                  const dateTo = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

                  const params: any = {
                        date_from: dateFrom,
                        date_to: dateTo,
                  };

                  const cacheKey = generateCacheKey(selectedDimension, { ...params, ...filters });
                  let cacheHit = false;

                  // 尝试从缓存获取数据
                  if (useCache) {
                        const cachedData = statsCache.get(cacheKey);
                        if (cachedData) {
                              if (selectedDimension === 'category') {
                                    setCategoryData(cachedData as CategoryStatsItem[]);
                              } else if (selectedDimension === 'shop') {
                                    setShopData(cachedData as ShopStatsItem[]);
                              }
                              cacheHit = true;
                              setIsLoading(false);

                              // 更新性能指标
                              const loadTime = performance.now() - startTime;
                              setPerformanceMetrics(prev => ({
                                    ...prev,
                                    loadTime,
                                    cacheHitRate: 100,
                                    dataSize: JSON.stringify(cachedData).length
                              }));
                              return;
                        }
                  }

                  if (selectedDimension === 'category') {
                        if (filters.courier_ids && filters.courier_ids.length > 0) {
                              const courierId = parseInt(filters.courier_ids[0]);
                              if (!isNaN(courierId) && courierId !== -1) {
                                    params.courier_id = courierId;
                              }
                        }

                        const data = await getCategoryStats(params);
                        setCategoryData(data);
                        statsCache.set(cacheKey, data);

                        // 更新性能指标
                        const loadTime = performance.now() - startTime;
                        setPerformanceMetrics(prev => ({
                              ...prev,
                              loadTime,
                              cacheHitRate: cacheHit ? 100 : 0,
                              dataSize: JSON.stringify(data).length
                        }));
                  } else if (selectedDimension === 'shop') {
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

                        params.include_courier_distribution = true;
                        params.include_trending_data = true;
                        params.include_category_info = true;

                        const data = await getShopStats(params);

                        // 验证数据结构并添加详细日志
                        if (!Array.isArray(data)) {
                              console.warn('店铺统计API返回的数据格式不正确:', data);
                              setShopData([]);
                        } else {
                              console.log('成功获取店铺统计数据:', {
                                    count: data.length,
                                    sample: data.slice(0, 2), // 显示前两条数据作为样本
                                    totalQuantitySum: data.reduce((sum, shop) => sum + (shop.total_quantity || 0), 0),
                                    categoriesFound: [...new Set(data.map(shop => shop.category_name).filter(Boolean))],
                                    hasCategories: data.some(shop => shop.category_name)
                              });
                              setShopData(data);
                        }

                        statsCache.set(cacheKey, data);

                        // 更新性能指标
                        const loadTime = performance.now() - startTime;
                        setPerformanceMetrics(prev => ({
                              ...prev,
                              loadTime,
                              cacheHitRate: cacheHit ? 100 : 0,
                              dataSize: JSON.stringify(data).length
                        }));
                  } else if (selectedDimension === 'courier') {
                        // 暂时留空，未来实现
                        console.log('快递类型统计维度暂未实现');
                  }
            } catch (error) {
                  console.error('获取数据失败:', error);
                  setError(error instanceof Error ? error : new Error('获取数据失败，请重试'));

                  // 更新错误情况下的性能指标
                  const loadTime = performance.now() - startTime;
                  setPerformanceMetrics(prev => ({
                        ...prev,
                        loadTime,
                        cacheHitRate: 0
                  }));
            } finally {
                  setIsLoading(false);
            }
      }, [selectedDimension, dateRange, filters, generateCacheKey]);

      useEffect(() => {
            fetchData();
      }, [fetchData]);

      const handleDimensionChange = useCallback((dimension: StatsDimension) => {
            setSelectedDimension(dimension);
            setError(null);
            // 清除相关缓存
            statsCache.clearByPattern(dimension);
      }, []);

      const handleDateRangeChange = useCallback((range: DateRange) => {
            setDateRange(range);
            setError(null);
            // 清除所有数据缓存
            statsCache.clear();
      }, []);

      const handleRefresh = useCallback(() => {
            statsCache.clear();
            clearStatsCache(); // 清除API缓存
            // 强制清除浏览器缓存
            if (typeof window !== 'undefined') {
                  localStorage.removeItem('selectedStatsDimension');
            }
            fetchData(false);
      }, [fetchData]);

      const handleFilterChange = useCallback((newFilters: any) => {
            setFilters(newFilters);
            setError(null);
            // 清除相关缓存
            statsCache.clearByPattern('stats_');
            clearStatsCache();
      }, []);

      const handleResetFilters = useCallback(() => {
            setFilters({});
            setError(null);
            statsCache.clear();
            clearStatsCache();
      }, []);

      // 错误重试处理
      const handleRetry = useCallback(() => {
            fetchData(false);
      }, [fetchData]);

      // 数据预取 - 当维度变化时预取相关数据
      useEffect(() => {
            if (dateRange.from && dateRange.to) {
                  const dateFrom = format(dateRange.from, 'yyyy-MM-dd');
                  const dateTo = format(dateRange.to, 'yyyy-MM-dd');

                  const params = {
                        date_from: dateFrom,
                        date_to: dateTo,
                        ...filters
                  };

                  // 预取其他维度的数据
                  if (selectedDimension === 'shop') {
                        prefetchStatsData('category', params);
                  } else if (selectedDimension === 'category') {
                        prefetchStatsData('shop', params);
                  }
            }
      }, [selectedDimension, dateRange, filters]);

      // 根据维度渲染不同的数据展示组件
      const renderDataDisplay = useMemo(() => {
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
                        <div className="space-y-6">
                              {/* 错误提示 */}
                              {error && (
                                    <Alert variant="destructive">
                                          <AlertCircle className="h-4 w-4" />
                                          <AlertDescription className="flex items-center justify-between">
                                                <span>{error.message}</span>
                                                <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={handleRetry}
                                                      className="ml-4"
                                                >
                                                      <RefreshCw className="h-4 w-4 mr-2" />
                                                      重试
                                                </Button>
                                          </AlertDescription>
                                    </Alert>
                              )}

                              {/* 数据概览卡片 */}
                              {!isLoading && shopData.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <Card>
                                                <CardHeader className="pb-2">
                                                      <CardTitle className="text-sm font-medium text-muted-foreground">
                                                            {t('店铺总数')}
                                                      </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                      <div className="text-2xl font-bold">{shopData.length}</div>
                                                </CardContent>
                                          </Card>
                                          <Card>
                                                <CardHeader className="pb-2">
                                                      <CardTitle className="text-sm font-medium text-muted-foreground">
                                                            {t('总出力量')}
                                                      </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                      <div className="text-2xl font-bold">
                                                            {shopData.reduce((sum, shop) => sum + shop.total_quantity, 0).toLocaleString()}
                                                      </div>
                                                </CardContent>
                                          </Card>
                                          <Card>
                                                <CardHeader className="pb-2">
                                                      <CardTitle className="text-sm font-medium text-muted-foreground">
                                                            {t('平均日出力量')}
                                                      </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                      <div className="text-2xl font-bold">
                                                            {(shopData.reduce((sum, shop) => sum + (shop.daily_average || 0), 0) / shopData.length).toFixed(2)}
                                                      </div>
                                                </CardContent>
                                          </Card>
                                    </div>
                              )}

                              {/* 加载状态 */}
                              {isLoading && (
                                    <Card>
                                          <CardContent className="flex items-center justify-center py-8">
                                                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                                                <span>{t('正在加载数据...')}</span>
                                          </CardContent>
                                    </Card>
                              )}

                              {/* 空数据状态 */}
                              {!isLoading && !error && shopData.length === 0 && (
                                    <Card>
                                          <CardContent className="flex flex-col items-center justify-center py-8">
                                                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                                                <h3 className="text-lg font-medium mb-2">{t('暂无数据')}</h3>
                                                <p className="text-muted-foreground text-center mb-4">
                                                      {t('当前时间范围内没有找到店铺统计数据，请尝试调整筛选条件')}
                                                </p>
                                                <Button onClick={handleRefresh} variant="outline">
                                                      <RefreshCw className="h-4 w-4 mr-2" />
                                                      {t('重新加载')}
                                                </Button>
                                          </CardContent>
                                    </Card>
                              )}

                              {/* 图表区域 */}
                              <Card>
                                    <CardHeader>
                                          <CardTitle className="flex items-center justify-between">
                                                {t('数据图表')}
                                                <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={handleRefresh}
                                                      disabled={isLoading}
                                                >
                                                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                                      {t('刷新')}
                                                </Button>
                                          </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                          <ShopStatsChart
                                                data={shopData}
                                                groupByCategory={true}
                                                maxDataPoints={shopData.length > 50 ? 20 : shopData.length}
                                                enableLazyLoading={true}
                                          />
                                    </CardContent>
                              </Card>

                              {/* 数据表格 */}
                              <Card>
                                    <CardHeader>
                                          <CardTitle>{t('详细数据')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                          <ShopStatsTable
                                                data={shopData}
                                                isLoading={isLoading}
                                                error={error}
                                                onRetry={handleRetry}
                                                groupByCategory={true}
                                                enableVirtualization={shopData.length > 50}
                                                maxHeight={600}
                                          />
                                    </CardContent>
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
      }, [selectedDimension, isLoading, categoryData, shopData, error, handleRetry, handleRefresh, t]);

      return (
            <div className="space-y-6">
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

                  {renderDataDisplay}

                  {/* 性能监控组件 */}
                  <PerformanceMonitor
                        metrics={performanceMetrics}
                        isVisible={showPerformanceMonitor && isDevelopment}
                        onToggle={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
                  />
            </div>
      );
};

export default ShopOutputStats; 