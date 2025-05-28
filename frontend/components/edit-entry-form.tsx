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
import type { ShippingEntry } from "@/hooks/use-shipping-data"
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

interface EditEntryFormProps {
      onSubmit: (data: ShippingEntry) => Promise<void>
      isLoading: boolean
      initialData: ShippingEntry
      onCancel?: () => void
}

export function EditEntryForm({ onSubmit, isLoading, initialData, onCancel }: EditEntryFormProps) {
      const { t } = useTranslation();
      const { courierTypes, isLoading: isLoadingCourierTypes } = useCourierTypes()
      const [submitting, setSubmitting] = useState(false)

      const form = useForm<z.infer<typeof formSchema>>({
            resolver: zodResolver(formSchema),
            defaultValues: {
                  date: new Date(initialData.date),
                  courierTypeId: initialData.courierTypeId?.toString() || "",
                  quantity: initialData.quantity?.toString() || "",
                  remarks: initialData.remarks || "",
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

                  await onSubmit({
                        id: initialData.id,
                        date: values.date.toISOString(),
                        courierTypeId: values.courierTypeId,
                        courierTypeName: courierType?.name || "",
                        quantity: Number.parseInt(values.quantity),
                        remarks: values.remarks || "",
                  })

                  toast({
                        title: t("更新成功"),
                        description: t("发货记录已成功更新"),
                        variant: "default",
                  })
            } catch (error) {
                  console.error("更新失败:", error)
                  if (error instanceof Error) {
                        toast({
                              title: t("更新失败"),
                              description: error.message,
                              variant: "destructive",
                        })
                  }
                  throw error
            } finally {
                  setSubmitting(false)
            }
      }

      return (
            <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                                                                              "w-full pl-3 text-left font-normal h-9",
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
                                                            <SelectTrigger className="h-9">
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

                        <FormField
                              control={form.control}
                              name="quantity"
                              render={({ field }) => (
                                    <FormItem>
                                          <FormLabel className="text-sm font-medium">{t("数量")}</FormLabel>
                                          <FormControl>
                                                <div className="relative">
                                                      <Input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            placeholder={t("输入发货数量")}
                                                            className="h-9 pr-12"
                                                            {...field}
                                                      />
                                                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                                            {t("件")}
                                                      </div>
                                                </div>
                                          </FormControl>
                                          <FormDescription className="text-xs text-gray-500">{t("请输入大于0的整数")}</FormDescription>
                                          <FormMessage />
                                    </FormItem>
                              )}
                        />

                        <FormField
                              control={form.control}
                              name="remarks"
                              render={({ field }) => (
                                    <FormItem>
                                          <FormLabel className="text-sm font-medium">{t("备注")}</FormLabel>
                                          <FormControl>
                                                <Textarea
                                                      placeholder={t("可选备注信息")}
                                                      className="resize-none min-h-[60px]"
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

                        <div className="flex justify-end gap-2 pt-4">
                              {onCancel && (
                                    <Button
                                          type="button"
                                          variant="outline"
                                          onClick={onCancel}
                                          disabled={submitting || isLoading}
                                          className="min-w-[80px]"
                                    >
                                          {t("取消")}
                                    </Button>
                              )}
                              <Button
                                    type="submit"
                                    disabled={submitting || isLoading}
                                    className="bg-blue-600 transition-colors hover:bg-blue-700 min-w-[80px]"
                              >
                                    {submitting ? t("更新中...") : t("更新")}
                              </Button>
                        </div>
                  </form>
            </Form>
      );
} 