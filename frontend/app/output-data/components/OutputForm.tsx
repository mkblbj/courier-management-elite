"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ShopSelector } from "@/components/shop-output/ShopSelector";
import { DateSelector } from "@/components/shop-output/DateSelector";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { ShopOutput, ShopOutputFormData } from "@/lib/types/shop-output";
import { createShopOutput, updateShopOutput } from "@/lib/api/shop-output";
import { DATE_FORMAT } from "@/lib/constants";

const outputFormSchema = z.object({
  shop_id: z.number({
    required_error: "店铺不能为空",
  }),
  courier_id: z.number({
    required_error: "快递类型不能为空",
  }).default(1), // 快递类型暂时硬编码为1
  output_date: z.string({
    required_error: "日期不能为空",
  }),
  quantity: z.number({
    required_error: "出力数量不能为空",
  }).int().positive(),
  notes: z.string().optional(),
});

type OutputFormProps = {
  initialData?: ShopOutput;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
};

export default function OutputForm({ 
  initialData, 
  isOpen, 
  onClose, 
  onSuccess 
}: OutputFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!initialData;
  const isModal = !!onClose;

  const form = useForm<z.infer<typeof outputFormSchema>>({
    resolver: zodResolver(outputFormSchema),
    defaultValues: {
      shop_id: initialData?.shop_id || undefined,
      courier_id: initialData?.courier_id || 1, // 快递类型暂时硬编码为1
      output_date: initialData?.output_date || format(new Date(), DATE_FORMAT),
      quantity: initialData?.quantity || undefined,
      notes: initialData?.notes || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof outputFormSchema>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const outputData: ShopOutputFormData = {
        shop_id: values.shop_id,
        courier_id: values.courier_id,
        output_date: values.output_date,
        quantity: values.quantity,
        notes: values.notes
      };

      if (isEditMode && initialData) {
        await updateShopOutput(initialData.id, outputData);
      } else {
        await createShopOutput(outputData);
      }
      
      form.reset();
      onSuccess?.();
    } catch (err) {
      console.error("Failed to submit output data:", err);
      setError(`${isEditMode ? '更新' : '添加'}出力数据失败，请重试`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="shop_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>店铺</FormLabel>
              <FormControl>
                <ShopSelector
                  selectedShopId={field.value}
                  onSelectShop={(shopId) => field.onChange(shopId)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 快递类型暂时硬编码，后续需要替换为选择器 */}
        <FormField
          control={form.control}
          name="courier_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>快递类型</FormLabel>
              <FormControl>
                <Input
                  value="顺丰速运"
                  disabled
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="output_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>日期</FormLabel>
              <FormControl>
                <DateSelector
                  date={field.value ? new Date(field.value) : undefined}
                  onDateChange={(date) => 
                    field.onChange(date ? format(date, DATE_FORMAT) : undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>出力数量</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="请输入出力数量"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : parseInt(value, 10));
                  }}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>备注</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请输入备注信息（可选）"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-2">
          {isModal && (
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "提交中..." : isEditMode ? "更新" : "添加"}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isModal) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "编辑" : "添加"}出力数据</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>数据录入</CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
} 