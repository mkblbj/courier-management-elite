"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Store, RefreshCw, PieChart as PieChartIcon, BarChart2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/loading-spinner";
import { API_BASE_URL, API_SUCCESS_CODE } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { dashboardApi } from "@/services/dashboard-api";

// 定义饼图的颜色
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#EC7063', '#5DADE2', '#45B39D'];

// 定义接口
interface ShopOutputData {
      categoryId?: string | number;
      categoryName?: string;
      shopId: string | number;
      shopName: string;
      output: number;
      percent: number;
      couriers?: CourierOutput[];
}

interface CourierOutput {
      courierId: string | number;
      courierName: string;
      quantity: number;
}

interface CategoryData {
      id: string | number;
      name: string;
      total: number;
      percent: number;
}

interface ShopOutputCardProps {
      title: string;
      icon?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
}

// API 响应接口
interface ApiResponse {
      code: number;
      message: string;
      data: {
            date: string;
            total_quantity: number;
            shops_count: number;
            active_shops_count: number;
            coverage_rate: number;
            categories_data: Array<{
                  category_id: number;
                  category_name: string;
                  total_quantity: number;
                  shops: Array<{
                        shop_id: number;
                        shop_name: string;
                        has_data: boolean;
                        total_quantity: number;
                  }>;
            }>;
            shops_data: Array<{
                  shop_id: number;
                  shop_name: string;
                  category_id: number;
                  category_name: string;
                  has_data: boolean;
                  total_quantity: number;
                  couriers?: Array<{
                        courier_id: number;
                        courier_name: string;
                        quantity: number;
                  }>;
            }>;
            couriers_data: Array<{
                  courier_id: number;
                  courier_name: string;
                  total_quantity: number;
                  shops_count: number;
            }>;
            shop_courier_data?: Array<{
                  shop_id: number;
                  shop_name: string;
                  category_id: number;
                  category_name: string;
                  total_quantity: number;
                  couriers: Array<{
                        courier_id: number;
                        courier_name: string;
                        quantity: number;
                  }>;
            }>;
      };
}

export function ShopOutputCard({ title, icon = <Store className="h-5 w-5" />, className, style }: ShopOutputCardProps) {
      const { t } = useTranslation();
      const { toast } = useToast();
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [shopOutputData, setShopOutputData] = useState<ShopOutputData[]>([]);
      const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
      const [allCategoryData, setAllCategoryData] = useState<CategoryData[]>([]);
      const [totalOutput, setTotalOutput] = useState(0);
      const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
      const [nextRefreshTime, setNextRefreshTime] = useState<Date>(new Date(Date.now() + 5 * 60 * 1000)); // 5分钟后刷新
      const [refreshCountdown, setRefreshCountdown] = useState<number>(5 * 60); // 倒计时秒数
      const [chartType, setChartType] = useState<"pie" | "bar">("bar");
      const [lastUpdateTime, setLastUpdateTime] = useState<string>(""); // 新增：最后更新时间

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
                  console.error("[ShopOutputCard] Failed to clear cache:", error);
                  toast({
                        title: t("清除缓存失败"),
                        description: error instanceof Error ? error.message : t("未知错误"),
                        variant: "destructive",
                        duration: 3000,
                  });
                  return false;
            }
      }, [t, toast]);

      // 获取今日出力数据
      const fetchShopOutputData = useCallback(async (categoryId?: string | number, clearCache: boolean = false) => {
            setIsLoading(true);
            setError(null);

            try {
                  // 如果需要清除缓存，先调用清除缓存API
                  if (clearCache) {
                        await clearDashboardCache();
                  }

                  // 开发环境下，如果API未准备好，使用模拟数据
                  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
                        console.debug("[ShopOutputCard] Using mock data in development mode");
                        await simulateMockData(categoryId);
                        return;
                  }

                  // 调用dashboardApi
                  const params = categoryId ? { category_id: categoryId } : undefined;
                  const data = await dashboardApi.getTodayShopOutputs(params);

                  // 设置最后更新时间
                  setLastUpdateTime(t("数据已更新"));

                  // 筛选出有效的店铺数据（只保留total_quantity > 0的店铺）
                  const validShopsData = data.shops_data.filter(shop => shop.total_quantity > 0);

                  // 从API响应中提取数据 - 基于有效数据计算总量
                  const total = validShopsData.reduce((sum, shop) => sum + shop.total_quantity, 0);

                  // 转换店铺数据到组件格式 - 只处理有效数据
                  const shopData: ShopOutputData[] = validShopsData.map(shop => {
                        // 筛选有效的快递数据（只保留quantity > 0的快递）
                        const validCouriers = shop.couriers ?
                              shop.couriers.filter(courier => courier.quantity > 0) : [];

                        return {
                              categoryId: shop.category_id,
                              categoryName: shop.category_name,
                              shopId: shop.shop_id,
                              shopName: shop.shop_name,
                              output: shop.total_quantity,
                              percent: total > 0 ? parseFloat(((shop.total_quantity / total) * 100).toFixed(2)) : 0,
                              couriers: validCouriers.map(courier => ({
                                    courierId: courier.courier_id,
                                    courierName: courier.courier_name,
                                    quantity: courier.quantity
                              }))
                        };
                  });

                  // 重新计算类别数据 - 基于筛选后的店铺数据
                  const categoriesMap = new Map<string | number, CategoryData>();

                  // 先遍历所有有效店铺，按类别累计数量
                  shopData.forEach(shop => {
                        if (!shop.categoryId) return;

                        const catId = shop.categoryId;
                        const catName = shop.categoryName || "";

                        if (!categoriesMap.has(catId)) {
                              categoriesMap.set(catId, {
                                    id: catId,
                                    name: catName,
                                    total: 0,
                                    percent: 0
                              });
                        }

                        const category = categoriesMap.get(catId)!;
                        category.total += shop.output;
                  });

                  // 计算每个类别的百分比
                  const catData: CategoryData[] = Array.from(categoriesMap.values()).map(category => ({
                        ...category,
                        percent: total > 0 ? parseFloat(((category.total / total) * 100).toFixed(2)) : 0
                  }));

                  setShopOutputData(shopData);
                  setCategoryData(catData);

                  // 只有在显示所有类别的时候才更新所有类别数据
                  if (!categoryId) {
                        setAllCategoryData(catData);
                  }

                  setTotalOutput(total);
                  setNextRefreshTime(new Date(Date.now() + 5 * 60 * 1000)); // 5分钟后刷新
                  setRefreshCountdown(5 * 60); // 重置倒计时
            } catch (error) {
                  console.error("[ShopOutputCard] 获取店铺出力数据失败:", error);
                  setError(error instanceof Error ? error.message : "未知错误");
            } finally {
                  setIsLoading(false);
            }
      }, [clearDashboardCache, t]);

      // 模拟数据加载（开发环境使用）
      const simulateMockData = async (categoryId?: string | number) => {
            // 模拟API调用延迟
            await new Promise(resolve => setTimeout(resolve, 600));

            // 模拟数据
            const mockCategories = [
                  { id: 1, name: "淘宝" },
                  { id: 2, name: "京东" },
                  { id: 3, name: "拼多多" }
            ];

            const mockShops = [
                  { id: 1, name: "淘宝店1", categoryId: 1 },
                  { id: 2, name: "淘宝店2", categoryId: 1 },
                  { id: 3, name: "京东店", categoryId: 2 },
                  { id: 4, name: "拼多多店", categoryId: 3 }
            ];

            const mockCouriers = [
                  { id: 1, name: "顺丰速运" },
                  { id: 2, name: "京东快递" },
                  { id: 3, name: "圆通速递" }
            ];

            // 根据选择的类别过滤商店
            const filteredShops = categoryId
                  ? mockShops.filter(shop => shop.categoryId.toString() === categoryId.toString())
                  : mockShops;

            // 生成随机出力数据 - 确保至少有一些店铺的出力为0，用于测试筛选
            const shopOutputs = filteredShops.map(() => {
                  // 随机生成一个0到5的整数，0表示无数据
                  const hasData = Math.random() > 0.2; // 80%概率有数据
                  return hasData ? Math.floor(Math.random() * 100) + 20 : 0;
            });

            // 只计算有效店铺的总量（出力>0）
            const total = shopOutputs.reduce((sum, output) => sum + (output > 0 ? output : 0), 0);

            // 店铺数据 - 只保留出力>0的店铺
            const shopData: ShopOutputData[] = filteredShops
                  .map<ShopOutputData | null>((shop, index) => {
                        const output = shopOutputs[index];

                        // 如果出力为0，这个店铺没有有效数据，跳过
                        if (output <= 0) return null;

                        // 为每个店铺分配1-3个快递类型，确保部分快递出力为0，用于测试筛选
                        const courierCount = Math.floor(Math.random() * 3) + 1;
                        const shuffledCouriers = [...mockCouriers].sort(() => 0.5 - Math.random());
                        const selectedCouriers = shuffledCouriers.slice(0, courierCount);

                        // 生成快递出力，确保有些快递出力为0
                        const courierOutputs = selectedCouriers.map(() => {
                              const hasData = Math.random() > 0.3; // 70%概率有数据
                              return hasData ? Math.floor(output / courierCount) : 0;
                        });

                        // 只保留出力>0的快递
                        const validCouriers = selectedCouriers
                              .map((courier, idx) => ({
                                    courierId: courier.id,
                                    courierName: courier.name,
                                    quantity: courierOutputs[idx]
                              }))
                              .filter(courier => courier.quantity > 0);

                        return {
                              categoryId: shop.categoryId,
                              categoryName: mockCategories.find(c => c.id === shop.categoryId)?.name,
                              shopId: shop.id,
                              shopName: shop.name,
                              output,
                              percent: parseFloat(((output / total) * 100).toFixed(2)),
                              couriers: validCouriers
                        };
                  })
                  .filter((shop): shop is ShopOutputData => shop !== null) as ShopOutputData[];

            // 类别数据 - 基于筛选后的有效店铺数据计算
            const categoriesMap = new Map<number | string, CategoryData>();

            // 先遍历所有有效店铺，按类别累计数量
            shopData.forEach(shop => {
                  const catId = shop.categoryId;
                  const catName = shop.categoryName || "";

                  if (!categoriesMap.has(catId)) {
                        categoriesMap.set(catId, {
                              id: catId,
                              name: catName,
                              total: 0,
                              percent: 0
                        });
                  }

                  const category = categoriesMap.get(catId)!;
                  category.total += shop.output;
            });

            // 计算每个类别的百分比
            const catData: CategoryData[] = Array.from(categoriesMap.values()).map(category => ({
                  ...category,
                  percent: parseFloat(((category.total / total) * 100).toFixed(2))
            }));

            console.debug("[ShopOutputCard] Mock data generated:", { shopData, catData, total });

            setShopOutputData(shopData);
            setCategoryData(catData);

            // 只有在显示所有类别的时候才更新所有类别数据
            if (!categoryId) {
                  setAllCategoryData(catData);
            }

            setTotalOutput(total);
            setNextRefreshTime(new Date(Date.now() + 5 * 60 * 1000));
            setRefreshCountdown(5 * 60);
      };

      // 初始化加载店铺出力数据
      useEffect(() => {
            fetchShopOutputData(selectedCategory || undefined);
      }, [fetchShopOutputData, selectedCategory]);

      // 自动刷新倒计时
      useEffect(() => {
            const timer = setInterval(() => {
                  const now = Date.now();
                  const refreshTime = nextRefreshTime.getTime();

                  if (now >= refreshTime) {
                        fetchShopOutputData(selectedCategory || undefined, true); // 添加true参数清除缓存
                  } else {
                        setRefreshCountdown(Math.max(0, Math.floor((refreshTime - now) / 1000)));
                  }
            }, 1000);

            return () => clearInterval(timer);
      }, [fetchShopOutputData, nextRefreshTime, selectedCategory]);

      // 格式化倒计时
      const formatCountdown = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      // 手动刷新数据
      const handleRefresh = useCallback(() => {
            fetchShopOutputData(selectedCategory || undefined, true); // 添加参数true以清除缓存
      }, [fetchShopOutputData, selectedCategory]);

      // 分类筛选变更
      const handleCategoryChange = (value: string) => {
            setSelectedCategory(value === "all" ? null : value);
      };

      // 获取要显示的店铺数据（根据类别筛选）
      const getDisplayShopData = () => {
            if (!selectedCategory) return shopOutputData;
            return shopOutputData.filter(shop =>
                  shop.categoryId && shop.categoryId.toString() === selectedCategory
            );
      };

      // 获取饼图数据
      const getShopChartData = () => {
            return getDisplayShopData().map(shop => ({
                  name: shop.shopName,
                  value: shop.output
            }));
      };

      const getCategoryChartData = () => {
            return categoryData.map(cat => ({
                  name: cat.name,
                  value: cat.total
            }));
      };

      // 按类别分组店铺数据
      const getShopDataByCategory = () => {
            const categories = Array.from(new Set(shopOutputData.map(shop => shop.categoryId)));
            return categories.map(catId => {
                  const shops = shopOutputData.filter(shop => shop.categoryId === catId);
                  const categoryName = shops[0]?.categoryName || "未分类";
                  return { categoryId: catId, categoryName, shops };
            });
      };

      // 自定义图例渲染
      const renderColorfulLegendText = (value: string, entry: any) => {
            const { color } = entry;

            return (
                  <span style={{ color, fontSize: '12px' }}>
                        {value.length > 10 ? `${value.substring(0, 10)}...` : value}
                  </span>
            );
      };

      // 自定义工具提示
      const CustomTooltip = ({ active, payload }: any) => {
            if (active && payload && payload.length) {
                  return (
                        <div className="bg-background dark:bg-gray-800 p-2 border shadow-sm rounded-md text-xs">
                              <p className="font-medium">{payload[0].name}</p>
                              <p>{`${t("出力量")}: ${payload[0].value}`}</p>
                              <p>{`${t("占比")}: ${((payload[0].value / totalOutput) * 100).toFixed(2)}%`}</p>
                        </div>
                  );
            }
            return null;
      };

      // 获取所有快递类型名称（用于柱状图图例）
      const getCourierTypes = () => {
            const types = new Set<string>();
            shopOutputData.forEach(shop => {
                  shop.couriers?.forEach(courier => {
                        types.add(courier.courierName);
                  });
            });
            // 将Set转换为数组并按名称排序，确保顺序一致
            return Array.from(types).sort();
      };

      // 为柱状图准备数据
      const getBarChartData = () => {
            return getDisplayShopData().map(shop => {
                  const result: any = {
                        name: shop.shopName,
                        total: shop.output,
                        category: shop.categoryName
                  };

                  // 为每个快递类型添加数据
                  shop.couriers?.forEach(courier => {
                        result[courier.courierName] = courier.quantity;
                  });

                  return result;
            });
      };

      // 自定义柱状图工具提示
      const CustomBarTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                  return (
                        <div className="bg-background dark:bg-gray-800 p-2 border rounded shadow-sm text-xs">
                              <p className="font-medium">{label}</p>
                              {payload.map((entry: any, index: number) => (
                                    <p key={index} style={{ color: entry.color }}>
                                          {`${entry.name}: ${entry.value}`}
                                    </p>
                              ))}
                        </div>
                  );
            }
            return null;
      };

      return (
            <Card className={cn("transition-all duration-500", className)} style={style}>
                  <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                    {icon}
                                    <CardTitle className="text-lg">{title}</CardTitle>
                              </div>
                              <div className="flex items-center space-x-2">
                                    {lastUpdateTime && (
                                          <div className="text-xs bg-muted dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md flex items-center">
                                                <Clock className="h-3 w-3 mr-1 text-gray-500" />
                                                <span className="font-medium">{lastUpdateTime}</span>
                                          </div>
                                    )}
                                    <div className="text-xs bg-muted dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md flex items-center">
                                          <RefreshCw className="h-3 w-3 mr-1 text-gray-500" />
                                          {t("下次刷新")}: <span className="font-medium ml-1">{formatCountdown(refreshCountdown)}</span>
                                    </div>
                                    <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
                                          <SelectTrigger className="w-[130px] h-8 text-xs">
                                                <SelectValue placeholder={t("选择店铺类别")} />
                                          </SelectTrigger>
                                          <SelectContent>
                                                <SelectItem value="all">{t("所有类别")}</SelectItem>
                                                {allCategoryData.map((category) => (
                                                      <SelectItem key={category.id} value={category.id.toString()}>
                                                            {category.name}
                                                      </SelectItem>
                                                ))}
                                          </SelectContent>
                                    </Select>
                                    <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={handleRefresh}
                                          disabled={isLoading}
                                          className="h-8 w-8"
                                          title={t("清除缓存并刷新数据")}
                                    >
                                          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                                    </Button>
                              </div>
                        </div>
                  </CardHeader>
                  <CardContent>
                        {isLoading ? (
                              <div className="flex justify-center items-center py-20">
                                    <LoadingSpinner />
                              </div>
                        ) : error ? (
                              <div className="text-center text-red-500 py-10">
                                    <p>{t("加载出力数据失败")}</p>
                                    <p className="text-sm">{error}</p>
                                    <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleRefresh}
                                          className="mt-4"
                                    >
                                          <RefreshCw className="h-4 w-4 mr-2" /> {t("重试")}
                                    </Button>
                              </div>
                        ) : shopOutputData.length === 0 ? (
                              <div className="text-center text-gray-500 py-10">
                                    {t("暂无出力数据")}
                              </div>
                        ) : (
                              <div className="space-y-4">
                                    {/* 总出力量 */}
                                    <div className="text-center mb-4">
                                          <div className="text-sm text-gray-500 mb-1">{t("总出力量")}</div>
                                          <div className="text-4xl font-bold text-[#16a34a]">{totalOutput}</div>
                                    </div>

                                    {/* 使用Tabs组件展示图表和表格 */}
                                    <Tabs defaultValue="chart" className="mb-6">
                                          <TabsList className="mb-4">
                                                <TabsTrigger value="chart">{t("数据图表")}</TabsTrigger>
                                                <TabsTrigger value="table">{t("详细数据")}</TabsTrigger>
                                          </TabsList>

                                          {/* 图表内容 */}
                                          <TabsContent value="chart" className="space-y-4">
                                                {/* 图表切换按钮 */}
                                                <div className="flex justify-end mb-2">
                                                      <div className="flex rounded-md overflow-hidden">
                                                            <Button
                                                                  variant={chartType === "pie" ? "default" : "outline"}
                                                                  size="sm"
                                                                  className="flex items-center gap-1 rounded-r-none"
                                                                  onClick={() => setChartType("pie")}
                                                            >
                                                                  <PieChartIcon className="h-4 w-4" />
                                                                  <span>{t("饼图")}</span>
                                                            </Button>
                                                            <Button
                                                                  variant={chartType === "bar" ? "default" : "outline"}
                                                                  size="sm"
                                                                  className="flex items-center gap-1 rounded-l-none"
                                                                  onClick={() => setChartType("bar")}
                                                            >
                                                                  <BarChart2 className="h-4 w-4" />
                                                                  <span>{t("柱状图")}</span>
                                                            </Button>
                                                      </div>
                                                </div>

                                                {/* 饼图区域 */}
                                                {chartType === "pie" && (
                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* 按类别分布 */}
                                                            {!selectedCategory && (
                                                                  <div className="h-[240px]">
                                                                        <div className="text-sm font-medium mb-1 text-center">{t("按类别分布")}</div>
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                              <PieChart>
                                                                                    <Pie
                                                                                          data={getCategoryChartData()}
                                                                                          cx="50%"
                                                                                          cy="50%"
                                                                                          labelLine={false}
                                                                                          outerRadius={70}
                                                                                          fill="#8884d8"
                                                                                          dataKey="value"
                                                                                          nameKey="name"
                                                                                          animationBegin={0}
                                                                                          animationDuration={1000}
                                                                                          animationEasing="ease-out"
                                                                                    >
                                                                                          {getCategoryChartData().map((entry, index) => (
                                                                                                <Cell
                                                                                                      key={`cell-${index}`}
                                                                                                      fill={COLORS[index % COLORS.length]}
                                                                                                />
                                                                                          ))}
                                                                                    </Pie>
                                                                                    <Legend
                                                                                          layout="horizontal"
                                                                                          verticalAlign="bottom"
                                                                                          align="center"
                                                                                          formatter={renderColorfulLegendText}
                                                                                    />
                                                                                    <Tooltip content={<CustomTooltip />} />
                                                                              </PieChart>
                                                                        </ResponsiveContainer>
                                                                  </div>
                                                            )}

                                                            {/* 按店铺分布 */}
                                                            <div className={cn("h-[240px]", !selectedCategory ? "md:col-span-1" : "col-span-full")}>
                                                                  <div className="text-sm font-medium mb-1 text-center">
                                                                        {t("按店铺分布")} {selectedCategory && `(${categoryData.find(c => c.id.toString() === selectedCategory)?.name})`}
                                                                  </div>
                                                                  <ResponsiveContainer width="100%" height="100%">
                                                                        <PieChart>
                                                                              <Pie
                                                                                    data={getShopChartData()}
                                                                                    cx="50%"
                                                                                    cy="50%"
                                                                                    labelLine={false}
                                                                                    // label={({ name, percent }) => percent > 0.05 ? name : null}
                                                                                    outerRadius={70}
                                                                                    fill="#8884d8"
                                                                                    dataKey="value"
                                                                                    nameKey="name"
                                                                                    animationBegin={0}
                                                                                    animationDuration={1000}
                                                                                    animationEasing="ease-out"
                                                                              >
                                                                                    {getShopChartData().map((entry, index) => (
                                                                                          <Cell
                                                                                                key={`cell-${index}`}
                                                                                                fill={COLORS[index % COLORS.length]}
                                                                                          />
                                                                                    ))}
                                                                              </Pie>
                                                                              <Legend
                                                                                    layout="horizontal"
                                                                                    verticalAlign="bottom"
                                                                                    align="center"
                                                                                    formatter={renderColorfulLegendText}
                                                                              />
                                                                              <Tooltip content={<CustomTooltip />} />
                                                                        </PieChart>
                                                                  </ResponsiveContainer>
                                                            </div>
                                                      </div>
                                                )}

                                                {/* 柱状图区域 */}
                                                {chartType === "bar" && (
                                                      <div className="h-[400px] w-full">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                  <BarChart
                                                                        data={getBarChartData()}
                                                                        layout="vertical"
                                                                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                                                                  >
                                                                        <CartesianGrid strokeDasharray="3 3" />
                                                                        <XAxis type="number" />
                                                                        <YAxis
                                                                              type="category"
                                                                              dataKey="name"
                                                                              width={120}
                                                                              tick={{ fontSize: 12 }}
                                                                        />
                                                                        <Tooltip content={<CustomBarTooltip />} />
                                                                        <Legend />
                                                                        {getCourierTypes().length > 0 ? (
                                                                              getCourierTypes().map((courierType, index) => (
                                                                                    <Bar
                                                                                          key={`bar-${courierType}`}
                                                                                          dataKey={courierType}
                                                                                          stackId="a"
                                                                                          fill={COLORS[index % COLORS.length]}
                                                                                          name={courierType}
                                                                                    />
                                                                              ))
                                                                        ) : (
                                                                              <Bar dataKey="total" fill={COLORS[0]} name={t("总量")} />
                                                                        )}
                                                                  </BarChart>
                                                            </ResponsiveContainer>
                                                      </div>
                                                )}
                                          </TabsContent>

                                          {/* 详细数据表格 */}
                                          <TabsContent value="table">
                                                <div className="overflow-auto">
                                                      <Table className="border rounded-md">
                                                            <TableHeader>
                                                                  <TableRow>
                                                                        <TableHead>{t("店铺名称")}</TableHead>
                                                                        <TableHead>{t("类别")}</TableHead>
                                                                        <TableHead>{t("快递类型")}</TableHead>
                                                                        <TableHead className="text-right">{t("出力量")}</TableHead>
                                                                  </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                  {getShopDataByCategory().map(category => (
                                                                        category.shops.map((shop, shopIndex) => (
                                                                              <React.Fragment key={`${category.categoryId}-${shop.shopId}`}>
                                                                                    {/* 店铺汇总行 */}
                                                                                    <TableRow className="bg-muted/50 font-medium">
                                                                                          <TableCell>{shop.shopName}</TableCell>
                                                                                          <TableCell>{shop.categoryName || category.categoryName}</TableCell>
                                                                                          <TableCell>{t("合计")}</TableCell>
                                                                                          <TableCell className="text-right font-bold">
                                                                                                {shop.output}
                                                                                          </TableCell>
                                                                                    </TableRow>
                                                                                    {/* 快递类型明细行 */}
                                                                                    {shop.couriers?.map((courier) => (
                                                                                          <TableRow key={`${shop.shopId}-${courier.courierId}`}>
                                                                                                <TableCell></TableCell>
                                                                                                <TableCell></TableCell>
                                                                                                <TableCell>{courier.courierName}</TableCell>
                                                                                                <TableCell className="text-right">
                                                                                                      {courier.quantity}
                                                                                                </TableCell>
                                                                                          </TableRow>
                                                                                    ))}
                                                                                    {/* 分隔行，最后一个店铺不需要 */}
                                                                                    {shopIndex < category.shops.length - 1 && (
                                                                                          <TableRow>
                                                                                                <TableCell colSpan={4} className="p-0">
                                                                                                      <Separator />
                                                                                                </TableCell>
                                                                                          </TableRow>
                                                                                    )}
                                                                              </React.Fragment>
                                                                        ))
                                                                  ))}
                                                            </TableBody>
                                                      </Table>
                                                </div>
                                          </TabsContent>
                                    </Tabs>
                              </div>
                        )}
                  </CardContent>
            </Card>
      );
} 