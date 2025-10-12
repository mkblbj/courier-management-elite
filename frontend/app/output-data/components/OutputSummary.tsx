"use client";;
import { useTranslation } from "react-i18next";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { getShopOutputs, getOperationStats } from "@/lib/api/shop-output";
import { getShopCategories } from "@/lib/api/shop-category";
import { getShops } from "@/lib/api/shop";
import { ShopOutput } from "@/lib/types/shop-output";
import { ShopCategory } from "@/lib/types/shop";
import { Shop } from "@/lib/types/shop";
import { dateToApiString, formatDisplayDate } from "@/lib/date-utils";
import { DATE_FORMAT } from "@/lib/constants";
import { RefreshCw, PieChart, BarChart2 } from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

interface OutputSummaryProps {
  selectedDate?: Date;
}

export default function OutputSummary({ selectedDate }: OutputSummaryProps) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayOutputs, setTodayOutputs] = useState<ShopOutput[]>([]);
  const [operationStats, setOperationStats] = useState<{
    add: { count: number; total_quantity: number };
    subtract: { count: number; total_quantity: number };
    merge: { count: number; total_quantity: number };
    net_growth: number;
  } | null>(null);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [tableViewType, setTableViewType] = useState<"byShop" | "byCourier">("byShop");

  // 使用选择的日期或当天日期
  const dateToUse = selectedDate ? dateToApiString(selectedDate) : dateToApiString(new Date());

  // 定义饼图颜色
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

  useEffect(() => {
    fetchCategories();
    fetchShops();
    fetchTodayData();
  }, [selectedDate, refreshKey, t]);

  const fetchCategories = async () => {
    try {
      const data = await getShopCategories({ sort: "sort_order" });
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchShops = async () => {
    try {
      const data = await getShops({ withCategory: true });
      setShops(data);
      console.log("获取到的店铺数据:", data);
    } catch (err) {
      console.error("Failed to fetch shops:", err);
    }
  };

  const fetchTodayData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 获取选定日期的出力数据
      const data = await getShopOutputs({
        date_from: dateToUse,
        date_to: dateToUse,
        category_id: selectedCategory !== "all" ? Number(selectedCategory) : undefined
      });
      console.log("获取到的shop-outputs数据:", data);
      setTodayOutputs(data);

      // 获取操作统计数据
      const stats = await getOperationStats({
        date_from: dateToUse,
        date_to: dateToUse,
        ...(selectedCategory !== "all" && { shop_id: undefined }) // 如果有类别筛选，可以在这里处理
      });
      console.log("获取到的操作统计数据:", stats);
      setOperationStats(stats);

    } catch (err) {
      console.error("Failed to fetch today's outputs:", err);
      setError(t("获取出力数据失败，请重试"));
    } finally {
      setLoading(false);
    }
  };

  // 获取店铺类别名称
  const getShopCategoryName = (shopId: number): string => {
    const shop = shops.find(s => s.id === shopId);
    if (shop && shop.category_id) {
      const category = categories.find(c => c.id === shop.category_id);
      return category?.name || "未分类";
    }
    return "未分类";
  };

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    // 当类别变化时触发数据刷新
    setTimeout(() => fetchTodayData(), 0);
  };

  // 按店铺和快递类型分组汇总数据（包含所有操作类型）
  const shopGroupedData = todayOutputs.reduce((acc, item) => {
    // 按店铺分组
    if (!acc[item.shop_id]) {
      acc[item.shop_id] = {
        shop_id: item.shop_id,
        shop_name: item.shop_name || "未知店铺",
        category_name: getShopCategoryName(item.shop_id),
        couriers: [],
        total_quantity: 0,
        net_quantity: 0 // 净增长（排除合单）
      };
    }

    // 找到或创建快递类型
    let courier = acc[item.shop_id].couriers.find(c => c.courier_id === item.courier_id);
    if (!courier) {
      courier = {
        courier_id: item.courier_id,
        courier_name: item.courier_name || "未知快递",
        operations: [],
        total_quantity: 0,
        net_quantity: 0 // 净增长（排除合单）
      };
      acc[item.shop_id].couriers.push(courier);
    }

    // 找到或创建操作类型
    let operation = courier.operations.find(op => op.operation_type === item.operation_type);
    if (!operation) {
      operation = {
        operation_type: item.operation_type || 'add',
        quantity: 0,
        count: 0
      };
      courier.operations.push(operation);
    }

    // 累加操作数据
    operation.quantity += item.quantity;
    operation.count += 1;

    // 累加快递类型总量（合单参与计算，因为合单quantity为负数）
    courier.total_quantity += item.quantity;
    courier.net_quantity += item.quantity;

    // 累加店铺总量（合单参与计算，因为合单quantity为负数）
    acc[item.shop_id].total_quantity += item.quantity;
    acc[item.shop_id].net_quantity += item.quantity;

    return acc;
  }, {} as Record<number, {
    shop_id: number;
    shop_name: string;
    category_name: string;
    couriers: Array<{
      courier_id: number;
      courier_name: string;
      operations: Array<{
        operation_type: string;
        quantity: number;
        count: number;
      }>;
      total_quantity: number;
      net_quantity: number;
    }>;
    total_quantity: number;
    net_quantity: number;
  }>);

  // 转换为数组便于渲染
  const shopSummaryArray = Object.values(shopGroupedData);

  // 计算总出力量（使用净增长数据，如果没有则使用汇总数据）
  const totalQuantity = operationStats ? operationStats.net_growth :
    shopSummaryArray.reduce((sum, item) => sum + item.net_quantity, 0);

  // 准备饼图数据（使用净增长）
  const pieData = shopSummaryArray.map(shop => ({
    name: shop.shop_name,
    value: shop.net_quantity,
    category: shop.category_name
  }));

  // 准备柱状图数据（使用净增长）
  const barData = shopSummaryArray.map(shop => {
    const result: any = {
      name: shop.shop_name,
      total: shop.net_quantity,
      category: shop.category_name
    };

    // 为每个快递类型添加数据（使用净增长）
    shop.couriers.forEach(courier => {
      result[courier.courier_name] = courier.net_quantity;
    });

    return result;
  });

  // 获取所有快递类型名称（用于柱状图图例）
  const courierTypes = Array.from(
    new Set(
      shopSummaryArray.flatMap(shop => shop.couriers.map(courier => courier.courier_name))
    )
  );

  // 获取操作类型的显示名称和颜色
  const getOperationDisplayInfo = (operationType: string) => {
    switch (operationType) {
      case 'add':
        return { name: t("新增"), color: 'text-green-700', bgColor: 'bg-green-100' };
      case 'subtract':
        return { name: t("减少"), color: 'text-red-700', bgColor: 'bg-red-100' };
      case 'merge':
        return { name: t("合单"), color: 'text-orange-700', bgColor: 'bg-orange-100' };
      default:
        return { name: operationType, color: 'text-gray-700', bgColor: 'bg-gray-100' };
    }
  };

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background dark:bg-gray-800 p-2 border rounded shadow-sm text-sm">
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

  // 准备按快递类型分组的数据（包含所有操作类型）
  const courierGroupedData = todayOutputs.reduce((acc, item) => {
    // 按快递类型分组
    if (!acc[item.courier_id]) {
      acc[item.courier_id] = {
        courier_id: item.courier_id,
        courier_name: item.courier_name || "未知快递",
        shops: [],
        total_quantity: 0,
        net_quantity: 0 // 净增长（排除合单）
      };
    }

    // 找到或创建店铺
    let shop = acc[item.courier_id].shops.find(s => s.shop_id === item.shop_id);
    if (!shop) {
      shop = {
        shop_id: item.shop_id,
        shop_name: item.shop_name || "未知店铺",
        category_name: getShopCategoryName(item.shop_id),
        operations: [],
        total_quantity: 0,
        net_quantity: 0 // 净增长（排除合单）
      };
      acc[item.courier_id].shops.push(shop);
    }

    // 找到或创建操作类型
    let operation = shop.operations.find(op => op.operation_type === item.operation_type);
    if (!operation) {
      operation = {
        operation_type: item.operation_type || 'add',
        quantity: 0,
        count: 0
      };
      shop.operations.push(operation);
    }

    // 累加操作数据
    operation.quantity += item.quantity;
    operation.count += 1;

    // 累加店铺总量（合单参与计算，因为合单quantity为负数）
    shop.total_quantity += item.quantity;
    shop.net_quantity += item.quantity;

    // 累加快递类型总量（合单参与计算，因为合单quantity为负数）
    acc[item.courier_id].total_quantity += item.quantity;
    acc[item.courier_id].net_quantity += item.quantity;

    return acc;
  }, {} as Record<number, {
    courier_id: number;
    courier_name: string;
    shops: Array<{
      shop_id: number;
      shop_name: string;
      category_name: string;
      operations: Array<{
        operation_type: string;
        quantity: number;
        count: number;
      }>;
      total_quantity: number;
      net_quantity: number;
    }>;
    total_quantity: number;
    net_quantity: number;
  }>);

  // 转换为数组便于渲染
  const courierSummaryArray = Object.values(courierGroupedData);

  return (
    <div className="space-y-4">
      {/* 操作统计卡片 */}
      {operationStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-green-700">{t("新增")}</div>
                <div className="text-lg font-bold">{operationStats.add.total_quantity}</div>
                <div className="text-xs text-muted-foreground">{operationStats.add.count} {t("次操作")}</div>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-red-700">{t("减少")}</div>
                <div className="text-lg font-bold">{operationStats.subtract.total_quantity}</div>
                <div className="text-xs text-muted-foreground">{operationStats.subtract.count} {t("次操作")}</div>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-orange-700">{t("合单")}</div>
                <div className="text-lg font-bold">{operationStats.merge.total_quantity}</div>
                <div className="text-xs text-muted-foreground">{operationStats.merge.count} {t("次操作")}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 原有的汇总内容 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">
            {formatDisplayDate(dateToUse)} {t("数据汇总")}
          </h3>
          <div className="text-sm text-muted-foreground">
            {t("总计")}: <span className="font-medium text-foreground">{totalQuantity}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {categories.length > 0 && (
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("选择类别")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("全部类别")}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            title={t("刷新数据")}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only">{t("刷新")}</span>
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>{selectedDate ? formatDisplayDate(selectedDate) : '今日'}{t("数据汇总")}</CardTitle>
            {!loading && todayOutputs.length > 0 && (
              <CardDescription className="mt-1.5">
                {t("共 {count} 家店铺，总出力量：{total}", { count: shopSummaryArray.length, total: totalQuantity })}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{t("加载中...")}</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : todayOutputs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedDate ? formatDisplayDate(selectedDate) : '今日'}{t("暂无数据")}</div>
          ) : (
            <div>
              <Tabs defaultValue="table" className="mb-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="chart">{t("数据图表")}</TabsTrigger>
                  <TabsTrigger value="table">{t("详细数据")}</TabsTrigger>
                </TabsList>
                <TabsContent value="chart" className="space-y-4">
                  <div className="flex justify-end mb-2">
                    <div className="flex rounded-md overflow-hidden">
                      <Button
                        variant={chartType === "pie" ? "default" : "outline"}
                        size="sm"
                        className="flex items-center gap-1 rounded-r-none"
                        onClick={() => setChartType("pie")}
                      >
                        <PieChart className="h-4 w-4" />
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
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "pie" ? (
                        <RePieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => percent > 0.05 ? name : null}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ReTooltip content={<CustomTooltip />} />
                          <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                        </RePieChart>
                      ) : (
                        <BarChart
                          data={barData}
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
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          {courierTypes.length > 0 ? (
                            courierTypes.map((courierType, index) => (
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
                      )}
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                <TabsContent value="table">
                  <div className="mb-4">
                    <div className="flex justify-start space-x-2">
                      <Button
                        variant={tableViewType === "byShop" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTableViewType("byShop")}
                      >
                        {t("按店铺统计")}
                      </Button>
                      <Button
                        variant={tableViewType === "byCourier" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTableViewType("byCourier")}
                      >
                        {t("按快递类型统计")}
                      </Button>
                    </div>
                  </div>

                  {tableViewType === "byShop" ? (
                    <div className="space-y-4">
                      {shopSummaryArray.map((shop) => (
                        <Card key={shop.shop_id} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-8 bg-primary rounded-full"></div>
                                <div>
                                  <CardTitle className="text-lg">{shop.shop_name}</CardTitle>
                                  <CardDescription className="text-sm">{shop.category_name}</CardDescription>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">{shop.net_quantity}</div>
                                <div className="text-xs text-muted-foreground">{t("净增长")}</div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              {shop.couriers.map((courier) => (
                                <div key={`${shop.shop_id}-${courier.courier_id}`} className="border rounded-lg p-3 bg-muted/20">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-medium text-sm">{courier.courier_name}</div>
                                    <div className="text-right">
                                      <div className="font-semibold">{courier.net_quantity}</div>
                                      <div className="text-xs text-muted-foreground">{t("净增长")}</div>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {courier.operations.map((operation) => {
                                      const operationInfo = getOperationDisplayInfo(operation.operation_type);
                                      return (
                                        <div key={`${shop.shop_id}-${courier.courier_id}-${operation.operation_type}`}
                                          className="flex items-center space-x-2 text-sm">
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${operationInfo.bgColor} ${operationInfo.color}`}>
                                            {operationInfo.name}
                                          </span>
                                          <span className="font-medium">{operation.quantity}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {courierSummaryArray.map((courier) => (
                        <Card key={courier.courier_id} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                                <div>
                                  <CardTitle className="text-lg">{courier.courier_name}</CardTitle>
                                  <CardDescription className="text-sm">{t("快递类型")}</CardDescription>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-orange-600">{courier.net_quantity}</div>
                                <div className="text-xs text-muted-foreground">{t("净增长")}</div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              {courier.shops.map((shop) => (
                                <div key={`${courier.courier_id}-${shop.shop_id}`} className="border rounded-lg p-3 bg-muted/20">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <div className="font-medium text-sm">{shop.shop_name}</div>
                                      <div className="text-xs text-muted-foreground">{shop.category_name}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold">{shop.net_quantity}</div>
                                      <div className="text-xs text-muted-foreground">{t("净增长")}</div>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {shop.operations.map((operation) => {
                                      const operationInfo = getOperationDisplayInfo(operation.operation_type);
                                      return (
                                        <div key={`${courier.courier_id}-${shop.shop_id}-${operation.operation_type}`}
                                          className="flex items-center space-x-2 text-sm">
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${operationInfo.bgColor} ${operationInfo.color}`}>
                                            {operationInfo.name}
                                          </span>
                                          <span className="font-medium">{operation.quantity}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 