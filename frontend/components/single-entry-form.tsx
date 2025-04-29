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

export function SingleEntryForm({ onSubmit, isLoading, initialData }: SingleEntryFormProps) {
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
      const courierType = courierTypes.find((ct) => ct.id.toString() === values.courierTypeId)
      if (!courierType) throw new Error(t("快递类型不存在"))

      await onSubmit({
        id: initialData?.id || Date.now().toString(),
        date: values.date.toISOString(),
        courierTypeId: values.courierTypeId,
        courierTypeName: courierType.name,
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
      }
    } catch (error) {
      console.error("提交失败:", error)
      // 不需要在这里处理错误显示，错误已在useShippingData的hook中显示
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
    })
    setShowResetConfirm(false)
  }

  return (<>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{t("单条发货数据录入")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("日期")}</FormLabel>
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
                              {field.value ? format(field.value, "yyyy-MM-dd") : <span>{t("选择日期")}</span>}
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
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("数量")}</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" step="1" placeholder={t("输入发货数量")} {...field} />
                      </FormControl>
                      <FormDescription>{t("请输入大于0的整数")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="courierTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("快递类型")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingCourierTypes}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("选择快递类型")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courierTypes
                            .filter((courierType) => Boolean(courierType.is_active)) // 只显示激活的快递类型
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

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("备注")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("可选备注信息")}
                          className="resize-none"
                          value={field.value || ""}
                          onChange={field.onChange}
                          maxLength={200}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={submitting || isLoading}
                className="transition-colors hover:bg-gray-100"
              >{t("重置")}</Button>
              <Button
                type="submit"
                disabled={submitting || isLoading}
                className="bg-blue-600 transition-colors hover:bg-blue-700"
              >
                {submitting ? "提交中..." : "提交"}
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
