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
import { Shop, ShopFormData } from '@/lib/types/shop';

// 表单验证schema
const shopFormSchema = z.object({
  name: z.string().min(1, '店铺名称不能为空').max(50, '店铺名称不能超过50个字符'),
  remark: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ShopFormValues = z.infer<typeof shopFormSchema>;

interface ShopFormProps {
  initialValues?: Partial<Shop>;
  onSubmit: (values: ShopFormData) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
}

const ShopForm = ({ initialValues, onSubmit, onCancel, isSubmitting }: ShopFormProps) => {
  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      name: initialValues?.name || '',
      remark: initialValues?.remark || '',
      is_active: initialValues?.is_active !== undefined ? Boolean(initialValues.is_active) : true,
    },
  });

  // 当initialValues变化时更新表单值
  useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name || '',
        remark: initialValues.remark || '',
        is_active: initialValues.is_active !== undefined ? Boolean(initialValues.is_active) : true,
      });
    }
  }, [initialValues, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>店铺名称 *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="请输入店铺名称" />
              </FormControl>
              <FormMessage />
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
                  {...field}
                  placeholder="请输入备注信息（选填）"
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
              <FormLabel>状态</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === 'true')}
                  defaultValue={field.value ? 'true' : 'false'}
                  className="flex flex-row space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="active" />
                    <Label htmlFor="active">启用</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="inactive" />
                    <Label htmlFor="inactive">禁用</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : initialValues?.id ? '更新' : '添加'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ShopForm; 