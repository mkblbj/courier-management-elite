"use client"

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

// 修改createBatchFormSchema函数，只为激活的快递类型创建表单字段
const createBatchFormSchema = (courierTypeIds: string[]) => {
  const schema: Record<string, z.ZodTypeAny> = {
    date: z.date({
      required_error: "请选择日期",
    }),
  }

  courierTypeIds.forEach((id) => {
    schema[`quantity_${id}`] = z
      .string()
      .default("")
      .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0 && Number.isInteger(Number(val))), {
        message: "请输入大于或等于0的整数",
      })
    schema[`remarks_${id}`] = z.string().default("")
  })

  return z.object(schema)
}

interface BatchEntryFormProps {
  onSubmit: (data: ShippingEntry[]) => Promise<void>
  isLoading: boolean
}

export function BatchEntryForm({ onSubmit, isLoading }: BatchEntryFormProps) {
  const { courierTypes, isLoading: isLoadingCourierTypes } = useCourierTypes()
  const [submitting, setSubmitting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // 修改formSchema创建，只为激活的快递类型创建schema
  const formSchema = createBatchFormSchema(
    courierTypes.filter((ct) => Boolean(ct.is_active)).map((ct) => ct.id.toString()),
  )

  // 修改createDefaultValues函数，只为激活的快递类型创建默认值
  const createDefaultValues = () => {
    const values: any = {
      date: new Date(),
    }

    courierTypes
      .filter((ct) => Boolean(ct.is_active))
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

  // 修改handleSubmit函数，只处理激活的快递类型
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true)
    try {
      const entries: ShippingEntry[] = []

      courierTypes
        .filter((ct) => Boolean(ct.is_active))
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
        throw new Error("请至少输入一条有效的发货记录")
      }

      await onSubmit(entries)

      // 重置表单，确保所有字段都有值
      const defaultValues = createDefaultValues()
      form.reset(defaultValues)
    } catch (error) {
      console.error("批量提交失败:", error)
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
    const defaultValues = createDefaultValues()
    form.reset(defaultValues)
    setShowResetConfirm(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">批量发货数据录入</CardTitle>
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
                      <FormLabel>选择日期（适用于所有记录）</FormLabel>
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
                              {field.value ? format(field.value, "yyyy-MM-dd") : <span>选择日期</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
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
                      <TableHead className="w-[200px]">快递类型</TableHead>
                      <TableHead className="w-[120px]">数量</TableHead>
                      <TableHead>备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courierTypes
                      .filter((courierType) => Boolean(courierType.is_active)) // 只显示激活的快递类型
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
                                      placeholder="可选备注"
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
                  className="transition-colors hover:bg-gray-100"
                >
                  重置
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || isLoading || isLoadingCourierTypes}
                  className="bg-blue-600 transition-colors hover:bg-blue-700"
                >
                  {submitting ? "提交中..." : "全部提交"}
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
            <AlertDialogTitle>确认重置表单</AlertDialogTitle>
            <AlertDialogDescription>您确定要重置表单吗？所有未保存的更改将会丢失。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset} className="bg-blue-600 transition-colors hover:bg-blue-700">
              确认重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
