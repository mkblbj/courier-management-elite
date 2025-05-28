"use client";
import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus, Minus, Package, Clock } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const createUnifiedFormSchema = (courierTypeIds: string[], t: (key: string) => string) => {
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

interface UnifiedEntryFormProps {
      onSubmit: (data: ShippingEntry[]) => Promise<void>
      isLoading: boolean
}

export function UnifiedEntryForm({ onSubmit, isLoading }: UnifiedEntryFormProps) {
      const { t } = useTranslation();
      const { courierTypes, isLoading: isLoadingCourierTypes } = useCourierTypes()
      const [submitting, setSubmitting] = useState(false)
      const [showResetConfirm, setShowResetConfirm] = useState(false)
      const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
      const [hasData, setHasData] = useState(false)

      // 过滤活跃的快递类型
      const activeCourierTypes = courierTypes
            .filter((ct) => Boolean(ct.is_active))
            .filter((ct) => !ct.name.includes(t("未指定")))

      const formSchema = createUnifiedFormSchema(
            activeCourierTypes.map((ct) => ct.id.toString()),
            t
      )

      const createDefaultValues = () => {
            const values: any = {
                  date: new Date(),
            }

            activeCourierTypes.forEach((ct) => {
                  values[`quantity_${ct.id}`] = ""
                  values[`remarks_${ct.id}`] = ""
            })

            return values
      }

      const form = useForm<z.infer<typeof formSchema>>({
            resolver: zodResolver(formSchema),
            defaultValues: createDefaultValues(),
      })

      // 监听表单变化，检查是否有数据
      useEffect(() => {
            const subscription = form.watch((values) => {
                  const hasAnyData = activeCourierTypes.some((ct) => {
                        const quantity = values[`quantity_${ct.id}`]
                        return quantity && Number.parseInt(quantity) > 0
                  })
                  setHasData(hasAnyData)
            })
            return () => subscription.unsubscribe()
      }, [form, activeCourierTypes])

      const handleSubmit = async (values: z.infer<typeof formSchema>) => {
            setSubmitting(true)
            try {
                  const entries: ShippingEntry[] = []

                  activeCourierTypes.forEach((courierType) => {
                        const id = courierType.id.toString()
                        const quantity = values[`quantity_${id}` as keyof typeof values] as string

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

                  // 重置表单
                  const defaultValues = createDefaultValues()
                  form.reset(defaultValues)
                  setExpandedRows(new Set())

                  // 显示成功提示
                  toast({
                        title: t("提交成功"),
                        description: t(`已成功录入 ${entries.length} 条发货记录`),
                        variant: "default",
                  })
            } catch (error) {
                  console.error("提交失败:", error)
                  if (error instanceof Error) {
                        toast({
                              title: t("提交失败"),
                              description: error.message,
                              variant: "destructive",
                        })
                  }
                  throw error
            } finally {
                  setSubmitting(false)
            }
      }

      const handleReset = () => {
            setShowResetConfirm(true)
      }

      const confirmReset = () => {
            const defaultValues = createDefaultValues()
            form.reset(defaultValues)
            setExpandedRows(new Set())
            setShowResetConfirm(false)
      }

      const toggleRowExpansion = (courierTypeId: string) => {
            const newExpanded = new Set(expandedRows)
            if (newExpanded.has(courierTypeId)) {
                  newExpanded.delete(courierTypeId)
            } else {
                  newExpanded.add(courierTypeId)
            }
            setExpandedRows(newExpanded)
      }

      const getFilledCount = () => {
            return activeCourierTypes.filter((ct) => {
                  const quantity = form.watch(`quantity_${ct.id}`)
                  return quantity && Number.parseInt(quantity) > 0
            }).length
      }

      const getTotalQuantity = () => {
            return activeCourierTypes.reduce((total, ct) => {
                  const quantity = form.watch(`quantity_${ct.id}`)
                  return total + (quantity ? Number.parseInt(quantity) : 0)
            }, 0)
      }

      return (<>
            <Card>
                  <CardHeader>
                        <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                                          <Package className="h-5 w-5 text-blue-600" />
                                          {t("每日发货数据录入")}
                                    </CardTitle>
                                    <p className="text-sm text-gray-500">
                                          {t("一次性录入当日所有快递类型的发货数量")}
                                    </p>
                              </div>
                              {hasData && (
                                    <div className="flex gap-2">
                                          <Badge variant="secondary" className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {getFilledCount()}/{activeCourierTypes.length} {t("已填写")}
                                          </Badge>
                                          <Badge variant="outline" className="flex items-center gap-1">
                                                <Package className="h-3 w-3" />
                                                {getTotalQuantity()} {t("总件数")}
                                          </Badge>
                                    </div>
                              )}
                        </div>
                  </CardHeader>
                  <CardContent>
                        <Form {...form}>
                              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                                    {/* 日期选择 */}
                                    <div className="space-y-4">
                                          <h3 className="text-sm font-medium text-gray-700 border-b pb-2">{t("基础信息")}</h3>
                                          <FormField
                                                control={form.control}
                                                name="date"
                                                render={({ field }) => (
                                                      <FormItem className="flex flex-col">
                                                            <FormLabel className="text-sm font-medium">{t("录入日期")}</FormLabel>
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
                                    </div>

                                    <Separator />

                                    {/* 快递类型录入表格 */}
                                    <div className="space-y-4">
                                          <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-gray-700">{t("快递类型数量录入")}</h3>
                                                <div className="text-xs text-gray-500">
                                                      {t("只需填写有发货的快递类型，留空表示当日无发货")}
                                                </div>
                                          </div>

                                          <div className="border rounded-md">
                                                <Table>
                                                      <TableHeader>
                                                            <TableRow>
                                                                  <TableHead className="min-w-0 flex-1">{t("快递类型")}</TableHead>
                                                                  <TableHead className="w-[80px] text-center">{t("数量")}</TableHead>
                                                                  <TableHead className="w-[50px] text-center">{t("备注")}</TableHead>
                                                            </TableRow>
                                                      </TableHeader>
                                                      <TableBody>
                                                            {activeCourierTypes.map((courierType) => {
                                                                  const isExpanded = expandedRows.has(courierType.id.toString())
                                                                  const hasQuantity = form.watch(`quantity_${courierType.id}`)

                                                                  return (
                                                                        <TableRow
                                                                              key={courierType.id}
                                                                              className={cn(
                                                                                    "transition-colors",
                                                                                    hasQuantity && Number.parseInt(hasQuantity) > 0 && "bg-blue-50/50"
                                                                              )}
                                                                        >
                                                                              <TableCell className="font-medium min-w-0">
                                                                                    <div className="flex flex-col gap-1">
                                                                                          <span className="text-sm truncate">{courierType.name}</span>
                                                                                          {hasQuantity && Number.parseInt(hasQuantity) > 0 && (
                                                                                                <Badge variant="secondary" className="text-xs w-fit">
                                                                                                      {hasQuantity} {t("件")}
                                                                                                </Badge>
                                                                                          )}
                                                                                    </div>
                                                                              </TableCell>
                                                                              <TableCell className="text-center">
                                                                                    <FormField
                                                                                          control={form.control}
                                                                                          name={`quantity_${courierType.id}` as any}
                                                                                          render={({ field }) => (
                                                                                                <FormItem className="space-y-0">
                                                                                                      <FormControl>
                                                                                                            <div className="relative">
                                                                                                                  <Input
                                                                                                                        type="number"
                                                                                                                        min="0"
                                                                                                                        step="1"
                                                                                                                        placeholder="0"
                                                                                                                        value={field.value || ""}
                                                                                                                        onChange={field.onChange}
                                                                                                                        className="w-16 text-center text-sm"
                                                                                                                  />
                                                                                                            </div>
                                                                                                      </FormControl>
                                                                                                      <FormMessage />
                                                                                                </FormItem>
                                                                                          )}
                                                                                    />
                                                                              </TableCell>
                                                                              <TableCell className="text-center">
                                                                                    <Button
                                                                                          type="button"
                                                                                          variant="ghost"
                                                                                          size="sm"
                                                                                          onClick={() => toggleRowExpansion(courierType.id.toString())}
                                                                                          className="h-7 w-7 p-0"
                                                                                    >
                                                                                          {isExpanded ? (
                                                                                                <Minus className="h-3 w-3" />
                                                                                          ) : (
                                                                                                <Plus className="h-3 w-3" />
                                                                                          )}
                                                                                    </Button>
                                                                              </TableCell>
                                                                        </TableRow>
                                                                  )
                                                            })}
                                                      </TableBody>
                                                </Table>
                                          </div>

                                          {/* 展开的备注区域 */}
                                          {Array.from(expandedRows).map((courierTypeId) => {
                                                const courierType = activeCourierTypes.find(ct => ct.id.toString() === courierTypeId)
                                                if (!courierType) return null

                                                return (
                                                      <div key={`remarks-${courierTypeId}`} className="border rounded-md p-4 bg-gray-50">
                                                            <div className="space-y-3">
                                                                  <div className="flex items-center gap-2">
                                                                        <Package className="h-4 w-4 text-gray-500" />
                                                                        <span className="font-medium text-sm">{courierType.name} - {t("备注信息")}</span>
                                                                  </div>
                                                                  <FormField
                                                                        control={form.control}
                                                                        name={`remarks_${courierTypeId}` as any}
                                                                        render={({ field }) => (
                                                                              <FormItem>
                                                                                    <FormControl>
                                                                                          <Textarea
                                                                                                placeholder={t("可选备注信息...")}
                                                                                                value={field.value || ""}
                                                                                                onChange={field.onChange}
                                                                                                maxLength={200}
                                                                                                className="min-h-[80px] resize-none"
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
                                                )
                                          })}
                                    </div>

                                    {/* 提交按钮区域 */}
                                    <div className="space-y-3 pt-4 border-t">
                                          <div className="text-xs text-gray-500 text-center">
                                                {hasData
                                                      ? t(`已填写 ${getFilledCount()} 种，共 ${getTotalQuantity()} 件`)
                                                      : t("填写数量后将自动统计")
                                                }
                                          </div>
                                          <div className="flex gap-2 justify-center">
                                                <Button
                                                      type="button"
                                                      variant="outline"
                                                      onClick={handleReset}
                                                      disabled={submitting || isLoading}
                                                      className="transition-colors hover:bg-muted dark:hover:bg-gray-700/50 flex-1"
                                                >
                                                      {t("重置")}
                                                </Button>
                                                <Button
                                                      type="submit"
                                                      disabled={submitting || isLoading || isLoadingCourierTypes || !hasData}
                                                      className="bg-blue-600 transition-colors hover:bg-blue-700 flex-1"
                                                >
                                                      {submitting ? t("提交中...") : t("提交录入")}
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
                              <AlertDialogDescription>
                                    {t("您确定要重置表单吗？所有未保存的更改将会丢失。")}
                              </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                              <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
                              <AlertDialogAction
                                    onClick={confirmReset}
                                    className="bg-blue-600 transition-colors hover:bg-blue-700"
                              >
                                    {t("确认重置")}
                              </AlertDialogAction>
                        </AlertDialogFooter>
                  </AlertDialogContent>
            </AlertDialog>
      </>);
} 