import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Shop, ShopFormData, ShopCategory } from '@/lib/types/shop';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 表单验证schema
const shopFormSchema = z.object({
  name: z.string().min(1, t("店铺名称不能为空")).max(50, t("店铺名称不能超过50个字符")),
  category_id: z.number().optional().or(z.string().optional().transform(val => val ? Number(val) : undefined)),
  remark: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ShopFormValues = z.infer<typeof shopFormSchema>;

interface ShopFormProps {
  initialValues?: Partial<Shop>;
  categories?: ShopCategory[];
  onSubmit: (values: ShopFormData) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
}

const ShopForm = ({ initialValues, categories = [], onSubmit, onCancel, isSubmitting }: ShopFormProps) => {
  const {
    t: t
  } = useTranslation();

  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      name: initialValues?.name || '',
      category_id: initialValues?.category_id,
      remark: initialValues?.remark || '',
      is_active: initialValues?.is_active !== undefined ? Boolean(initialValues.is_active) : true,
    },
  });

  // 当initialValues变化时更新表单值
  useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name || '',
        category_id: initialValues.category_id,
        remark: initialValues.remark || '',
        is_active: initialValues.is_active !== undefined ? Boolean(initialValues.is_active) : true,
      });
    }
  }, [initialValues, form]);

  return (
    (<Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("店铺名称 *")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("请输入店铺名称")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("所属类别")}</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("选择店铺所属类别")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
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
          name="remark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("备注")}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t("请输入备注信息（选填）")}
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{t("状态")}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === 'true')}
                  defaultValue={field.value ? 'true' : 'false'}
                  className="flex flex-row space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="active" />
                    <Label htmlFor="active">{t("启用")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="inactive" />
                    <Label htmlFor="inactive">{t("禁用")}</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>{t("取消")}</Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : initialValues?.id ? '更新' : '添加'}
          </Button>
        </div>
      </form>
    </Form>)
  );
};

export default ShopForm; 