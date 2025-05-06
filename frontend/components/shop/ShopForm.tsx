import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Shop, ShopFormData } from "@/lib/types/shop";

// 表单验证模式
const shopFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "店铺名称不能为空" })
    .max(100, { message: "店铺名称不能超过100个字符" }),
  is_active: z.boolean(),
  remark: z.string().max(500, { message: "备注不能超过500个字符" }).optional(),
});

type ShopFormProps = {
  initialData?: Shop;
  onSubmit: (data: ShopFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

export const ShopForm: React.FC<ShopFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  // 初始化表单
  const form = useForm<z.infer<typeof shopFormSchema>>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      is_active: initialData ? !!initialData.is_active : true,
      remark: initialData?.remark || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>店铺名称</FormLabel>
              <FormControl>
                <Input placeholder="请输入店铺名称" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">启用状态</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="remark"
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

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault(); // 防止表单提交
              onCancel();
            }}
            type="button" // 明确指定为button类型，防止触发表单提交
          >
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "提交中..." : initialData ? "更新" : "添加"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ShopForm; 