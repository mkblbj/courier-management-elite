import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShopOutput, ShopOutputForm } from '@/lib/types/output';
import { Shop } from '@/lib/types/shop';
import { createShopOutput, updateShopOutput } from '@/lib/api/shop-output';
import { useToast } from '@/components/ui/use-toast';
import { formatDisplayDate, dateToApiString } from '@/lib/date-utils';
import { getCouriers } from '@/lib/api/courier';

interface OutputDataDialogProps {
  output?: ShopOutput | null;
  shops: Shop[];
  open: boolean;
  onClose: (refresh?: boolean) => void;
}

export function OutputDataDialog({ output, shops, open, onClose }: OutputDataDialogProps) {
  const { t } = useTranslation();

  const isEditMode = !!output;
  const { toast } = useToast();
  const [couriers, setCouriers] = useState<{ id: number, name: string }[]>([]);

  const [formData, setFormData] = useState({
    shop_id: output?.shop_id?.toString() || '',
    date: output?.date || dateToApiString(new Date()),
    courier_id: output?.courier_id?.toString() || '1',
    output_count: output?.output_count?.toString() || '',
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    output?.date ? new Date(output.date) : new Date()
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // 获取快递类型数据
    const fetchCouriers = async () => {
      try {
        const data = await getCouriers(true);
        setCouriers(data);
      } catch (error) {
        console.error('获取快递类型失败:', error);
        toast({
          variant: 'destructive',
          title: '获取快递类型失败',
          description: '请刷新页面重试',
        });
      }
    };

    fetchCouriers();
  }, [toast]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.shop_id) {
      newErrors.shop_id = '请选择店铺';
    }

    if (!formData.date) {
      newErrors.date = '请选择日期';
    }

    if (!formData.courier_id) {
      newErrors.courier_id = '请选择快递类型';
    }

    if (!formData.output_count) {
      newErrors.output_count = '请输入出力件数';
    } else if (isNaN(Number(formData.output_count)) || Number(formData.output_count) < 0) {
      newErrors.output_count = '出力件数必须是非负数';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData(prev => ({ ...prev, date: dateToApiString(date) }));
      if (errors.date) {
        setErrors(prev => ({ ...prev, date: '' }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        shop_id: parseInt(formData.shop_id),
        courier_id: parseInt(formData.courier_id),
        output_date: formData.date,
        quantity: parseInt(formData.output_count),
        notes: ""
      };

      if (isEditMode && output) {
        await updateShopOutput(output.id, data);
        toast({
          title: '更新成功',
          description: '出力数据已成功更新',
        });
      } else {
        await createShopOutput(data);
        toast({
          title: '添加成功',
          description: '出力数据已成功添加',
        });
      }

      onClose(true);
    } catch (error) {
      console.error('保存出力数据失败:', error);
      toast({
        variant: 'destructive',
        title: '保存失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    (<Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '编辑出力数据' : '添加出力数据'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shop" className="text-right">{t("店铺")}</Label>
            <div className="col-span-3">
              <Select
                value={formData.shop_id}
                onValueChange={(value) => handleChange('shop_id', value)}
              >
                <SelectTrigger id="shop">
                  <SelectValue placeholder={t("选择店铺")} />
                </SelectTrigger>
                <SelectContent>
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id.toString()}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.shop_id && <p className="text-sm text-red-500 mt-1">{errors.shop_id}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="courier" className="text-right">{t("快递类型")}</Label>
            <div className="col-span-3">
              <Select
                value={formData.courier_id}
                onValueChange={(value) => handleChange('courier_id', value)}
              >
                <SelectTrigger id="courier">
                  <SelectValue placeholder={t("选择快递类型")} />
                </SelectTrigger>
                <SelectContent>
                  {couriers.map(courier => (
                    <SelectItem key={courier.id} value={courier.id.toString()}>
                      {courier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.courier_id && <p className="text-sm text-red-500 mt-1">{errors.courier_id}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">{t("日期")}</Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? formatDisplayDate(selectedDate) : <span>{t("选择日期")}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="output_count" className="text-right">{t("出力件数")}</Label>
            <div className="col-span-3">
              <Input
                id="output_count"
                type="number"
                value={formData.output_count}
                onChange={(e) => handleChange('output_count', e.target.value)}
                className="w-full"
              />
              {errors.output_count && <p className="text-sm text-red-500 mt-1">{errors.output_count}</p>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()} disabled={isSubmitting}>
            {t("取消")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? `${t("保存中")}...` : t("保存")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>)
  );
} 