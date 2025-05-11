"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Store, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/loading-spinner";

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

export function ShopOutputCard({ title, icon = <Store className="h-5 w-5" />, className, style }: ShopOutputCardProps) {
      const { t } = useTranslation();
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [shopOutputData, setShopOutputData] = useState<ShopOutputData[]>([]);
      const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
      const [totalOutput, setTotalOutput] = useState(0);
      const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
      const [nextRefreshTime, setNextRefreshTime] = useState<Date>(new Date(Date.now() + 5 * 60 * 1000)); // 5分钟后刷新
      const [refreshCountdown, setRefreshCountdown] = useState<number>(5 * 60); // 倒计时秒数

      // 获取今日出力数据
      const fetchShopOutputData = useCallback(async (categoryId?: string | number) => {
            setIsLoading(true);
            setError(null);

            try {
                  // 这里应该是API调用，现在使用模拟数据
                  // 实际实现应该是:
                  // const response = await fetch(`/api/dashboard/shop-outputs/today${categoryId ? `?category_id=${categoryId}` : ''}`);
                  // if (!response.ok) throw new Error('获取数据失败');
                  // const data = await response.json();

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

                  // 根据选择的类别过滤商店
                  const filteredShops = categoryId
                        ? mockShops.filter(shop => shop.categoryId.toString() === categoryId.toString())
                        : mockShops;

                  // 生成随机出力数据
                  const total = filteredShops.reduce((sum, _) => sum + (Math.floor(Math.random() * 100) + 20), 0);

                  // 店铺数据
                  const shopData: ShopOutputData[] = filteredShops.map(shop => {
                        const output = Math.floor(Math.random() * 100) + 20;
                        return {
                              categoryId: shop.categoryId,
                              categoryName: mockCategories.find(c => c.id === shop.categoryId)?.name,
                              shopId: shop.id,
                              shopName: shop.name,
                              output,
                              percent: parseFloat(((output / total) * 100).toFixed(2))
                        };
                  });

                  // 类别数据
                  const catData: CategoryData[] = mockCategories.map(category => {
                        const shopsInCategory = shopData.filter(shop => shop.categoryId === category.id);
                        const categoryTotal = shopsInCategory.reduce((sum, shop) => sum + shop.output, 0);
                        return {
                              id: category.id,
                              name: category.name,
                              total: categoryTotal,
                              percent: parseFloat(((categoryTotal / total) * 100).toFixed(2))
                        };
                  });

                  setShopOutputData(shopData);
                  setCategoryData(catData);
                  setTotalOutput(total);
                  setNextRefreshTime(new Date(Date.now() + 5 * 60 * 1000)); // 5分钟后刷新
                  setRefreshCountdown(5 * 60); // 重置倒计时
            } catch (error) {
                  console.error("获取店铺出力数据失败:", error);
                  setError(error instanceof Error ? error.message : "未知错误");
            } finally {
                  setIsLoading(false);
            }
      }, []);

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
                        fetchShopOutputData(selectedCategory || undefined);
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
            fetchShopOutputData(selectedCategory || undefined);
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

      // 自定义图例
      const renderLegendText = (value: string) => {
            const maxLength = 10; // 最大显示长度
            if (value.length <= maxLength) return value;
            return `${value.substring(0, maxLength)}...`;
      };

      // 自定义工具提示
      const CustomTooltip = ({ active, payload }: any) => {
            if (active && payload && payload.length) {
                  return (
                        <div className="bg-white p-2 border shadow-sm rounded-md text-xs">
                              <p className="font-medium">{payload[0].name}</p>
                              <p>{`${t("出力量")}: ${payload[0].value}`}</p>
                              <p>{`${t("占比")}: ${((payload[0].value / totalOutput) * 100).toFixed(2)}%`}</p>
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
                                    <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md flex items-center">
                                          <RefreshCw className="h-3 w-3 mr-1 text-gray-500" />
                                          {t("下次刷新")}: <span className="font-medium ml-1">{formatCountdown(refreshCountdown)}</span>
                                    </div>
                                    <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
                                          <SelectTrigger className="w-[130px] h-8 text-xs">
                                                <SelectValue placeholder={t("选择店铺类别")} />
                                          </SelectTrigger>
                                          <SelectContent>
                                                <SelectItem value="all">{t("所有类别")}</SelectItem>
                                                {categoryData.map((category) => (
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

                                    {/* 饼图区域 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {/* 按类别分布 */}
                                          {!selectedCategory && (
                                                <div className="h-[200px]">
                                                      <div className="text-sm font-medium mb-1 text-center">{t("按类别分布")}</div>
                                                      <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                  <Pie
                                                                        data={getCategoryChartData()}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        labelLine={false}
                                                                        outerRadius={80}
                                                                        fill="#8884d8"
                                                                        dataKey="value"
                                                                        nameKey="name"
                                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                                  >
                                                                        {getCategoryChartData().map((entry, index) => (
                                                                              <Cell
                                                                                    key={`cell-${index}`}
                                                                                    fill={COLORS[index % COLORS.length]}
                                                                              />
                                                                        ))}
                                                                  </Pie>
                                                                  <Tooltip content={<CustomTooltip />} />
                                                            </PieChart>
                                                      </ResponsiveContainer>
                                                </div>
                                          )}

                                          {/* 按店铺分布 */}
                                          <div className={cn("h-[200px]", !selectedCategory ? "md:col-span-1" : "col-span-full")}>
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
                                                                  outerRadius={80}
                                                                  fill="#8884d8"
                                                                  dataKey="value"
                                                                  nameKey="name"
                                                                  label={({ name, percent }) =>
                                                                        `${name.length > 6 ? `${name.substring(0, 6)}...` : name}: ${(percent * 100).toFixed(0)}%`
                                                                  }
                                                            >
                                                                  {getShopChartData().map((entry, index) => (
                                                                        <Cell
                                                                              key={`cell-${index}`}
                                                                              fill={COLORS[index % COLORS.length]}
                                                                        />
                                                                  ))}
                                                            </Pie>
                                                            <Tooltip content={<CustomTooltip />} />
                                                      </PieChart>
                                                </ResponsiveContainer>
                                          </div>
                                    </div>

                                    {/* 店铺出力表格 */}
                                    <div className="overflow-auto">
                                          <Table className="border rounded-md">
                                                <TableHeader>
                                                      <TableRow>
                                                            <TableHead>{t("店铺名称")}</TableHead>
                                                            <TableHead className="text-right">{t("出力量")}</TableHead>
                                                            <TableHead className="text-right">{t("占比")}</TableHead>
                                                      </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                      {selectedCategory ? (
                                                            // 显示某个类别的店铺
                                                            getDisplayShopData().map(shop => (
                                                                  <TableRow key={shop.shopId}>
                                                                        <TableCell className="font-medium">
                                                                              {shop.shopName}
                                                                        </TableCell>
                                                                        <TableCell className="text-right">{shop.output}</TableCell>
                                                                        <TableCell className="text-right">{shop.percent}%</TableCell>
                                                                  </TableRow>
                                                            ))
                                                      ) : (
                                                            // 按类别分组显示所有店铺
                                                            getShopDataByCategory().map(category => (
                                                                  <React.Fragment key={category.categoryId}>
                                                                        <TableRow className="bg-muted/50">
                                                                              <TableCell colSpan={3} className="font-semibold">
                                                                                    {category.categoryName}
                                                                              </TableCell>
                                                                        </TableRow>
                                                                        {category.shops.map(shop => (
                                                                              <TableRow key={shop.shopId}>
                                                                                    <TableCell className="font-medium pl-6">
                                                                                          {shop.shopName}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-right">{shop.output}</TableCell>
                                                                                    <TableCell className="text-right">{shop.percent}%</TableCell>
                                                                              </TableRow>
                                                                        ))}
                                                                  </React.Fragment>
                                                            ))
                                                      )}
                                                </TableBody>
                                          </Table>
                                    </div>
                              </div>
                        )}
                  </CardContent>
            </Card>
      );
} 