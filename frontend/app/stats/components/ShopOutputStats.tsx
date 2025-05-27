import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { getCategoryStats, getShopStats, getCourierStats, getDateStats, getCourierTypes, getShopCategories, getShops, prefetchStatsData, clearStatsCache } from '@/lib/api/stats';
import { CategoryStatsItem, ShopStatsItem, CourierStatsItem, DateStatsItem, CourierType, ShopCategory, Shop } from '@/lib/types/stats';
import { useTranslation } from 'react-i18next';
import ShopStatsTable from './ShopStatsTable';
import ShopStatsChart from './ShopStatsChart';
import CourierStatsTable from './CourierStatsTable';
import CourierStatsChart from './CourierStatsChart';
import PerformanceMonitor from './PerformanceMonitor';
import DateDetailModal from './DateDetailModal';
import CacheMonitor from './CacheMonitor';

export type StatsDimension = 'category' | 'shop' | 'courier' | 'date';

// 性能指标接口
interface PerformanceMetrics {
      loadTime: number;
      cacheHitRate: number;
      dataSize: number;
      renderTime: number;
      memoryUsage?: number;
}

// 使用全局缓存系统
import { statsCache, CacheKeyGenerator } from '@/lib/cache/stats-cache';

const ShopOutputStats = () => {
      const { t } = useTranslation('stats'); // 使用'stats'命名空间
      const router = useRouter();
      const searchParams = useSearchParams();
      const [isLoading, setIsLoading] = useState(false);
      const [selectedDimension, setSelectedDimension] = useState<StatsDimension>(() => {
            // 从URL参数或localStorage中获取初始维度，默认为'date'
            const dimensionFromUrl = searchParams.get('dimension') as StatsDimension;
            const storedDimension = typeof window !== 'undefined' ?
                  localStorage.getItem('selectedStatsDimension') as StatsDimension : null;
            return dimensionFromUrl || storedDimension || 'date';
      });
      const [dateRange, setDateRange] = useState<DateRange>({
            from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // 当前月第一天
            to: new Date(), // 今天
      });

      // 月份和年份范围状态
      interface MonthYearRange {
            from?: { year: number; month?: number };
            to?: { year: number; month?: number };
      }

      const [monthRange, setMonthRange] = useState<MonthYearRange>({
            from: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
            to: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
      });

      const [yearRange, setYearRange] = useState<MonthYearRange>({
            from: { year: new Date().getFullYear() },
            to: { year: new Date().getFullYear() }
      });

      // 使用 useRef 来存储数据，避免不必要的重新渲染
      const categoryDataRef = useRef<CategoryStatsItem[]>([]);
      const shopDataRef = useRef<ShopStatsItem[]>([]);
      const courierDataRef = useRef<CourierStatsItem[]>([]);
      const dateDataRef = useRef<DateStatsItem[]>([]);

      // 使用状态来触发重新渲染
      const [dataVersion, setDataVersion] = useState(0);

      const [error, setError] = useState<Error | null>(null);
      const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day');
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
      const [showCacheMonitor, setShowCacheMonitor] = useState(false);
      const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
            loadTime: 0,
            cacheHitRate: 0,
            dataSize: 0,
            renderTime: 0
      });
      const [loadStartTime, setLoadStartTime] = useState<number>(0);

      // 检查是否为开发模式
      const isDevelopment = process.env.NODE_ENV === 'development';

      // 日期详情模态框状态
      const [isDateDetailModalOpen, setIsDateDetailModalOpen] = useState(false);
      const [selectedDateData, setSelectedDateData] = useState<DateStatsItem | null>(null);

      // 内存监控
      const memoryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
      const [memoryWarning, setMemoryWarning] = useState<string | null>(null);

      // 启动内存监控
      useEffect(() => {
            if (isDevelopment && typeof window !== 'undefined' && 'performance' in window) {
                  let baselineMemory = 0;
                  let memoryGrowthCount = 0;

                  const checkMemoryUsage = () => {
                        try {
                              // @ts-ignore
                              if (performance.memory) {
                                    // @ts-ignore
                                    const memoryInfo = performance.memory;
                                    const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
                                    const totalMB = memoryInfo.totalJSHeapSize / (1024 * 1024);
                                    const limitMB = memoryInfo.jsHeapSizeLimit / (1024 * 1024);

                                    // 计算使用率
                                    const usageRate = (usedMB / limitMB) * 100;

                                    // 设置基线内存（首次检查时）
                                    if (baselineMemory === 0) {
                                          baselineMemory = usedMB;
                                    }

                                    // 检查内存增长
                                    const memoryGrowth = usedMB - baselineMemory;
                                    const growthRate = baselineMemory > 0 ? (memoryGrowth / baselineMemory) * 100 : 0;

                                    // 内存泄漏检测：连续增长且增长幅度大
                                    if (memoryGrowth > 50 && growthRate > 25) {
                                          memoryGrowthCount++;
                                    } else {
                                          memoryGrowthCount = 0;
                                    }

                                    // 更严格的阈值判断
                                    if (usageRate > 80 || usedMB > 800) {
                                          setMemoryWarning(`内存使用过高: ${usedMB.toFixed(1)}MB (${usageRate.toFixed(1)}%)，建议刷新页面`);
                                          // 自动清理缓存
                                          statsCache.clear();
                                          clearStatsCache();
                                    } else if (usageRate > 60 || usedMB > 500 || memoryGrowthCount >= 3) {
                                          setMemoryWarning(`内存使用较高: ${usedMB.toFixed(1)}MB (${usageRate.toFixed(1)}%)，建议清理缓存`);
                                    } else if (usageRate > 40 && memoryGrowthCount >= 2) {
                                          setMemoryWarning(`检测到内存持续增长: +${memoryGrowth.toFixed(1)}MB，建议清理缓存`);
                                    } else {
                                          setMemoryWarning(null);
                                    }

                                    // 定期重置基线（避免长期运行时基线过时）
                                    if (memoryGrowthCount === 0 && Math.random() < 0.1) {
                                          baselineMemory = usedMB;
                                    }
                              }
                        } catch (error) {
                              console.warn('内存检查失败:', error);
                        }
                  };

                  memoryCheckIntervalRef.current = setInterval(checkMemoryUsage, 15000); // 改为每15秒检查一次

                  return () => {
                        if (memoryCheckIntervalRef.current) {
                              clearInterval(memoryCheckIntervalRef.current);
                              memoryCheckIntervalRef.current = null;
                        }
                  };
            }
      }, [isDevelopment]);

      // 组件卸载时清理
      useEffect(() => {
            return () => {
                  if (memoryCheckIntervalRef.current) {
                        clearInterval(memoryCheckIntervalRef.current);
                        memoryCheckIntervalRef.current = null;
                  }
                  // 清理数据引用
                  categoryDataRef.current = [];
                  shopDataRef.current = [];
                  courierDataRef.current = [];
                  dateDataRef.current = [];
            };
      }, []);

      // 生成缓存键 - 使用全局缓存键生成器
      const generateCacheKey = useCallback((dimension: StatsDimension, params: any) => {
            return CacheKeyGenerator.generateStatsKey(dimension, params);
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

      // 处理月份和年份范围变化的函数
      const handleMonthRangeChange = useCallback((range: MonthYearRange | undefined) => {
            setMonthRange(range || {});
            setError(null);
            statsCache.clear();
      }, []);

      const handleYearRangeChange = useCallback((range: MonthYearRange | undefined) => {
            setYearRange(range || {});
            setError(null);
            statsCache.clear();
      }, []);

      // 根据 groupBy 获取合适的时间参数
      const getTimeParams = useCallback(() => {
            if (selectedDimension !== 'date') {
                  // 非日期维度始终使用日期范围
                  return {
                        date_from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                        date_to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                  };
            }

            switch (groupBy) {
                  case 'day':
                  case 'week':
                        return {
                              date_from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                              date_to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                        };
                  case 'month':
                        if (monthRange.from) {
                              const fromDate = new Date(monthRange.from.year, (monthRange.from.month || 1) - 1, 1);
                              const toDate = monthRange.to
                                    ? new Date(monthRange.to.year, (monthRange.to.month || 12), 0) // 月末
                                    : new Date(monthRange.from.year, (monthRange.from.month || 1), 0); // 同月月末
                              return {
                                    date_from: format(fromDate, 'yyyy-MM-dd'),
                                    date_to: format(toDate, 'yyyy-MM-dd'),
                              };
                        }
                        break;
                  case 'year':
                        if (yearRange.from) {
                              const fromDate = new Date(yearRange.from.year, 0, 1); // 年初
                              const toDate = yearRange.to
                                    ? new Date(yearRange.to.year, 11, 31) // 年末
                                    : new Date(yearRange.from.year, 11, 31); // 同年年末
                              return {
                                    date_from: format(fromDate, 'yyyy-MM-dd'),
                                    date_to: format(toDate, 'yyyy-MM-dd'),
                              };
                        }
                        break;
            }

            // 默认返回日期范围
            return {
                  date_from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                  date_to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
            };
      }, [selectedDimension, groupBy, dateRange, monthRange, yearRange]);

      // 获取数据的函数（带缓存和错误重试）
      const fetchData = useCallback(async (useCache = true) => {
            const startTime = performance.now();
            setLoadStartTime(startTime);
            setIsLoading(true);
            setError(null);

            try {
                  const timeParams = getTimeParams();
                  const params: any = {
                        ...timeParams,
                  };

                  // 对于日期维度，需要包含groupBy参数到缓存键中
                  const cacheParams = selectedDimension === 'date'
                        ? { ...params, ...filters, group_by: groupBy }
                        : { ...params, ...filters };

                  const cacheKey = generateCacheKey(selectedDimension, cacheParams);
                  let cacheHit = false;

                  // 尝试从缓存获取数据
                  if (useCache) {
                        const cachedData = statsCache.get(cacheKey);
                        if (cachedData) {
                              // 使用 ref 存储数据，避免不必要的重新渲染
                              if (selectedDimension === 'category') {
                                    categoryDataRef.current = cachedData as CategoryStatsItem[];
                              } else if (selectedDimension === 'shop') {
                                    shopDataRef.current = cachedData as ShopStatsItem[];
                              } else if (selectedDimension === 'courier') {
                                    courierDataRef.current = cachedData as CourierStatsItem[];
                              } else if (selectedDimension === 'date') {
                                    dateDataRef.current = cachedData as DateStatsItem[];
                              }

                              setDataVersion(prev => prev + 1); // 触发重新渲染
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

                  let data: any;
                  let dataSize = 0;

                  if (selectedDimension === 'category') {
                        if (filters.courier_ids && filters.courier_ids.length > 0) {
                              const courierId = parseInt(filters.courier_ids[0]);
                              if (!isNaN(courierId) && courierId !== -1) {
                                    params.courier_id = courierId;
                              }
                        }

                        data = await getCategoryStats(params);
                        categoryDataRef.current = data;
                        statsCache.set(cacheKey, data);
                        dataSize = JSON.stringify(data).length;
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

                        data = await getShopStats(params);

                        // 验证数据结构并添加详细日志
                        if (!Array.isArray(data)) {
                              console.warn('店铺统计API返回的数据格式不正确:', data);
                              shopDataRef.current = [];
                        } else {
                              console.log('成功获取店铺统计数据:', {
                                    count: data.length,
                                    sample: data.slice(0, 2), // 显示前两条数据作为样本
                                    totalQuantitySum: data.reduce((sum, shop) => sum + (shop.total_quantity || 0), 0),
                                    categoriesFound: [...new Set(data.map(shop => shop.category_name).filter(Boolean))],
                                    hasCategories: data.some(shop => shop.category_name)
                              });
                              shopDataRef.current = data;
                        }

                        statsCache.set(cacheKey, data);
                        dataSize = JSON.stringify(data).length;
                  } else if (selectedDimension === 'courier') {
                        // 处理快递类型统计的筛选参数
                        if (filters.shop_ids && filters.shop_ids.length > 0) {
                              const shopId = parseInt(filters.shop_ids[0]);
                              if (!isNaN(shopId) && shopId !== -1) {
                                    params.shop_id = shopId;
                              }
                        }

                        if (filters.category_ids && filters.category_ids.length > 0) {
                              const categoryId = parseInt(filters.category_ids[0]);
                              if (!isNaN(categoryId) && categoryId !== -1) {
                                    params.category_id = categoryId;
                              }
                        }

                        console.log('快递类型统计API调用参数:', params);
                        console.log('当前筛选器状态:', filters);

                        data = await getCourierStats(params);

                        // 验证数据结构并添加详细日志
                        if (!Array.isArray(data)) {
                              console.warn('快递类型统计API返回的数据格式不正确:', data);
                              courierDataRef.current = [];
                        } else {
                              console.log('成功获取快递类型统计数据:', {
                                    count: data.length,
                                    sample: data.slice(0, 2), // 显示前两条数据作为样本
                                    totalQuantitySum: data.reduce((sum, courier) => sum + (courier.total_quantity || 0), 0),
                                    couriersFound: data.map(courier => courier.courier_name)
                              });
                              courierDataRef.current = data;
                        }

                        statsCache.set(cacheKey, data);
                        dataSize = JSON.stringify(data).length;
                  } else if (selectedDimension === 'date') {
                        // 处理日期统计的筛选参数
                        if (filters.shop_ids && filters.shop_ids.length > 0) {
                              const shopId = parseInt(filters.shop_ids[0]);
                              if (!isNaN(shopId) && shopId !== -1) {
                                    params.shop_id = shopId;
                              }
                        }

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

                        // 添加分组参数
                        params.group_by = groupBy;

                        console.log('日期统计API调用参数:', params);
                        console.log('当前筛选器状态:', filters);
                        console.log('分组方式:', groupBy);

                        data = await getDateStats(params);

                        // 验证数据结构并添加详细日志
                        if (!Array.isArray(data)) {
                              console.warn('日期统计API返回的数据格式不正确:', data);
                              dateDataRef.current = [];
                        } else {
                              console.log('成功获取日期统计数据:', {
                                    count: data.length,
                                    sample: data.slice(0, 2), // 显示前两条数据作为样本
                                    totalQuantitySum: data.reduce((sum, item) => sum + (item.total_quantity || 0), 0),
                                    dateRange: data.length > 0 ? `${data[0].date} - ${data[data.length - 1].date}` : 'N/A',
                                    groupBy: groupBy
                              });
                              dateDataRef.current = data;
                        }

                        statsCache.set(cacheKey, data);
                        dataSize = JSON.stringify(data).length;
                  }

                  setDataVersion(prev => prev + 1); // 触发重新渲染

                  // 更新性能指标
                  const loadTime = performance.now() - startTime;
                  setPerformanceMetrics(prev => ({
                        ...prev,
                        loadTime,
                        cacheHitRate: cacheHit ? 100 : 0,
                        dataSize
                  }));
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
      }, [selectedDimension, filters, groupBy, generateCacheKey, getTimeParams]);

      useEffect(() => {
            fetchData();
      }, [fetchData]);

      const handleDimensionChange = useCallback((dimension: StatsDimension) => {
            setSelectedDimension(dimension);
            setError(null);
            // 清除相关缓存
            statsCache.clearByPattern(dimension);
      }, []);

      const handleGroupByChange = useCallback((newGroupBy: 'day' | 'week' | 'month' | 'year') => {
            setGroupBy(newGroupBy);
            setError(null);
            // 清除日期相关的缓存
            statsCache.clearByPattern('date');
            statsCache.clearByPattern('stats_date');
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
            // 清理数据引用
            categoryDataRef.current = [];
            shopDataRef.current = [];
            courierDataRef.current = [];
            dateDataRef.current = [];
            setDataVersion(prev => prev + 1);
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
                        prefetchStatsData('courier', params);
                  } else if (selectedDimension === 'category') {
                        prefetchStatsData('shop', params);
                        prefetchStatsData('courier', params);
                  } else if (selectedDimension === 'courier') {
                        prefetchStatsData('category', params);
                        prefetchStatsData('shop', params);
                  }
            }
      }, [selectedDimension, dateRange, filters]);

      // 使用 useMemo 优化数据获取，避免不必要的重新计算
      const currentData = useMemo(() => {
            return {
                  categoryData: categoryDataRef.current,
                  shopData: shopDataRef.current,
                  courierData: courierDataRef.current,
                  dateData: dateDataRef.current
            };
      }, [dataVersion]); // 只有当 dataVersion 变化时才重新计算

      // 根据维度渲染不同的数据展示组件
      const renderDataDisplay = useMemo(() => {
            if (selectedDimension === 'category') {
                  return (
                        <StatsDataDisplay
                              isLoading={isLoading}
                              selectedDimension={selectedDimension}
                              categoryData={currentData.categoryData}
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
                              {!isLoading && currentData.shopData.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <Card>
                                                <CardHeader className="pb-2">
                                                      <CardTitle className="text-sm font-medium text-muted-foreground">
                                                            {t('店铺总数')}
                                                      </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                      <div className="text-2xl font-bold">{currentData.shopData.length}</div>
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
                                                            {currentData.shopData.reduce((sum, shop) => sum + shop.total_quantity, 0).toLocaleString()}
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
                                                            {(currentData.shopData.reduce((sum, shop) => sum + (shop.daily_average || 0), 0) / currentData.shopData.length).toFixed(2)}
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
                              {!isLoading && !error && currentData.shopData.length === 0 && (
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
                                                data={currentData.shopData}
                                                groupByCategory={true}
                                                maxDataPoints={currentData.shopData.length > 50 ? 20 : currentData.shopData.length}
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
                                                data={currentData.shopData}
                                                isLoading={isLoading}
                                                error={error}
                                                onRetry={handleRetry}
                                                groupByCategory={true}
                                                enableVirtualization={currentData.shopData.length > 50}
                                                maxHeight={600}
                                          />
                                    </CardContent>
                              </Card>
                        </div>
                  );
            } else if (selectedDimension === 'courier') {
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
                              {!isLoading && currentData.courierData.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <Card>
                                                <CardHeader className="pb-2">
                                                      <CardTitle className="text-sm font-medium text-muted-foreground">
                                                            {t('快递类型总数')}
                                                      </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                      <div className="text-2xl font-bold">{currentData.courierData.length}</div>
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
                                                            {currentData.courierData.reduce((sum, courier) => sum + courier.total_quantity, 0).toLocaleString()}
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
                                                            {(currentData.courierData.reduce((sum, courier) => sum + (courier.daily_average || 0), 0) / currentData.courierData.length).toFixed(2)}
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
                              {!isLoading && !error && currentData.courierData.length === 0 && (
                                    <Card>
                                          <CardContent className="flex flex-col items-center justify-center py-8">
                                                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                                                <h3 className="text-lg font-medium mb-2">{t('暂无数据')}</h3>
                                                <p className="text-muted-foreground text-center mb-4">
                                                      {t('当前时间范围内没有找到快递类型统计数据，请尝试调整筛选条件')}
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
                                          <CourierStatsChart
                                                data={currentData.courierData}
                                                isLoading={isLoading}
                                                error={error}
                                                onRetry={handleRetry}
                                          />
                                    </CardContent>
                              </Card>

                              {/* 数据表格 */}
                              <Card>
                                    <CardHeader>
                                          <CardTitle>{t('详细数据')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                          <CourierStatsTable
                                                data={currentData.courierData}
                                                isLoading={isLoading}
                                                error={error}
                                                onRetry={handleRetry}
                                                enableVirtualization={currentData.courierData.length > 100}
                                                maxHeight={600}
                                                pageSize={20}
                                          />
                                    </CardContent>
                              </Card>
                        </div>
                  );
            } else if (selectedDimension === 'date') {
                  return (
                        <StatsDataDisplay
                              isLoading={isLoading}
                              selectedDimension={selectedDimension}
                              categoryData={currentData.categoryData}
                              dateData={currentData.dateData}
                              groupBy={groupBy}
                              onDateClick={(date) => {
                                    console.log('点击日期:', date);
                                    // 查找对应的日期数据
                                    const dateItem = currentData.dateData.find(item => item.date === date);
                                    if (dateItem) {
                                          setSelectedDateData(dateItem);
                                          setIsDateDetailModalOpen(true);
                                    }
                              }}
                        />
                  );
            } else {
                  // 其他维度，使用默认的数据展示
                  return (
                        <StatsDataDisplay
                              isLoading={isLoading}
                              selectedDimension={selectedDimension}
                              categoryData={currentData.categoryData}
                        />
                  );
            }
      }, [selectedDimension, isLoading, currentData, groupBy, error, handleRetry, handleRefresh, t]);

      return (
            <div className="space-y-6">
                  {/* 内存警告 */}
                  {memoryWarning && (
                        <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="flex items-center justify-between">
                                    <span>{memoryWarning}</span>
                                    <div className="flex gap-2">
                                          <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                      statsCache.clear();
                                                      clearStatsCache();
                                                      setMemoryWarning(null);
                                                }}
                                          >
                                                清理缓存
                                          </Button>
                                          <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.location.reload()}
                                          >
                                                刷新页面
                                          </Button>
                                    </div>
                              </AlertDescription>
                        </Alert>
                  )}

                  <StatsControlPanel
                        selectedDimension={selectedDimension}
                        onDimensionChange={handleDimensionChange}
                        dateRange={dateRange}
                        onDateRangeChange={handleDateRangeChange}
                        monthRange={monthRange}
                        onMonthRangeChange={handleMonthRangeChange}
                        yearRange={yearRange}
                        onYearRangeChange={handleYearRangeChange}
                        onRefresh={handleRefresh}
                        groupBy={groupBy}
                        onGroupByChange={(newGroupBy) => {
                              console.log('GroupBy 变化:', newGroupBy);
                              setGroupBy(newGroupBy);
                              setError(null);
                              // 清除所有缓存，因为groupBy参数会影响缓存键
                              statsCache.clear();
                              clearStatsCache();
                              // 注意：不需要手动调用fetchData，因为groupBy变化会触发fetchData重新创建和执行
                        }}
                        // 导出相关的筛选参数
                        shopId={filters.shop_ids && filters.shop_ids.length > 0 ? parseInt(filters.shop_ids[0]) : undefined}
                        categoryId={filters.category_ids && filters.category_ids.length > 0 ? parseInt(filters.category_ids[0]) : undefined}
                        courierId={filters.courier_ids && filters.courier_ids.length > 0 ? parseInt(filters.courier_ids[0]) : undefined}
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

                  {/* 缓存监控组件 */}
                  <CacheMonitor
                        isVisible={showCacheMonitor && isDevelopment}
                        onToggle={() => setShowCacheMonitor(!showCacheMonitor)}
                  />

                  {/* 日期详情模态框 */}
                  <DateDetailModal
                        isOpen={isDateDetailModalOpen}
                        onClose={() => setIsDateDetailModalOpen(false)}
                        date={selectedDateData?.date || ''}
                        groupBy={groupBy}
                        data={selectedDateData}
                  />
            </div>
      );
};

export default ShopOutputStats; 