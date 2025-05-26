"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
      LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { dashboardApi, ShopOutputTrendData, TrendSeries, ShopOutputTrendParams } from "@/services/dashboard-api";
import { format, subDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

// 图表颜色 - 使用更多鲜明的颜色区分
const COLORS = [
      '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#EC7063', '#5DADE2', '#45B39D',
      '#3498DB', '#2ECC71', '#F1C40F', '#E74C3C', '#9B59B6', '#1ABC9C', '#34495E', '#D35400'
];

// 组件属性定义
interface ShopOutputTrendCardProps {
      className?: string;
      style?: React.CSSProperties;
      maxDisplaySeries?: number; // 最多显示的数据系列数量
}

// 维度定义类型
type DimensionType = 'category' | 'shop' | 'courier' | 'date';

export function ShopOutputTrendCard({ className, style, maxDisplaySeries = 5 }: ShopOutputTrendCardProps) {
      const { t } = useTranslation();
      const { toast } = useToast();

      // 状态管理
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [trendData, setTrendData] = useState<ShopOutputTrendData | null>(null);
      const [dimension, setDimension] = useState<DimensionType>('date');
      const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>("all");
      const [selectedShopId, setSelectedShopId] = useState<string | undefined>("all");
      const [selectedCourierId, setSelectedCourierId] = useState<string | undefined>("all");
      const [selectedSeries, setSelectedSeries] = useState<number[]>([]); // 用户选择显示的特定系列ID
      const [availableCategories, setAvailableCategories] = useState<{ id: number, name: string }[]>([]);
      const [availableShops, setAvailableShops] = useState<{ id: number, name: string, category_id?: number, category_name?: string }[]>([]);
      const [availableCouriers, setAvailableCouriers] = useState<{ id: number, name: string }[]>([]);
      const [nextRefreshTime, setNextRefreshTime] = useState<Date>(new Date(Date.now() + 5 * 60 * 1000));
      const [refreshCountdown, setRefreshCountdown] = useState<number>(5 * 60);
      const [lastUpdateTime, setLastUpdateTime] = useState<string>("");

      // 使用ref存储函数，避免依赖循环
      const fetchTrendDataRef = useRef<any>(null);
      const ensureAllCategoriesLoadedRef = useRef<any>(null);

      // 清除仪表盘缓存
      const clearDashboardCache = useCallback(async () => {
            try {
                  await dashboardApi.clearCache();
                  toast({
                        title: t("缓存已清除"),
                        description: t("数据缓存已清除，正在获取最新数据"),
                        duration: 3000,
                  });

                  return true;
            } catch (error) {
                  console.error("[ShopOutputTrendCard] Failed to clear cache:", error);
                  toast({
                        title: t("清除缓存失败"),
                        description: error instanceof Error ? error.message : t("未知错误"),
                        variant: "destructive",
                        duration: 3000,
                  });
                  return false;
            }
      }, [t, toast]);

      // 获取出力趋势数据
      const fetchTrendData = useCallback(async (clearCache: boolean = false) => {
            setIsLoading(true);
            setError(null);

            try {
                  // 如果需要清除缓存，先调用清除缓存API
                  if (clearCache) {
                        await clearDashboardCache();
                  }

                  // 准备请求参数
                  const params: any = {
                        dimension,
                        days: 7 // 默认显示7天数据
                  };

                  // 根据当前维度添加筛选条件 - 排除"all"值
                  if (dimension === 'shop') {
                        if (selectedCategoryId && selectedCategoryId !== "all") {
                              params.category_id = selectedCategoryId;
                        }
                  } else if (dimension === 'courier') {
                        if (selectedCategoryId && selectedCategoryId !== "all") {
                              params.category_id = selectedCategoryId;
                        }
                        if (selectedShopId && selectedShopId !== "all") {
                              params.shop_id = selectedShopId;
                        }
                        if (selectedCourierId && selectedCourierId !== "all") {
                              params.courier_id = selectedCourierId;
                        }
                  }

                  // 调用API获取趋势数据
                  const data = await dashboardApi.getShopOutputTrend(params);

                  // 有些数据可能是空对象而不是空数组，处理一下
                  if (data && (!data.series || data.series.length === 0)) {
                        setError("暂无数据");
                        setTrendData({
                              dates: data.dates || [],
                              series: [],
                              total_by_date: data.total_by_date || {}
                        });
                        return;
                  }

                  // 更新状态
                  setTrendData(data);

                  // 保存当前所有已有的类别数据
                  const currentCategories = availableCategories.length > 0 ? new Map(availableCategories.map(cat => [cat.id, cat.name])) : new Map();

                  // 直接在此处更新可用选项，而不是调用外部函数
                  // 这样可以避免循环依赖问题
                  const processOptionsWithCurrentData = (data: ShopOutputTrendData, currentCategories: Map<number, string>) => {
                        if (!data || !data.series || data.series.length === 0) return;

                        // 创建映射以存储唯一标识符
                        const categories = new Map<number, string>(currentCategories);
                        const shops = new Map<number, { name: string, category_id?: number, category_name?: string }>();
                        const couriers = new Map<number, string>();

                        // 第一阶段：收集所有类别信息，不管当前维度是什么
                        data.series.forEach(series => {
                              // 如果系列具有类别信息，收集这些信息
                              if (series.category_id && series.category_name) {
                                    categories.set(series.category_id, series.category_name);
                              }

                              // 如果当前维度是类别，则每个系列本身就代表一个类别
                              if (dimension === 'category') {
                                    categories.set(series.id, series.name);
                              }
                        });

                        // 第二阶段：根据维度收集店铺和快递类型数据
                        if (dimension === 'shop') {
                              // 对于店铺维度，每个系列代表一个店铺
                              data.series.forEach(series => {
                                    shops.set(series.id, {
                                          name: series.name,
                                          category_id: series.category_id,
                                          category_name: series.category_name
                                    });
                              });
                        } else if (dimension === 'courier') {
                              // 对于快递类型维度，每个系列代表一个快递类型
                              data.series.forEach(series => {
                                    couriers.set(series.id, series.name);
                              });
                        }

                        // 将映射转换为数组并更新状态
                        setAvailableCategories(Array.from(categories.entries()).map(([id, name]) => ({ id, name })));
                        setAvailableShops(Array.from(shops.entries()).map(([id, value]) => ({
                              id, name: value.name, category_id: value.category_id, category_name: value.category_name
                        })));
                        setAvailableCouriers(Array.from(couriers.entries()).map(([id, name]) => ({ id, name })));
                  };

                  // 处理选项数据
                  processOptionsWithCurrentData(data, currentCategories);

                  // 设置最后更新时间
                  setLastUpdateTime(format(new Date(), 'yyyy-MM-dd HH:mm:ss'));

                  // 重置刷新计时器
                  setNextRefreshTime(new Date(Date.now() + 5 * 60 * 1000));
                  setRefreshCountdown(5 * 60);
            } catch (error) {
                  console.error("[ShopOutputTrendCard] Failed to fetch trend data:", error);
                  setError(error instanceof Error ? error.message : t("获取趋势数据失败"));
                  toast({
                        title: t("获取趋势数据失败"),
                        description: error instanceof Error ? error.message : t("未知错误"),
                        variant: "destructive",
                        duration: 3000,
                  });
            } finally {
                  setIsLoading(false);
            }
      }, [dimension, selectedCategoryId, selectedShopId, selectedCourierId, availableCategories, clearDashboardCache, t, toast]);

      // 更新fetchTrendDataRef
      useEffect(() => {
            fetchTrendDataRef.current = fetchTrendData;
      }, [fetchTrendData]);

      // 更新可用的筛选选项
      const updateAvailableOptions = useCallback((data: ShopOutputTrendData, currentCategories?: Map<number, string>) => {
            if (!data || !data.series || data.series.length === 0) return;

            // 创建映射以存储唯一标识符
            const categories = new Map<number, string>(currentCategories || []);
            const shops = new Map<number, { name: string, category_id?: number, category_name?: string }>();
            const couriers = new Map<number, string>();

            // 第一阶段：收集所有类别信息，不管当前维度是什么
            data.series.forEach(series => {
                  // 如果系列具有类别信息，收集这些信息
                  if (series.category_id && series.category_name) {
                        categories.set(series.category_id, series.category_name);
                  }

                  // 如果当前维度是类别，则每个系列本身就代表一个类别
                  if (dimension === 'category') {
                        categories.set(series.id, series.name);
                  }
            });

            // 第二阶段：根据维度收集店铺和快递类型数据
            if (dimension === 'shop') {
                  // 对于店铺维度，每个系列代表一个店铺
                  data.series.forEach(series => {
                        shops.set(series.id, {
                              name: series.name,
                              category_id: series.category_id,
                              category_name: series.category_name
                        });
                  });
            } else if (dimension === 'courier') {
                  // 对于快递类型维度，每个系列代表一个快递类型
                  data.series.forEach(series => {
                        couriers.set(series.id, series.name);
                  });
            }

            // 将映射转换为数组并更新状态
            setAvailableCategories(Array.from(categories.entries()).map(([id, name]) => ({ id, name })));
            setAvailableShops(Array.from(shops.entries()).map(([id, value]) => ({
                  id, name: value.name, category_id: value.category_id, category_name: value.category_name
            })));
            setAvailableCouriers(Array.from(couriers.entries()).map(([id, name]) => ({ id, name })));
      }, [dimension]);

      // 格式化倒计时显示
      const formatCountdown = (seconds: number) => {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
      };

      // 处理维度切换
      const handleDimensionChange = (value: string) => {
            if (value as DimensionType) {
                  // 保存当前的类别信息，在维度切换后仍然可以使用
                  const currentCategories = new Map(availableCategories.map(cat => [cat.id, cat.name]));

                  // 更新维度
                  setDimension(value as DimensionType);

                  // 切换维度时重置筛选条件
                  setSelectedShopId("all");
                  setSelectedCourierId("all");

                  // 重置系列选择
                  setSelectedSeries([]);

                  // 保留类别选择，除非当前未选择特定类别
                  if (selectedCategoryId === "all") {
                        // 如果当前是"全部类别"，保持这个选择
                        setSelectedCategoryId("all");
                  }
                  // 否则，不更改类别选择，让用户继续使用当前选择的类别
            }
      };

      // 预先加载所有类别数据（如果需要）
      const ensureAllCategoriesLoaded = useCallback(async () => {
            // 如果已经有足够的类别数据，不需要再次加载
            if (availableCategories.length > 1) {
                  return;
            }

            try {
                  // 不带任何筛选条件调用API
                  const params: ShopOutputTrendParams = {
                        dimension: 'category' as 'category',  // 显式指定类型
                        days: 7
                  };

                  const data = await dashboardApi.getShopOutputTrend(params);

                  if (data && data.series && data.series.length > 0) {
                        // 从数据中提取所有类别信息
                        const allCategories = new Map<number, string>();
                        data.series.forEach(series => {
                              allCategories.set(series.id, series.name);
                        });

                        // 更新类别列表
                        setAvailableCategories(Array.from(allCategories.entries()).map(([id, name]) => ({ id, name })));
                  }
            } catch (error) {
                  console.error("加载所有类别数据失败:", error);
                  // 继续使用现有数据，不需要中断用户操作
            }
      }, [availableCategories.length]);

      // 更新ensureAllCategoriesLoadedRef
      useEffect(() => {
            ensureAllCategoriesLoadedRef.current = ensureAllCategoriesLoaded;
      }, [ensureAllCategoriesLoaded]);

      // 处理类别选择变化
      const handleCategoryChange = (value: string) => {
            // 如果切换到"全部类别"，确保我们有所有类别的数据
            if (value === "all" && selectedCategoryId !== "all") {
                  // 先设置选择值
                  setSelectedCategoryId(value);

                  // 确保保留当前已知的所有类别
                  const currentCategories = new Map(availableCategories.map(cat => [cat.id, cat.name]));

                  // 预加载所有类别数据
                  if (ensureAllCategoriesLoadedRef.current) {
                        ensureAllCategoriesLoadedRef.current();
                  }
            } else {
                  // 正常设置选择的类别
                  setSelectedCategoryId(value);
            }

            // 重置店铺和快递类型选择
            setSelectedShopId("all");
            setSelectedCourierId("all");

            // 重置系列选择
            setSelectedSeries([]);
      };

      // 处理店铺选择变化
      const handleShopChange = (value: string) => {
            setSelectedShopId(value);
      };

      // 处理快递类型选择变化
      const handleCourierChange = (value: string) => {
            setSelectedCourierId(value);
      };

      // 处理系列选择变化
      const handleSeriesSelection = (seriesId: number) => {
            setSelectedSeries(prev => {
                  // 如果已经选中，则取消选择
                  if (prev.includes(seriesId)) {
                        return prev.filter(id => id !== seriesId);
                  }
                  // 否则添加到选择列表
                  return [...prev, seriesId];
            });
      };

      // 重置系列选择
      const resetSeriesSelection = () => {
            setSelectedSeries([]);
      };

      // 获取图表数据
      const getChartData = useCallback(() => {
            if (!trendData || !trendData.dates || trendData.dates.length === 0) {
                  return [];
            }

            if (!trendData.series || trendData.series.length === 0) {
                  return [];
            }

            // 根据维度和筛选条件过滤数据系列
            let filteredSeries = [...trendData.series];

            // 如果是按店铺维度且有选择类别
            if (dimension === 'shop' && selectedCategoryId && selectedCategoryId !== "all") {
                  filteredSeries = filteredSeries.filter(series =>
                        series.category_id === Number(selectedCategoryId)
                  );
            }

            // 如果是按快递类型且有选择特定店铺
            if (dimension === 'courier' && selectedShopId && selectedShopId !== "all") {
                  // 这里需要服务端支持，前端可能无法按店铺筛选快递类型数据
                  // 这是一个假设的逻辑，实际实现可能需要调整
            }

            // 如果用户选择了特定系列，则只显示这些系列
            if (selectedSeries.length > 0) {
                  filteredSeries = filteredSeries.filter(series =>
                        selectedSeries.includes(series.id)
                  );
            }
            // 否则自动限制数量，避免显示过多
            else if (filteredSeries.length > maxDisplaySeries) {
                  // 排序找出数据总值最大的几个系列
                  filteredSeries.sort((a, b) => {
                        const aTotal = Object.values(a.data).reduce((sum, val) => sum + val, 0);
                        const bTotal = Object.values(b.data).reduce((sum, val) => sum + val, 0);
                        return bTotal - aTotal; // 降序排列
                  });

                  // 取前N个系列
                  filteredSeries = filteredSeries.slice(0, maxDisplaySeries);
            }

            // 生成图表数据
            const chartData = trendData.dates.map(date => {
                  const dataPoint: any = { date };

                  // 添加每个系列在该日期的数据点
                  filteredSeries.forEach(series => {
                        // 设置数据值，如果没有数据则为0
                        dataPoint[series.name] = series.data[date] || 0;
                  });

                  // 添加总计
                  dataPoint['总计'] = trendData.total_by_date[date] || 0;

                  return dataPoint;
            });

            return chartData;
      }, [trendData, dimension, selectedCategoryId, selectedShopId, selectedSeries, maxDisplaySeries]);

      // 自定义图表提示
      const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                  return (
                        <div className="bg-background border rounded-md p-2 shadow-md">
                              <p className="font-semibold">{label}</p>
                              {payload.map((entry: any, index: number) => (
                                    <p key={`item-${index}`} style={{ color: entry.color }}>
                                          {`${entry.name}: ${entry.value}`}
                                    </p>
                              ))}
                        </div>
                  );
            }
            return null;
      };

      // 获取要显示的折线系列
      const getLineChartSeries = useCallback(() => {
            if (!trendData || !trendData.series || trendData.series.length === 0) {
                  return null;
            }

            // 过滤要显示的系列
            let filteredSeries = [...trendData.series];

            if (dimension === 'shop' && selectedCategoryId && selectedCategoryId !== "all") {
                  filteredSeries = filteredSeries.filter(series =>
                        series.category_id === Number(selectedCategoryId)
                  );
            }

            // 如果用户选择了特定系列，则只显示这些系列
            if (selectedSeries.length > 0) {
                  filteredSeries = filteredSeries.filter(series =>
                        selectedSeries.includes(series.id)
                  );
            }
            // 否则自动限制数量，避免显示过多
            else if (filteredSeries.length > maxDisplaySeries) {
                  // 找出数据值最大的几个系列
                  filteredSeries.sort((a, b) => {
                        const aTotal = Object.values(a.data).reduce((sum, val) => sum + val, 0);
                        const bTotal = Object.values(b.data).reduce((sum, val) => sum + val, 0);
                        return bTotal - aTotal; // 降序排列
                  });

                  // 取前N个系列
                  filteredSeries = filteredSeries.slice(0, maxDisplaySeries);
            }

            const lineComponents = filteredSeries.map((series, index) => (
                  <Line
                        key={`series-${series.id}`}
                        type="monotone"
                        dataKey={series.name}
                        stroke={COLORS[index % COLORS.length]}
                        activeDot={{ r: 6 }}
                        strokeWidth={2}
                        connectNulls={true}
                        // 确保显示0值点
                        dot={(props: any) => {
                              // 非空值显示点
                              const value = props.payload[props.dataKey];
                              if (value !== undefined && value !== null) {
                                    return (
                                          <circle
                                                cx={props.cx}
                                                cy={props.cy}
                                                r={4}
                                                fill={props.stroke}
                                          />
                                    );
                              }
                              return null; // 空值不显示点
                        }}
                  />
            ));

            // 添加总计线
            lineComponents.push(
                  <Line
                        key="total-line"
                        type="monotone"
                        dataKey="总计"
                        stroke="#8884d8"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        connectNulls={true}
                  />
            );

            return lineComponents;
      }, [trendData, dimension, selectedCategoryId, selectedSeries, maxDisplaySeries]);

      // 简单的延迟函数
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // 初始化和刷新倒计时
      useEffect(() => {
            // 使用ref中存储的函数，避免依赖问题
            const loadInitialData = async () => {
                  try {
                        // 首先获取所有类别数据
                        if (ensureAllCategoriesLoadedRef.current) {
                              await ensureAllCategoriesLoadedRef.current();
                              // 给界面一点时间更新
                              await delay(50);
                        }

                        // 然后获取当前选择的数据
                        if (fetchTrendDataRef.current) {
                              fetchTrendDataRef.current();
                        }
                  } catch (error) {
                        console.error("初始数据加载失败:", error);
                        // 即使发生错误，也尝试加载趋势数据
                        if (fetchTrendDataRef.current) {
                              fetchTrendDataRef.current();
                        }
                  }
            };

            // 执行初始加载
            loadInitialData();

            // 自动刷新倒计时
            const countdownInterval = setInterval(() => {
                  setRefreshCountdown(prev => {
                        if (prev <= 1) {
                              // 倒计时结束，刷新数据
                              if (fetchTrendDataRef.current) {
                                    fetchTrendDataRef.current();
                              }
                              return 5 * 60; // 重置为5分钟
                        }
                        return prev - 1;
                  });
            }, 1000);

            return () => {
                  clearInterval(countdownInterval);
            };
      }, []); // 只在组件挂载时执行一次

      // 当维度变化时重新获取数据
      useEffect(() => {
            if (fetchTrendDataRef.current) {
                  fetchTrendDataRef.current();
            }
      }, [dimension]);

      // 当筛选条件变化时重新获取数据
      useEffect(() => {
            // 检查组件是否已挂载并且有选择变化
            if (dimension === 'shop') {
                  // 对于店铺维度，任何类别变化都需要重新获取数据，包括切换回"全部类别"
                  if (fetchTrendDataRef.current) {
                        fetchTrendDataRef.current();
                  }
            } else if (dimension === 'courier') {
                  // 对于快递维度，任何类别或店铺变化都需要重新获取数据
                  if (fetchTrendDataRef.current) {
                        fetchTrendDataRef.current();
                  }
            }
      }, [selectedCategoryId, selectedShopId, dimension]);

      // 渲染Card内容
      return (
            <Card className={cn("col-span-full", className)} style={style}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center space-x-2">
                              <TrendingUp className="h-5 w-5 text-muted-foreground" />
                              <CardTitle>{t("出力趋势图")}</CardTitle>
                              {lastUpdateTime && (
                                    <span className="text-xs text-muted-foreground">
                                          {t("上次更新")}: {lastUpdateTime}
                                    </span>
                              )}
                        </div>
                        <div className="flex items-center space-x-4">
                              <span className="text-xs text-muted-foreground">
                                    {t("自动刷新")}: {formatCountdown(refreshCountdown)}
                              </span>
                              <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchTrendDataRef.current && fetchTrendDataRef.current(true)}
                                    disabled={isLoading}
                              >
                                    <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
                                    {t("刷新")}
                              </Button>
                        </div>
                  </CardHeader>

                  <CardContent>
                        {/* 维度切换和筛选器 */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                    <div>
                                          <span className="text-sm font-medium mr-2">{t("统计维度")}:</span>
                                          <ToggleGroup type="single" value={dimension} onValueChange={handleDimensionChange}>
                                                <ToggleGroupItem value="date">{t("按日期")}</ToggleGroupItem>
                                                <ToggleGroupItem value="category">{t("按店铺类别")}</ToggleGroupItem>
                                                <ToggleGroupItem value="shop">{t("按店铺")}</ToggleGroupItem>
                                                <ToggleGroupItem value="courier">{t("按快递类型")}</ToggleGroupItem>
                                          </ToggleGroup>
                                    </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                    {/* 类别筛选 - 当维度为"按店铺"或"按快递类型"时显示 */}
                                    {(dimension === 'shop' || dimension === 'courier') && availableCategories.length > 0 && (
                                          <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
                                                <SelectTrigger className="w-[180px]">
                                                      <SelectValue placeholder={t("选择类别")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                      <SelectItem value="all">{t("全部类别")}</SelectItem>
                                                      {availableCategories.map(category => (
                                                            <SelectItem key={category.id} value={String(category.id)}>
                                                                  {category.name}
                                                            </SelectItem>
                                                      ))}
                                                </SelectContent>
                                          </Select>
                                    )}

                                    {/* 店铺筛选 - 当维度为"按快递类型"时显示 */}
                                    {dimension === 'courier' && availableShops.length > 0 && (
                                          <Select value={selectedShopId} onValueChange={handleShopChange}>
                                                <SelectTrigger className="w-[180px]">
                                                      <SelectValue placeholder={t("选择店铺")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                      <SelectItem value="all">{t("全部店铺")}</SelectItem>
                                                      {/* 始终显示所有店铺，如果有类别筛选则应用筛选 */}
                                                      {availableShops
                                                            .filter(shop => selectedCategoryId === "all" || !selectedCategoryId || shop.category_id === Number(selectedCategoryId))
                                                            .map(shop => (
                                                                  <SelectItem key={shop.id} value={String(shop.id)}>
                                                                        {shop.name}
                                                                  </SelectItem>
                                                            ))}
                                                </SelectContent>
                                          </Select>
                                    )}

                                    {/* 系列选择器 - 自定义显示哪些数据系列 */}
                                    {trendData && trendData.series && trendData.series.length > maxDisplaySeries && (
                                          <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                      <Button variant="outline" size="sm" className="flex gap-1 items-center">
                                                            <BarChart2 className="h-4 w-4" />
                                                            {selectedSeries.length > 0
                                                                  ? t("已选择 {count} 个系列", { count: selectedSeries.length })
                                                                  : t("自定义系列显示")}
                                                      </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-56" align="end">
                                                      {/* 重置选择按钮 */}
                                                      {selectedSeries.length > 0 && (
                                                            <Button
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  className="w-full justify-start font-normal mb-1"
                                                                  onClick={resetSeriesSelection}
                                                            >
                                                                  {t("重置选择")}
                                                            </Button>
                                                      )}

                                                      {/* 序列选择列表 */}
                                                      {trendData.series
                                                            .filter(series => {
                                                                  // 按当前筛选条件过滤显示的选项
                                                                  if (dimension === 'shop' && selectedCategoryId && selectedCategoryId !== "all") {
                                                                        return series.category_id === Number(selectedCategoryId);
                                                                  }
                                                                  return true;
                                                            })
                                                            .map(series => (
                                                                  <DropdownMenuCheckboxItem
                                                                        key={series.id}
                                                                        checked={selectedSeries.includes(series.id)}
                                                                        onSelect={(e) => {
                                                                              e.preventDefault();
                                                                              handleSeriesSelection(series.id);
                                                                        }}
                                                                  >
                                                                        {series.name}
                                                                  </DropdownMenuCheckboxItem>
                                                            ))}
                                                </DropdownMenuContent>
                                          </DropdownMenu>
                                    )}
                              </div>
                        </div>

                        {/* 图表区域 */}
                        <div className="w-full h-[350px]">
                              {isLoading ? (
                                    <div className="h-full w-full flex items-center justify-center">
                                          <LoadingSpinner text={t("数据加载中...")} />
                                    </div>
                              ) : error ? (
                                    <div className="h-full w-full flex items-center justify-center">
                                          <p className="text-destructive">{error}</p>
                                    </div>
                              ) : !trendData ? (
                                    <div className="h-full w-full flex items-center justify-center">
                                          <p className="text-muted-foreground">{t("暂无数据")}</p>
                                    </div>
                              ) : trendData.series.length === 0 ? (
                                    <div className="h-full w-full flex flex-col items-center justify-center">
                                          <p className="text-muted-foreground mb-2">{t("该条件下暂无数据")}</p>
                                          <div className="text-xs text-muted-foreground max-w-md">
                                                <details>
                                                      <summary className="cursor-pointer">{t("显示诊断信息")}</summary>
                                                      <pre className="mt-2 p-2 bg-secondary rounded text-[10px] overflow-auto max-h-40">
                                                            {JSON.stringify({
                                                                  dimension,
                                                                  selectedCategoryId,
                                                                  selectedShopId,
                                                                  datesCount: trendData.dates?.length || 0,
                                                                  totalByDate: Object.keys(trendData.total_by_date || {}).length,
                                                            }, null, 2)}
                                                      </pre>
                                                </details>
                                          </div>
                                    </div>
                              ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                          <LineChart
                                                data={getChartData()}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                          >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                      dataKey="date"
                                                      padding={{ left: 10, right: 10 }}
                                                      tick={{ fontSize: 12 }}
                                                />
                                                <YAxis
                                                      tickCount={5}
                                                      tick={{ fontSize: 12 }}
                                                      width={40}
                                                      // 确保Y轴从0开始
                                                      domain={[0, 'auto']}
                                                      allowDecimals={false}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend
                                                      verticalAlign="bottom"
                                                      height={36}
                                                      iconSize={10}
                                                      iconType="circle"
                                                      wrapperStyle={{ fontSize: 12 }}
                                                />
                                                {getLineChartSeries()}
                                          </LineChart>
                                    </ResponsiveContainer>
                              )}
                        </div>
                  </CardContent>
            </Card>
      );
} 