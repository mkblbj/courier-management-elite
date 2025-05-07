"use client";

import { Suspense, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateSelector } from "@/components/shop-output/DateSelector";
import OutputList from "./components/OutputList";
import OutputSummary from "./components/OutputSummary";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default function OutputDataPage() {
  const [shopId, setShopId] = useState<string>("");
  const [courierId, setCourierId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleAddRecord = () => {
    // 实现添加记录逻辑
    console.log("添加记录", { shopId, courierId, quantity, notes });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNav />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">出力数据</h1>

        {/* 数据录入表单区域 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* 第一行：日期选择 */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-full md:w-auto">
                  <label className="block text-sm font-medium mb-1">日期</label>
                  <DateSelector
                    date={new Date()}
                    onDateChange={() => { }}
                    showQuickButtons={true}
                    className="w-full md:w-64"
                  />
                </div>
              </div>

              {/* 第二行：店铺和快递选择 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">店铺</label>
                  <Select value={shopId} onValueChange={setShopId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择店铺" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">测试店铺1</SelectItem>
                      <SelectItem value="2">测试店铺2</SelectItem>
                      <SelectItem value="3">测试店铺3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">快递</label>
                  <Select value={courierId} onValueChange={setCourierId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择快递" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">顺丰速运</SelectItem>
                      <SelectItem value="2">圆通快递</SelectItem>
                      <SelectItem value="3">中通快递</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 第三行：数量和备注 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">数量</label>
                  <Input
                    type="number"
                    placeholder="请输入数量"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">备注</label>
                  <Textarea
                    placeholder="请输入备注（可选）"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-10 min-h-10 resize-none"
                  />
                </div>
              </div>

              {/* 第四行：添加按钮 */}
              <div className="flex justify-end">
                <Button
                  onClick={handleAddRecord}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  添加记录
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 下部区域容器 - 响应式布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 最近录入数据区域 */}
          <Card className="lg:col-span-1">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-xl">最近录入数据</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Suspense fallback={<ListSkeleton />}>
                <OutputList />
              </Suspense>
            </CardContent>
          </Card>

          {/* 当日数据汇总区域 */}
          <Card className="lg:col-span-1">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-xl">当日数据汇总</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Suspense fallback={<ListSkeleton />}>
                <OutputSummary />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
} 