"use client";

import { Suspense, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateSelector } from "@/components/shop-output/DateSelector";
import { CategoryShopSelector } from "@/components/shop-output/CategoryShopSelector";
import { CourierSelector } from "@/components/shop-output/CourierSelector";
import OutputList from "./components/OutputList";
import OutputSummary from "./components/OutputSummary";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { toast } from "@/components/ui/use-toast";
import { createShopOutput } from "@/lib/api/shop-output";
import { Loader2 } from "lucide-react";

export default function OutputDataPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedShopId, setSelectedShopId] = useState<number | undefined>(undefined);
  const [selectedCourierId, setSelectedCourierId] = useState<number | undefined>(undefined);
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleAddRecord = async () => {
    if (!selectedDate || !selectedShopId || !selectedCourierId || !quantity || parseInt(quantity) <= 0) {
      toast({
        title: "表单不完整",
        description: "请填写所有必要字段",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createShopOutput({
        shop_id: selectedShopId,
        courier_id: selectedCourierId,
        output_date: selectedDate.toISOString().split('T')[0],
        quantity: parseInt(quantity),
        notes: notes || undefined,
      });

      setQuantity("");
      setNotes("");

      setRefreshKey(prev => prev + 1);

      toast({
        title: "添加成功",
        description: "出力数据已成功添加",
      });
    } catch (error) {
      console.error("Failed to add output record:", error);
      toast({
        title: "添加失败",
        description: "无法添加出力数据记录",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
      const activeElement = document.activeElement;
      const isTextarea = activeElement instanceof HTMLTextAreaElement;

      if (!isTextarea || !activeElement?.textContent?.includes('\n')) {
        e.preventDefault();
        handleAddRecord();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNav />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">出力数据</h1>

        <Card className="mb-6">
          <CardHeader className="px-6 py-4 border-b">
            <CardTitle className="text-xl">录入出力数据</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <DateSelector
                    date={selectedDate}
                    onDateChange={(date) => date && setSelectedDate(date)}
                    showQuickButtons={true}
                    label="日期"
                    className="w-full"
                  />
                </div>
                <div>
                  <CategoryShopSelector
                    selectedShopId={selectedShopId}
                    onSelectShop={setSelectedShopId}
                    label="店铺选择"
                    onlyActive={true}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CourierSelector
                    selectedCourierId={selectedCourierId}
                    onSelectCourier={setSelectedCourierId}
                    label="快递类型"
                    onlyActive={true}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">数量</label>
                  <Input
                    type="number"
                    placeholder="请输入数量"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onKeyDown={handleKeyDown}
                    min="1"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
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

              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleAddRecord}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      添加中...
                    </>
                  ) : "添加记录"}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground mt-2 text-right">
                提示：按Enter键可快速提交表单
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="lg:col-span-1">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-xl">最近录入数据</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Suspense fallback={<ListSkeleton />}>
                <OutputList selectedDate={selectedDate} key={`list-${refreshKey}`} />
              </Suspense>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-xl">当日数据汇总</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Suspense fallback={<ListSkeleton />}>
                <OutputSummary selectedDate={selectedDate} key={`summary-${refreshKey}`} />
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