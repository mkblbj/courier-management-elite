"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getShopOutputs } from "@/lib/api/shop-output";
import { ShopOutput } from "@/lib/types/shop-output";
import { DATE_FORMAT } from "@/lib/constants";

export default function OutputSummary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayOutputs, setTodayOutputs] = useState<ShopOutput[]>([]);
  
  // 计算今天的日期
  const today = format(new Date(), DATE_FORMAT);

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 获取今日的出力数据
      const data = await getShopOutputs({ date_from: today, date_to: today });
      setTodayOutputs(data);
    } catch (err) {
      console.error("Failed to fetch today's outputs:", err);
      setError("获取今日出力数据失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 按店铺和快递类型分组汇总数据
  const summaryData = todayOutputs.reduce((acc, item) => {
    const key = `${item.shop_id}-${item.courier_id}`;
    
    if (!acc[key]) {
      acc[key] = {
        shop_id: item.shop_id,
        shop_name: item.shop_name,
        courier_id: item.courier_id,
        courier_name: item.courier_name,
        total_quantity: 0
      };
    }
    
    acc[key].total_quantity += item.quantity;
    return acc;
  }, {} as Record<string, {
    shop_id: number;
    shop_name: string;
    courier_id: number;
    courier_name: string;
    total_quantity: number;
  }>);

  // 转换为数组便于渲染
  const summaryArray = Object.values(summaryData);

  // 计算总出力量
  const totalQuantity = summaryArray.reduce((sum, item) => sum + item.total_quantity, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>当日数据汇总</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : todayOutputs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">今日暂无数据</div>
        ) : (
          <div>
            <div className="text-xl font-medium mb-4">
              总出力量：{totalQuantity}
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>店铺</TableHead>
                    <TableHead>快递类型</TableHead>
                    <TableHead className="text-right">出力数量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryArray.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.shop_name}</TableCell>
                      <TableCell>{item.courier_name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.total_quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 