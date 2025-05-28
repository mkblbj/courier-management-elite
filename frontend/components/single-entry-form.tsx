/*
 * 注意：此组件已暂时停用 (2024-01-XX)
 * 原因：现在不再使用单条录入功能
 * 保留代码以备将来可能重新启用
 * 如需重新启用，请取消注释下面的代码
 */

"use client";
import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCourierTypes } from "@/hooks/use-courier-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ShippingEntry } from "@/hooks/use-shipping-data"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  date: z.date({
    required_error: "请选择日期",
  }),
  courierTypeId: z.string({
    required_error: "请选择快递类型",
  }),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number.isInteger(Number(val)), {
    message: "请输入大于0的整数",
  }),
  remarks: z.string().optional(),
})

interface SingleEntryFormProps {
  onSubmit: (data: ShippingEntry) => Promise<void>
  isLoading: boolean
  initialData?: ShippingEntry
}

// export function SingleEntryForm({ onSubmit, isLoading, initialData }: SingleEntryFormProps) {
function SingleEntryForm({ onSubmit, isLoading, initialData }: SingleEntryFormProps) {
  const { t } = useTranslation();

  const { courierTypes, isLoading: isLoadingCourierTypes } = useCourierTypes()
  const [submitting, setSubmitting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData ? new Date(initialData.date) : new Date(),
      courierTypeId: initialData?.courierTypeId?.toString() || "",
      quantity: initialData?.quantity?.toString() || "",
      remarks: initialData?.remarks || "",
    },
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true)
    try {
      if (!values.courierTypeId) {
        toast({
          title: t("提交失败"),
          description: t("请选择快递类型"),
          variant: "destructive",
        })
        return;
      }

      const courierType = courierTypes.find((ct) => ct.id.toString() === values.courierTypeId)

      const result = await onSubmit({
        id: initialData?.id || Date.now().toString(),
        date: values.date.toISOString(),
        courierTypeId: values.courierTypeId,
        courierTypeName: courierType?.name || "",
        quantity: Number.parseInt(values.quantity),
        remarks: values.remarks || "",
      })

      if (!initialData) {
        form.reset({
          date: new Date(),
          courierTypeId: "",
          quantity: "",
          remarks: "",
        })

        // 显示成功提示
        toast({
          title: t("提交成功"),
          description: t("发货记录已成功录入"),
          variant: "default",
        })
      }

      return result
    } catch (error) {
      console.error("提交失败:", error)
      // 在这里显示错误提示，而不仅仅依赖于 useShippingData hook
      if (error instanceof Error) {
        toast({
          title: t("提交失败"),
          description: error.message,
          variant: "destructive",
        })
      }
      throw error // 继续抛出错误，让上层组件也能处理
    } finally {
      setSubmitting(false)
    }
  }

  // Handle form reset with confirmation
  const handleReset = () => {
    setShowResetConfirm(true)
  }

  // Confirm reset action
  const confirmReset = () => {
    form.reset({
      date: initialData ? new Date(initialData.date) : new Date(),
      courierTypeId: initialData?.courierTypeId?.toString() || "",
      quantity: initialData?.quantity?.toString() || "",
      remarks: initialData?.remarks || "",
    });

    setTimeout(() => {
      form.trigger();
    }, 0);

    setShowResetConfirm(false);
  }

  return (<>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{t("单条发货数据录入")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-6">
              {/* 基础信息区域 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2">{t("基础信息")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t("日期")}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal h-10",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  <>
                                    {format(field.value, "yyyy-MM-dd")}
                                    <span className="ml-2 text-xs text-gray-500">
                                      {t(`weekday.full.${format(field.value, 'EEEE').toLowerCase()}`)}
                                    </span>
                                  </>
                                ) : <span>{t("选择日期")}</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const today = new Date();
                                const twoDaysLater = new Date();
                                twoDaysLater.setDate(today.getDate() + 2);
                                return date > twoDaysLater || date < new Date("2000-01-01");
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="courierTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t("快递类型")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoadingCourierTypes}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder={t("选择快递类型")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courierTypes
                              .filter((courierType) => Boolean(courierType.is_active))
                              .filter((courierType) => !courierType.name.includes(t("未指定")))
                              .map((courierType) => (
                                <SelectItem key={courierType.id} value={courierType.id.toString()}>
                                  {courierType.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 数量信息区域 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2">{t("数量信息")}</h3>
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">{t("数量")}</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="relative">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder={t("输入发货数量")}
                              className="h-10 pr-12"
                              {...field}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                              {t("件")}
                            </div>
                          </div>
                          {/* 快速数量选择 */}
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-xs text-gray-500 self-center">{t("快速选择")}:</span>
                            {[10, 20, 50, 100].map((num) => (
                              <Button
                                key={num}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={() => field.onChange(num.toString())}
                              >
                                {num}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">{t("请输入大于0的整数")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 备注信息区域 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2">{t("备注信息")}</h3>
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">{t("备注")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("可选备注信息")}
                          className="resize-none min-h-[80px]"
                          value={field.value || ""}
                          onChange={field.onChange}
                          maxLength={200}
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{t("选填项目")}</span>
                        <span>{(field.value || "").length}/200</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
              <div className="text-xs text-gray-500 order-2 sm:order-1">
                {t("提交后将自动清空表单，方便连续录入")}
              </div>
              <div className="flex gap-2 order-1 sm:order-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={submitting || isLoading}
                  className="transition-colors hover:bg-muted dark:hover:bg-gray-700/50 min-w-[80px]"
                >{t("重置")}</Button>
                <Button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="bg-blue-600 transition-colors hover:bg-blue-700 min-w-[80px]"
                >
                  {submitting ? t("提交中...") : t("提交")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
    {/* Reset Confirmation Dialog */}
    <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
      <AlertDialogContent className="animate-scale-in">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("确认重置表单")}</AlertDialogTitle>
          <AlertDialogDescription>{t("您确定要重置表单吗？所有未保存的更改将会丢失。")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
          <AlertDialogAction onClick={confirmReset} className="bg-blue-600 transition-colors hover:bg-blue-700">{t("确认重置")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>);
}
