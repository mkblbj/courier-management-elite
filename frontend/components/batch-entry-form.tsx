/*
 * 注意：此组件已暂时停用 (2024-01-XX)
 * 原因：现在不再使用批量录入功能
 * 保留代码以备将来可能重新启用
 * 如需重新启用，请取消注释下面的代码和相关导出
 */

"use client";
import { useTranslation } from "react-i18next";

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCourierTypes } from "@/hooks/use-courier-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ShippingEntry } from "@/hooks/use-shipping-data"
import { toast } from "@/components/ui/use-toast"
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

// 修改createBatchFormSchema函数，使用传入的t函数而不是在函数内部调用useTranslation
const createBatchFormSchema = (courierTypeIds: string[], t: (key: string) => string) => {
  const schema: Record<string, z.ZodTypeAny> = {
    date: z.date({
      required_error: t("请选择日期"),
    }),
  }

  courierTypeIds.forEach((id) => {
    schema[`quantity_${id}`] = z
      .string()
      .default("")
      .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0 && Number.isInteger(Number(val))), {
        message: t("请输入大于或等于0的整数"),
      })
    schema[`remarks_${id}`] = z.string().default("")
  })

  return z.object(schema)
}

interface BatchEntryFormProps {
  onSubmit: (data: ShippingEntry[]) => Promise<void>
  isLoading: boolean
}

// 暂时注释掉导出，保留代码以备将来使用
// export function BatchEntryForm({ onSubmit, isLoading }: BatchEntryFormProps) {
function BatchEntryForm({ onSubmit, isLoading }: BatchEntryFormProps) {
  const { t } = useTranslation();

  const { courierTypes, isLoading: isLoadingCourierTypes } = useCourierTypes()
  const [submitting, setSubmitting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // 修改formSchema创建，传入t函数
  const formSchema = createBatchFormSchema(
    courierTypes
      .filter((ct) => Boolean(ct.is_active))
      .filter((ct) => !ct.name.includes(t("未指定"))) // 过滤掉未指定的快递类型
      .map((ct) => ct.id.toString()),
    t
  )

  // 修改createDefaultValues函数，使用外部的t函数
  const createDefaultValues = () => {
    const values: any = {
      date: new Date(),
    }

    courierTypes
      .filter((ct) => Boolean(ct.is_active))
      .filter((ct) => !ct.name.includes("未指定")) // 过滤掉未指定的快递类型
      .forEach((ct) => {
        values[`quantity_${ct.id}`] = ""
        values[`remarks_${ct.id}`] = ""
      })

    return values
  }

  const defaultValues = createDefaultValues()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: createDefaultValues(),
  })

  // 修改handleSubmit函数，使用外部的t函数
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true)
    try {
      const entries: ShippingEntry[] = []

      courierTypes
        .filter((ct) => Boolean(ct.is_active))
        .filter((ct) => !ct.name.includes("未指定")) // 过滤掉未指定的快递类型
        .forEach((courierType) => {
          const id = courierType.id.toString()
          const quantity = values[`quantity_${id}` as keyof typeof values] as string

          // 只添加有数量的记录
          if (quantity && Number.parseInt(quantity) > 0) {
            entries.push({
              id: Date.now() + Math.random().toString(36).substring(2, 9),
              date: values.date.toISOString(),
              courierTypeId: id,
              courierTypeName: courierType.name,
              quantity: Number.parseInt(quantity),
              remarks: (values[`remarks_${id}` as keyof typeof values] as string) || "",
            })
          }
        })

      if (entries.length === 0) {
        throw new Error(t("请至少输入一条有效的发货记录"))
      }

      await onSubmit(entries)

      // 重置表单，确保所有字段都有值
      const defaultValues = createDefaultValues()
      form.reset(defaultValues)
    } catch (error) {
      console.error("批量提交失败:", error)
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
    const defaultValues = createDefaultValues()
    form.reset(defaultValues)
    setShowResetConfirm(false)
  }

  return (<>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{t("批量发货数据录入")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="mb-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col max-w-[240px]">
                    <FormLabel>{t("选择日期（适用于所有记录）")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              <>
                                {format(field.value, "yyyy-MM-dd")}
                                <span className="ml-1 text-gray-500">
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
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">{t("快递类型")}</TableHead>
                    <TableHead className="w-[120px]">{t("数量")}</TableHead>
                    <TableHead>{t("备注")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courierTypes
                    .filter((courierType) => Boolean(courierType.is_active)) // 只显示激活的快递类型
                    .filter((courierType) => !courierType.name.includes("未指定")) // 过滤掉未指定的快递类型
                    .map((courierType) => (
                      <TableRow key={courierType.id}>
                        <TableCell className="font-medium">{courierType.name}</TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`quantity_${courierType.id}` as any}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="0"
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    className="w-24"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`remarks_${courierType.id}` as any}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Textarea
                                    placeholder={t("可选备注")}
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    maxLength={200}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={submitting || isLoading}
                className="transition-colors hover:bg-muted dark:hover:bg-gray-700/50"
              >{t("重置")}</Button>
              <Button
                type="submit"
                disabled={submitting || isLoading || isLoadingCourierTypes}
                className="bg-blue-600 transition-colors hover:bg-blue-700"
              >
                {submitting ? t("提交中...") : t("全部提交")}
              </Button>
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
