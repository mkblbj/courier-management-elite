"use client";;
import { useTranslation } from "react-i18next";

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
import { createShopOutput, updateShopOutput, deleteShopOutput, subtractShopOutput, mergeShopOutput } from "@/lib/api/shop-output";
import { Loader2, Minus, Merge } from "lucide-react";
import { ShopOutput } from "@/lib/types/shop-output";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EditOutputModal from "./components/EditOutputModal";
import DeleteOutputModal from "./components/DeleteOutputModal";
import { isSameDay } from "date-fns";
import { dateToApiString, apiStringToDate } from "@/lib/date-utils";
import { API_BASE_URL, API_SUCCESS_CODE } from "@/lib/constants";
import { getBaseApiUrl } from "@/services/api";

// 获取API基础URL，支持代理情况
const getApiEndpoint = (path: string) => `${getBaseApiUrl()}/api${path}`;

export default function OutputDataPage() {
  const { t } = useTranslation();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedShopId, setSelectedShopId] = useState<number | undefined>(undefined);
  const [selectedCourierId, setSelectedCourierId] = useState<number | undefined>(undefined);
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [mergeNote, setMergeNote] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // 用于编辑和删除的状态
  const [editingOutput, setEditingOutput] = useState<ShopOutput | null>(null);
  const [deletingOutput, setDeletingOutput] = useState<ShopOutput | null>(null);

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
      const formattedDate = dateToApiString(selectedDate);

      await createShopOutput({
        shop_id: selectedShopId,
        courier_id: selectedCourierId,
        output_date: formattedDate,
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

  const handleEditOutput = async (output: ShopOutput) => {
    setEditingOutput(output);
    // 设置表单初始值将在编辑对话框组件中处理
  };

  const handleUpdateOutput = async (updatedOutput: ShopOutput) => {
    if (!updatedOutput.id) return;

    // 保存当前选中的日期，以便在更新后恢复
    const currentSelectedDate = selectedDate;

    setIsLoading(true);
    try {
      // 使用工具函数处理日期，确保按照应用时区格式化
      let formattedDate = '';

      // output_date在ShopOutput类型中被定义为string类型
      if (typeof updatedOutput.output_date === 'string' && updatedOutput.output_date) {
        // 先转换为日期对象，再格式化为API需要的格式
        const dateObj = apiStringToDate(updatedOutput.output_date);
        formattedDate = dateToApiString(dateObj);
      } else {
        // 使用当前选中的日期作为默认值
        formattedDate = dateToApiString(selectedDate);
        console.warn('无法识别的日期格式，使用当前选中日期');
      }

      // 提取原始记录中的必填字段
      const recordToUpdate = {
        shop_id: updatedOutput.shop_id,
        courier_id: updatedOutput.courier_id,
        output_date: formattedDate,
        quantity: Number(updatedOutput.quantity), // 确保是数字类型
        notes: updatedOutput.notes || undefined // 确保空字符串转为undefined
      };

      console.log('更新记录:', JSON.stringify(recordToUpdate, null, 2));

      // 发送所有必要的字段
      const response = await fetch(getApiEndpoint(`/shop-outputs/${updatedOutput.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordToUpdate),
      });

      if (!response.ok) {
        let errorText = `更新失败 (${response.status}): ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('API错误响应:', errorData);
          errorText = errorData.message || errorText;
        } catch (e) {
          console.error('解析错误响应失败:', e);
        }
        throw new Error(errorText);
      }

      const result = await response.json();

      if (result.code !== API_SUCCESS_CODE) {
        throw new Error(result.message || '更新出力数据失败');
      }

      // 更新刷新键，触发数据重新加载
      setRefreshKey(prev => prev + 1);
      setEditingOutput(null);

      // 始终恢复到更新前的日期，无需额外判断
      setSelectedDate(currentSelectedDate);

      toast({
        title: "更新成功",
        description: "出力数据已成功更新",
      });
    } catch (error) {
      console.error("更新出力记录失败:", error);
      toast({
        title: "更新失败",
        description: typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : "无法更新出力数据记录",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOutput = async (id: string | number) => {
    try {
      // 根据 ID 获取要删除的出力数据详情
      const response = await fetch(getApiEndpoint(`/shop-outputs/${id}`));
      if (!response.ok) {
        throw new Error(`获取出力数据详情失败: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.code !== API_SUCCESS_CODE) {
        throw new Error(result.message || '获取出力数据详情失败');
      }

      // 设置要删除的数据
      setDeletingOutput(result.data);
    } catch (error) {
      console.error("获取删除数据详情失败:", error);
      toast({
        title: "操作失败",
        description: "无法获取要删除的数据详情",
        variant: "destructive",
      });
    }
  };

  // 处理数据更新回调
  const handleDataUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!deletingOutput) return;

    // 保存当前选中的日期，以便在删除后恢复
    const currentSelectedDate = selectedDate;

    setIsLoading(true);
    try {
      await deleteShopOutput(Number(deletingOutput.id));

      setRefreshKey(prev => prev + 1);
      setDeletingOutput(null);

      // 始终恢复到删除前的日期
      setSelectedDate(currentSelectedDate);

      toast({
        title: "删除成功",
        description: "出力数据已成功删除",
      });
    } catch (error) {
      console.error("Failed to delete output record:", error);
      toast({
        title: "删除失败",
        description: "无法删除出力数据记录",
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

  const handleSubtractRecord = async () => {
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
      const formattedDate = dateToApiString(selectedDate);

      await subtractShopOutput({
        shop_id: selectedShopId,
        courier_id: selectedCourierId,
        output_date: formattedDate,
        quantity: parseInt(quantity),
        notes: notes || undefined,
      });

      setQuantity("");
      setNotes("");
      setRefreshKey(prev => prev + 1);

      toast({
        title: t("减少成功"),
        description: t("出力数据已成功减少"),
      });
    } catch (error) {
      console.error("Failed to subtract output record:", error);
      toast({
        title: t("减少失败"),
        description: typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : t("无法减少出力数据记录"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMergeRecord = async () => {
    if (!selectedDate || !selectedShopId || !selectedCourierId || !quantity || parseInt(quantity) <= 0) {
      toast({
        title: t("表单不完整"),
        description: t("请填写所有必要字段"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formattedDate = dateToApiString(selectedDate);

      await mergeShopOutput({
        shop_id: selectedShopId,
        courier_id: selectedCourierId,
        output_date: formattedDate,
        quantity: parseInt(quantity),
        merge_note: mergeNote || undefined,
      });

      setQuantity("");
      setNotes("");
      setMergeNote("");
      setRefreshKey(prev => prev + 1);

      toast({
        title: t("合单成功"),
        description: t("出力数据已成功合单"),
      });
    } catch (error) {
      console.error("Failed to merge output record:", error);
      toast({
        title: t("合单失败"),
        description: typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : t("无法合单出力数据记录"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    (<div className="min-h-screen bg-background">
      <DashboardHeader />
      <DashboardNav />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">{t("出力数据操作")}</h1>

        {/* 上半部分：录入表单和数据汇总左右排列 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 出力数据操作 - 占 1/3 宽度 */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-xl">{t("出力数据操作")}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <DateSelector
                        date={selectedDate}
                        onDateChange={(date) => date && setSelectedDate(date)}
                        showQuickButtons={true}
                        label={t("日期")}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <CategoryShopSelector
                        selectedShopId={selectedShopId}
                        onSelectShop={setSelectedShopId}
                        label={t("店铺选择")}
                        onlyActive={true}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <CourierSelector
                        selectedCourierId={selectedCourierId}
                        onSelectCourier={setSelectedCourierId}
                        label={t("快递类型")}
                        onlyActive={true}
                        className="w-full"
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <label className="flex items-center text-sm font-medium mb-2 text-blue-700">
                        <span className="mr-2 text-lg">📊</span>
                        {t("数量")}
                      </label>
                      <Input
                        type="number"
                        placeholder={t("请输入数量")}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        onKeyDown={handleKeyDown}
                        min="1"
                        className="w-full border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <label className="flex items-center text-sm font-medium mb-2 text-green-700">
                        <span className="mr-2 text-lg">📝</span>
                        {t("备注")}
                        <span className="ml-1 text-xs text-green-600">({t("可选")})</span>
                      </label>
                      <Textarea
                        placeholder={t("请输入备注（可选）")}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full h-10 min-h-10 resize-none border-green-300 focus:border-green-500 focus:ring-green-500"
                      />
                      <div className="mt-1.5 flex gap-2">
                        <div className="text-xs text-green-600">{t("快速选择")}:</div>
                        <button
                          type="button"
                          onClick={() => setNotes("再発送")}
                          className="text-xs text-green-600 hover:text-green-800 hover:underline font-medium"
                        >
                          再発送
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <label className="flex items-center text-sm font-medium mb-2 text-orange-700">
                        <span className="mr-2 text-lg">🔗</span>
                        {t("合单备注")}
                        <span className="ml-1 text-xs text-orange-600">({t("可选")})</span>
                      </label>
                      <Textarea
                        placeholder={t("合单操作时请输入备注")}
                        value={mergeNote}
                        onChange={(e) => setMergeNote(e.target.value)}
                        className="w-full h-10 min-h-10 resize-none border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                      <div className="mt-1 text-xs text-orange-600">
                        {t("仅在使用合单按钮时需要填写")}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    {/* 第一行：添加按钮独占 */}
                    <Button
                      onClick={handleAddRecord}
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                      disabled={isLoading}
                      size="default"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("添加中...")}</>
                      ) : t("添加记录")}
                    </Button>

                    {/* 第二行：减少和合单按钮 */}
                    <div className="flex gap-2">
                      {/* 减少按钮 - 占更多空间 */}
                      <Button
                        onClick={handleSubtractRecord}
                        className="bg-red-600 hover:bg-red-700 flex-[2]"
                        disabled={isLoading}
                        size="default"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          </>
                        ) : (
                          <>
                            <Minus className="mr-1 h-4 w-4" />{t("减少记录")}
                          </>
                        )}
                      </Button>

                      {/* 合单按钮 - 占较少空间 */}
                      <Button
                        onClick={handleMergeRecord}
                        className="bg-orange-600 hover:bg-orange-700 flex-[1]"
                        disabled={isLoading}
                        size="default"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          </>
                        ) : (
                          <>
                            <Merge className="mr-1 h-4 w-4" />{t("合单")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mt-2 text-right">{t("提示：按Enter键可快速提交添加表单")}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 当日数据汇总 - 占 2/3 宽度 */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="px-6 py-4">
                <CardTitle className="text-xl">{t("当日数据汇总")}</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <Suspense fallback={<ListSkeleton />}>
                  <OutputSummary
                    key={`summary-${refreshKey}`}
                    selectedDate={selectedDate}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 下半部分：最近录入数据 */}
        <Card className="mb-6">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-xl">{t("最近录入数据")}</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Suspense fallback={<ListSkeleton />}>
              <OutputList
                key={`list-${refreshKey}`}
                onEdit={handleEditOutput}
                onDelete={handleDeleteOutput}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onDataUpdate={handleDataUpdate}
              />
            </Suspense>
          </CardContent>
        </Card>
      </main>
      {/* 编辑出力数据对话框 */}
      <EditOutputModal
        output={editingOutput}
        open={!!editingOutput}
        onOpenChange={(open) => !open && setEditingOutput(null)}
        onSave={handleUpdateOutput}
        isLoading={isLoading}
      />
      {/* 删除确认对话框 */}
      <DeleteOutputModal
        output={deletingOutput}
        open={!!deletingOutput}
        onOpenChange={(open) => !open && setDeletingOutput(null)}
        onConfirm={confirmDelete}
        isLoading={isLoading}
      />
    </div>)
  );
}

function ListSkeleton() {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
} 