"use client";;
import { useTranslation } from "react-i18next";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShopOutput } from "@/lib/types/shop-output";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { DATE_FORMAT } from "@/lib/constants";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
      Form,
      FormControl,
      FormField,
      FormItem,
      FormLabel,
      FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { CategoryShopSelector } from "@/components/shop-output/CategoryShopSelector";
import { CourierSelector } from "@/components/shop-output/CourierSelector";
import { formatDisplayDate, apiStringToDate, dateToApiString } from "@/lib/date-utils";

// 定义表单验证Schema
const formSchema = z.object({
      courier_id: z.number().min(1, { message: "请选择快递类型" }),
      quantity: z.string().refine((val) => {
            const num = parseInt(val);
            return !isNaN(num) && num > 0;
      }, { message: "请输入大于0的整数" }),
      notes: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

interface EditOutputModalProps {
      output: ShopOutput | null;
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onSave: (updatedOutput: ShopOutput) => Promise<void>;
      isLoading: boolean;
}

const EditOutputModal: React.FC<EditOutputModalProps> = ({
      output,
      open,
      onOpenChange,
      onSave,
      isLoading
}) => {
      const { t } = useTranslation();

      const form = useForm<FormData>({
            resolver: zodResolver(formSchema),
            defaultValues: {
                  courier_id: output?.courier_id || 0,
                  quantity: output ? output.quantity.toString() : "",
                  notes: output?.notes || ""
            }
      });

      // 当modal打开或output变化时，重置表单
      useEffect(() => {
            if (open && output) {
                  form.reset({
                        courier_id: output.courier_id,
                        quantity: output.quantity.toString(),
                        notes: output.notes || ""
                  });
            }
      }, [open, output, form]);

      const onSubmit = async (data: FormData) => {
            if (!output) return;

            // 更新output对象的快递类型、数量和备注
            await onSave({
                  ...output,
                  courier_id: data.courier_id,
                  quantity: parseInt(data.quantity),
                  notes: data.notes
            });
      };

      // 使用日期工具函数格式化显示日期
      const formattedDate = output?.output_date ?
            formatDisplayDate(output.output_date, DATE_FORMAT) : '未知日期';

      // 如果没有output数据则不显示对话框
      if (!output) return null;

      return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                  <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                              <DialogTitle>{t("编辑出力数据")}</DialogTitle>
                              <DialogDescription>{t("修改店铺出力数据，快递类型、数量和备注可以编辑")}</DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    {/* 日期 (只读显示) */}
                                    <div className="grid gap-2">
                                          <label className="text-sm font-medium">{t("日期")}</label>
                                          <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                                                {formattedDate}
                                          </div>
                                          <p className="text-xs text-muted-foreground">{t("日期不可编辑")}</p>
                                    </div>

                                    {/* 店铺名称 (只读显示) */}
                                    <div className="grid gap-2">
                                          <label className="text-sm font-medium">{t("店铺名称")}</label>
                                          <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                                                {output.shop_name || "未知"}
                                          </div>
                                          <p className="text-xs text-muted-foreground">{t("店铺不可编辑")}</p>
                                    </div>

                                    {/* 快递类型 (可编辑) */}
                                    <FormField
                                          control={form.control}
                                          name="courier_id"
                                          render={({ field }) => (
                                                <FormItem>
                                                      <FormLabel>{t("快递类型")}</FormLabel>
                                                      <FormControl>
                                                            <CourierSelector
                                                                  selectedCourierId={field.value}
                                                                  onSelectCourier={field.onChange}
                                                                  label=""
                                                                  className="w-full"
                                                            />
                                                      </FormControl>
                                                      <FormMessage />
                                                </FormItem>
                                          )}
                                    />

                                    {/* 数量 (可编辑) */}
                                    <FormField
                                          control={form.control}
                                          name="quantity"
                                          render={({ field }) => (
                                                <FormItem>
                                                      <FormLabel>{t("数量")}</FormLabel>
                                                      <FormControl>
                                                            <Input
                                                                  {...field}
                                                                  type="number"
                                                                  min="1"
                                                                  disabled={isLoading}
                                                            />
                                                      </FormControl>
                                                      <FormMessage />
                                                </FormItem>
                                          )}
                                    />

                                    {/* 备注 (可编辑) */}
                                    <FormField
                                          control={form.control}
                                          name="notes"
                                          render={({ field }) => (
                                                <FormItem>
                                                      <FormLabel>{t("备注")}</FormLabel>
                                                      <FormControl>
                                                            <Textarea
                                                                  {...field}
                                                                  placeholder={t("请输入备注（可选）")}
                                                                  className="resize-none"
                                                                  disabled={isLoading}
                                                            />
                                                      </FormControl>
                                                      <FormMessage />
                                                </FormItem>
                                          )}
                                    />

                                    <DialogFooter className="mt-6">
                                          <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => onOpenChange(false)}
                                                disabled={isLoading}
                                          >{t("取消")}</Button>
                                          <Button type="submit" disabled={isLoading}>
                                                {isLoading ? (
                                                      <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("保存中...")}</>
                                                ) : "保存"}
                                          </Button>
                                    </DialogFooter>
                              </form>
                        </Form>
                  </DialogContent>
            </Dialog>
      );
};

export default EditOutputModal; 