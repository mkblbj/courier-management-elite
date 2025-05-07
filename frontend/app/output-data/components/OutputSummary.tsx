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

interface OutputSummaryProps {
  selectedDate?: Date;
}

export default function OutputSummary({ selectedDate }: OutputSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayOutputs, setTodayOutputs] = useState<ShopOutput[]>([]);

  // 使用选择的日期或当天日期
  const dateToUse = selectedDate ? format(selectedDate, DATE_FORMAT) : format(new Date(), DATE_FORMAT);

  useEffect(() => {
    fetchTodayData();
  }, [selectedDate]);

  const fetchTodayData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 获取选定日期的出力数据
      const data = await getShopOutputs({ date_from: dateToUse, date_to: dateToUse });
      setTodayOutputs(data);
    } catch (err) {
      console.error("Failed to fetch today's outputs:", err);
      setError("获取出力数据失败，请重试");
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

  // 这里仅创建组件框架，数据获取和处理逻辑将在后续故事中实现
  const mockSummary = [
    {
      category_name: "乐天",
      shop_name: "测试店铺1",
      courier_name: "顺丰速运",
      quantity: 50,
    },
    {
      category_name: "乐天",
      shop_name: "测试店铺2",
      courier_name: "顺丰速运",
      quantity: 35,
    },
    {
      category_name: "亚马逊",
      shop_name: "测试店铺3",
      courier_name: "圆通快递",
      quantity: 60,
    },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '今日'}数据汇总</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : todayOutputs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '今日'}暂无数据
          </div>
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