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
import { getShopOutputs } from "@/lib/api/shop-output";
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
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

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
      // 检查数据中是否包含category_name
      if (data.length > 0) {
        console.log("第一条数据示例:", data[0]);
        console.log("是否包含category_name:", data[0].hasOwnProperty("category_name"));
      }
      setTodayOutputs(data);
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

  // 按店铺和快递类型分组汇总数据
  const shopGroupedData = todayOutputs.reduce((acc, item) => {
    // 按店铺分组
    if (!acc[item.shop_id]) {
      acc[item.shop_id] = {
        shop_id: item.shop_id,
        shop_name: item.shop_name || "未知店铺",
        category_name: getShopCategoryName(item.shop_id),
        couriers: [],
        total_quantity: 0
      };
    }

    // 找到或创建快递类型
    let courier = acc[item.shop_id].couriers.find(c => c.courier_id === item.courier_id);
    if (!courier) {
      courier = {
        courier_id: item.courier_id,
        courier_name: item.courier_name || "未知快递",
        quantity: 0
      };
      acc[item.shop_id].couriers.push(courier);
    }

    // 累加数量
    courier.quantity += item.quantity;
    acc[item.shop_id].total_quantity += item.quantity;

    return acc;
  }, {} as Record<number, {
    shop_id: number;
    shop_name: string;
    category_name: string;
    couriers: Array<{
      courier_id: number;
      courier_name: string;
      quantity: number;
    }>;
    total_quantity: number;
  }>);

  // 转换为数组便于渲染
  const shopSummaryArray = Object.values(shopGroupedData);

  // 计算总出力量
  const totalQuantity = shopSummaryArray.reduce((sum, item) => sum + item.total_quantity, 0);

  // 准备饼图数据
  const pieData = shopSummaryArray.map(shop => ({
    name: shop.shop_name,
    value: shop.total_quantity,
    category: shop.category_name
  }));

  // 准备柱状图数据
  const barData = shopSummaryArray.map(shop => {
    const result: any = {
      name: shop.shop_name,
      total: shop.total_quantity,
      category: shop.category_name
    };

    // 为每个快递类型添加数据
    shop.couriers.forEach(courier => {
      result[courier.courier_name] = courier.quantity;
    });

    return result;
  });

  // 获取所有快递类型名称（用于柱状图图例）
  const courierTypes = Array.from(
    new Set(
      shopSummaryArray.flatMap(shop => shop.couriers.map(courier => courier.courier_name))
    )
  );

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm text-sm">
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
    (<Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{selectedDate ? formatDisplayDate(selectedDate) : '今日'}{t("数据汇总")}</CardTitle>
          {!loading && todayOutputs.length > 0 && (
            <CardDescription className="mt-1.5">
              共{shopSummaryArray.length}{t("家店铺，总出力量：")}{totalQuantity}
            </CardDescription>
          )}
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
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip content={<CustomTooltip />} />
                        <Legend />
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("店铺名称")}</TableHead>
                        <TableHead>{t("类别")}</TableHead>
                        <TableHead>{t("快递类型")}</TableHead>
                        <TableHead className="text-right">{t("出力数量")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shopSummaryArray.map((shop, shopIndex) => (
                        <React.Fragment key={shop.shop_id}>
                          {/* 店铺汇总行 */}
                          <TableRow className="bg-muted/30 font-medium">
                            <TableCell>{shop.shop_name}</TableCell>
                            <TableCell>{shop.category_name}</TableCell>
                            <TableCell>{t("合计")}</TableCell>
                            <TableCell className="text-right font-bold">
                              {shop.total_quantity}
                            </TableCell>
                          </TableRow>
                          {/* 快递类型明细行 */}
                          {shop.couriers.map((courier, courierIndex) => (
                            <TableRow key={`${shop.shop_id}-${courier.courier_id}`}>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell>{courier.courier_name}</TableCell>
                              <TableCell className="text-right">
                                {courier.quantity}
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* 分隔行，最后一个店铺不需要 */}
                          {shopIndex < shopSummaryArray.length - 1 && (
                            <TableRow>
                              <TableCell colSpan={4} className="p-0">
                                <Separator />
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>)
  );
} 