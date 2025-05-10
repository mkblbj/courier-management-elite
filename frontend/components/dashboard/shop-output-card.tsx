"use client";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { RefreshCw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/loading-spinner";
import Link from "next/link";

// 定义Shop类型
interface Shop {
      id: string;
      name: string;
      category: string;
      output: number;
}

// 定义Properties
interface ShopOutputCardProps {
      title: string;
      data: Shop[];
      isLoading: boolean;
      onRefresh: () => void;
      isPrediction?: boolean;
}

// 创建一个格式化后的数据类型
interface ChartData {
      name: string;
      value: number;
      color: string;
}

// 颜色配置
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"];

export function ShopOutputCard({
      title,
      data,
      isLoading,
      onRefresh,
      isPrediction = false
}: ShopOutputCardProps) {
      const { t } = useTranslation();
      const [selectedCategory, setSelectedCategory] = useState<string>("all");
      const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
      const [pieData, setPieData] = useState<ChartData[]>([]);
      const [shopPieData, setShopPieData] = useState<ChartData[]>([]);
      const [filteredData, setFilteredData] = useState<Shop[]>([]);

      // 处理分类筛选
      useEffect(() => {
            if (!data) return;

            const filtered = selectedCategory === "all"
                  ? data
                  : data.filter(shop => shop.category === selectedCategory);

            setFilteredData(filtered);

            // 生成店铺饼图数据
            const shopData = filtered.map((shop, index) => ({
                  name: shop.name,
                  value: shop.output,
                  color: COLORS[index % COLORS.length]
            })).filter(item => item.value > 0);

            setShopPieData(shopData);
      }, [data, selectedCategory]);

      // 生成类别饼图数据
      useEffect(() => {
            if (!data) return;

            // 按类别分组并计算总数
            const categoryMap = new Map<string, number>();

            data.forEach(shop => {
                  const current = categoryMap.get(shop.category) || 0;
                  categoryMap.set(shop.category, current + shop.output);
            });

            // 转换为图表数据
            const categoryData = Array.from(categoryMap.entries()).map(([category, value], index) => ({
                  name: category,
                  value,
                  color: COLORS[index % COLORS.length]
            })).filter(item => item.value > 0);

            setPieData(categoryData);
      }, [data]);

      // 计算总出力量
      const totalOutput = data ? data.reduce((sum, shop) => sum + shop.output, 0) : 0;

      // 获取所有类别
      const categories = data ? Array.from(new Set(data.map(shop => shop.category))) : [];

      // 处理刷新
      const handleRefresh = async () => {
            setIsRefreshing(true);
            await onRefresh();
            setIsRefreshing(false);
      };

      return (
            <Card className="w-full">
                  <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">
                                    {title}
                                    {isPrediction && (
                                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                                                {t("预测")}
                                          </span>
                                    )}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                    <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={handleRefresh}
                                          disabled={isRefreshing || isLoading}
                                    >
                                          <RefreshCw className={cn("h-4 w-4", (isRefreshing || isLoading) && "animate-spin")} />
                                    </Button>
                                    <Link href="/shop-output">
                                          <Button variant="ghost" size="sm" className="gap-1 text-sm">
                                                {t("查看详情")}
                                                <ChevronRight className="h-4 w-4" />
                                          </Button>
                                    </Link>
                              </div>
                        </div>
                  </CardHeader>
                  <CardContent>
                        {isLoading ? (
                              <div className="flex justify-center items-center py-20">
                                    <LoadingSpinner size="lg" text={isPrediction ? t("加载预测数据...") : t("加载中...")} />
                              </div>
                        ) : data && data.length > 0 ? (
                              <div className="space-y-6">
                                    {/* 总出力量 */}
                                    <div className="flex justify-center">
                                          <div className="text-center">
                                                <div className="text-sm text-gray-500 mb-1">
                                                      {isPrediction ? t("预计出力总量") : t("出力总量")}
                                                </div>
                                                <div className="text-4xl font-bold" style={{ color: isPrediction ? '#ff8c00' : '#16803C' }}>
                                                      {totalOutput}
                                                </div>
                                          </div>
                                    </div>

                                    {/* 类别选择 */}
                                    <div className="flex justify-end mb-4">
                                          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                                <SelectTrigger className="w-[140px]">
                                                      <SelectValue placeholder={t("选择类别")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                      <SelectItem value="all">{t("所有类别")}</SelectItem>
                                                      {categories.map(category => (
                                                            <SelectItem key={category} value={category}>{category}</SelectItem>
                                                      ))}
                                                </SelectContent>
                                          </Select>
                                    </div>

                                    {/* 图表区域 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          {/* 类别分布饼图 */}
                                          <div>
                                                <div className="text-sm font-medium mb-2 text-center">{t("类别分布")}</div>
                                                <div className="h-[180px]">
                                                      {pieData.length > 0 ? (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                  <PieChart>
                                                                        <Pie
                                                                              data={pieData}
                                                                              cx="50%"
                                                                              cy="50%"
                                                                              labelLine={false}
                                                                              outerRadius={70}
                                                                              fill="#8884d8"
                                                                              dataKey="value"
                                                                              nameKey="name"
                                                                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                                        >
                                                                              {pieData.map((entry, index) => (
                                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                              ))}
                                                                        </Pie>
                                                                        <Tooltip
                                                                              formatter={(value: number) => [`${value} ${t("件")}`, ""]}
                                                                        />
                                                                  </PieChart>
                                                            </ResponsiveContainer>
                                                      ) : (
                                                            <div className="flex justify-center items-center h-full text-gray-500">
                                                                  {t("暂无类别数据")}
                                                            </div>
                                                      )}
                                                </div>
                                          </div>

                                          {/* 店铺分布饼图 */}
                                          <div>
                                                <div className="text-sm font-medium mb-2 text-center">
                                                      {selectedCategory === "all" ? t("店铺分布") : `${selectedCategory}${t("店铺分布")}`}
                                                </div>
                                                <div className="h-[180px]">
                                                      {shopPieData.length > 0 ? (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                  <PieChart>
                                                                        <Pie
                                                                              data={shopPieData}
                                                                              cx="50%"
                                                                              cy="50%"
                                                                              labelLine={false}
                                                                              outerRadius={70}
                                                                              fill="#8884d8"
                                                                              dataKey="value"
                                                                              nameKey="name"
                                                                              label={({ name, percent }) =>
                                                                                    name.length > 5
                                                                                          ? `${name.substring(0, 5)}...: ${(percent * 100).toFixed(0)}%`
                                                                                          : `${name}: ${(percent * 100).toFixed(0)}%`
                                                                              }
                                                                        >
                                                                              {shopPieData.map((entry, index) => (
                                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                              ))}
                                                                        </Pie>
                                                                        <Tooltip
                                                                              formatter={(value: number, name: string) => [`${value} ${t("件")}`, name]}
                                                                        />
                                                                  </PieChart>
                                                            </ResponsiveContainer>
                                                      ) : (
                                                            <div className="flex justify-center items-center h-full text-gray-500">
                                                                  {t("暂无店铺数据")}
                                                            </div>
                                                      )}
                                                </div>
                                          </div>
                                    </div>

                                    {/* 店铺数据表格 */}
                                    <div>
                                          <div className="text-sm font-medium mb-2">{t("店铺出力详情")}</div>
                                          <div className="border rounded-md">
                                                <div className="grid grid-cols-3 bg-gray-50 p-2 border-b">
                                                      <div className="font-medium text-sm">{t("店铺名称")}</div>
                                                      <div className="font-medium text-sm text-center">{t("类别")}</div>
                                                      <div className="font-medium text-sm text-right">{t("出力量")}</div>
                                                </div>
                                                <div className="max-h-[200px] overflow-y-auto">
                                                      {filteredData.length > 0 ? (
                                                            filteredData.map((shop, index) => (
                                                                  <div key={shop.id} className={cn(
                                                                        "grid grid-cols-3 p-2",
                                                                        index < filteredData.length - 1 && "border-b"
                                                                  )}>
                                                                        <div className="text-sm truncate" title={shop.name}>{shop.name}</div>
                                                                        <div className="text-sm text-center">{shop.category}</div>
                                                                        <div className="text-sm font-medium text-right">{shop.output}</div>
                                                                  </div>
                                                            ))
                                                      ) : (
                                                            <div className="flex justify-center py-4 text-gray-500">{t("暂无数据")}</div>
                                                      )}
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        ) : (
                              <div className="flex justify-center items-center py-20 text-gray-500">
                                    {t("暂无数据")}
                              </div>
                        )}
                  </CardContent>
            </Card>
      );
} 