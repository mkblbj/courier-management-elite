"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangeSelector } from "@/components/shop-output/DateSelector";
import { ShopOutputStats, ShopOutputTotal } from "@/lib/types/shop-output";
import {
  getShopStats,
  getCourierStats,
  getDateStats,
  getTotalStats,
} from "@/lib/api/shop-output";
import { DATE_FORMAT } from "@/lib/constants";

export default function OutputSummary() {
  const [activeTab, setActiveTab] = useState("total");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [shopStats, setShopStats] = useState<ShopOutputStats[]>([]);
  const [courierStats, setCourierStats] = useState<ShopOutputStats[]>([]);
  const [dateStats, setDateStats] = useState<ShopOutputStats[]>([]);
  const [totalStats, setTotalStats] = useState<ShopOutputTotal | null>(null);

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const dateFromStr = dateFrom ? format(dateFrom, DATE_FORMAT.replace(/Y/g, "y")) : undefined;
    const dateToStr = dateTo ? format(dateTo, DATE_FORMAT.replace(/Y/g, "y")) : undefined;

    try {
      // 并行获取各种统计数据
      const [shopData, courierData, dateData, totalData] = await Promise.all([
        getShopStats(dateFromStr, dateToStr),
        getCourierStats(dateFromStr, dateToStr),
        getDateStats(dateFromStr, dateToStr),
        getTotalStats(dateFromStr, dateToStr),
      ]);

      setShopStats(shopData);
      setCourierStats(courierData);
      setDateStats(dateData);
      setTotalStats(totalData);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError("获取统计数据失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const renderTotalStats = () => {
    if (!totalStats) return <div className="text-center py-12 text-muted-foreground">无统计数据</div>;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总出力数量</CardDescription>
            <CardTitle className="text-3xl">{totalStats.total_quantity}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>日均出力</CardDescription>
            <CardTitle className="text-3xl">{totalStats.average_daily.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>涵盖天数</CardDescription>
            <CardTitle className="text-3xl">{totalStats.days_count}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>店铺数量</CardDescription>
            <CardTitle className="text-3xl">{totalStats.shops_count}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>出力数据汇总</CardTitle>
        <CardDescription>查看各维度的出力数据统计</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <DateRangeSelector
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
        </div>

        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <Tabs defaultValue="total" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="total">总览</TabsTrigger>
              <TabsTrigger value="date">按日期</TabsTrigger>
              <TabsTrigger value="shop">按店铺</TabsTrigger>
              <TabsTrigger value="courier">按快递类型</TabsTrigger>
            </TabsList>

            <TabsContent value="total">{renderTotalStats()}</TabsContent>

            <TabsContent value="date">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead className="text-right">出力数量</TableHead>
                      <TableHead className="text-right">店铺数</TableHead>
                      <TableHead className="text-right">快递类型数</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dateStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      dateStats.map((stat) => (
                        <TableRow key={stat.output_date}>
                          <TableCell>{stat.output_date}</TableCell>
                          <TableCell className="text-right font-medium">
                            {stat.total_quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.shops_count}
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.couriers_count}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="shop">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>店铺</TableHead>
                      <TableHead className="text-right">总出力数量</TableHead>
                      <TableHead className="text-right">天数</TableHead>
                      <TableHead className="text-right">日均出力</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shopStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      shopStats.map((stat) => (
                        <TableRow key={stat.shop_id}>
                          <TableCell>{stat.shop_name}</TableCell>
                          <TableCell className="text-right font-medium">
                            {stat.total_quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.days_count}
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.days_count && stat.days_count > 0
                              ? (stat.total_quantity / stat.days_count).toFixed(2)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="courier">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>快递类型</TableHead>
                      <TableHead className="text-right">总出力数量</TableHead>
                      <TableHead className="text-right">店铺数</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courierStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      courierStats.map((stat) => (
                        <TableRow key={stat.courier_id}>
                          <TableCell>{stat.courier_name}</TableCell>
                          <TableCell className="text-right font-medium">
                            {stat.total_quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.shops_count}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 