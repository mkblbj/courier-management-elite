"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

// 定义表单验证Schema
const formSchema = z.object({
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

export default function EditOutputModal({
      output,
      open,
      onOpenChange,
      onSave,
      isLoading
}: EditOutputModalProps) {
      const form = useForm<FormData>({
            resolver: zodResolver(formSchema),
            defaultValues: {
                  quantity: output ? output.quantity.toString() : "",
                  notes: output?.notes || ""
            }
      });

      // 当output变化时更新表单值
      useEffect(() => {
            if (output) {
                  form.reset({
                        quantity: output.quantity.toString(),
                        notes: output.notes || ""
                  });
            }
      }, [output, form]);

      // 提交表单
      const onSubmit = async (data: FormData) => {
            if (!output) return;

            await onSave({
                  ...output,
                  quantity: parseInt(data.quantity),
                  notes: data.notes
            });
      };

      // 如果没有output数据则不显示对话框
      if (!output) return null;

      return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                  <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                              <DialogTitle>编辑出力数据</DialogTitle>
                        </DialogHeader>

                        <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    {/* 日期 (只读显示) */}
                                    <div className="grid gap-2">
                                          <label className="text-sm font-medium">日期</label>
                                          <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                                                {output.output_date ? format(new Date(output.output_date), DATE_FORMAT) : "未知"}
                                          </div>
                                          <p className="text-xs text-muted-foreground">日期不可编辑</p>
                                    </div>

                                    {/* 店铺名称 (只读显示) */}
                                    <div className="grid gap-2">
                                          <label className="text-sm font-medium">店铺名称</label>
                                          <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                                                {output.shop_name || "未知"}
                                          </div>
                                          <p className="text-xs text-muted-foreground">店铺不可编辑</p>
                                    </div>

                                    {/* 快递类型 (只读显示) */}
                                    <div className="grid gap-2">
                                          <label className="text-sm font-medium">快递类型</label>
                                          <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                                                {output.courier_name || "未知"}
                                          </div>
                                          <p className="text-xs text-muted-foreground">快递类型不可编辑</p>
                                    </div>

                                    {/* 数量 (可编辑) */}
                                    <FormField
                                          control={form.control}
                                          name="quantity"
                                          render={({ field }) => (
                                                <FormItem>
                                                      <FormLabel>数量</FormLabel>
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
                                                      <FormLabel>备注</FormLabel>
                                                      <FormControl>
                                                            <Textarea
                                                                  {...field}
                                                                  placeholder="请输入备注（可选）"
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
                                          >
                                                取消
                                          </Button>
                                          <Button type="submit" disabled={isLoading}>
                                                {isLoading ? (
                                                      <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            保存中...
                                                      </>
                                                ) : "保存"}
                                          </Button>
                                    </DialogFooter>
                              </form>
                        </Form>
                  </DialogContent>
            </Dialog>
      );
} 