import { useState } from 'react';
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
import { ShopOutput } from '@/lib/types/output';
import { Shop } from '@/lib/types/shop';
import { createShopOutput, updateShopOutput } from '@/lib/api/shop-output';
import { useToast } from '@/components/ui/use-toast';

interface OutputDataDialogProps {
  output?: ShopOutput | null;
  shops: Shop[];
  open: boolean;
  onClose: (refresh?: boolean) => void;
}

export function OutputDataDialog({ output, shops, open, onClose }: OutputDataDialogProps) {
  const isEditMode = !!output;
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    shop_id: output?.shop_id?.toString() || '',
    date: output?.date || format(new Date(), 'yyyy-MM-dd'),
    output_count: output?.output_count?.toString() || '',
    avg_time: output?.avg_time?.toString() || '',
    min_time: output?.min_time?.toString() || '',
    max_time: output?.max_time?.toString() || '',
    total_time: output?.total_time?.toString() || '',
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    output?.date ? new Date(output.date) : new Date()
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.shop_id) {
      newErrors.shop_id = '请选择店铺';
    }

    if (!formData.date) {
      newErrors.date = '请选择日期';
    }

    if (!formData.output_count) {
      newErrors.output_count = '请输入出力件数';
    } else if (isNaN(Number(formData.output_count)) || Number(formData.output_count) < 0) {
      newErrors.output_count = '出力件数必须是非负数';
    }

    if (!formData.avg_time) {
      newErrors.avg_time = '请输入平均时间';
    } else if (isNaN(Number(formData.avg_time)) || Number(formData.avg_time) < 0) {
      newErrors.avg_time = '平均时间必须是非负数';
    }

    if (!formData.min_time) {
      newErrors.min_time = '请输入最短时间';
    } else if (isNaN(Number(formData.min_time)) || Number(formData.min_time) < 0) {
      newErrors.min_time = '最短时间必须是非负数';
    }

    if (!formData.max_time) {
      newErrors.max_time = '请输入最长时间';
    } else if (isNaN(Number(formData.max_time)) || Number(formData.max_time) < 0) {
      newErrors.max_time = '最长时间必须是非负数';
    }

    if (!formData.total_time) {
      newErrors.total_time = '请输入总时间';
    } else if (isNaN(Number(formData.total_time)) || Number(formData.total_time) < 0) {
      newErrors.total_time = '总时间必须是非负数';
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
      setFormData(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
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
        date: formData.date,
        output_count: parseInt(formData.output_count),
        avg_time: parseFloat(formData.avg_time),
        min_time: parseFloat(formData.min_time),
        max_time: parseFloat(formData.max_time),
        total_time: parseFloat(formData.total_time),
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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '编辑出力数据' : '添加出力数据'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shop" className="text-right">店铺</Label>
            <div className="col-span-3">
              <Select
                value={formData.shop_id}
                onValueChange={(value) => handleChange('shop_id', value)}
              >
                <SelectTrigger id="shop">
                  <SelectValue placeholder="选择店铺" />
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
            <Label htmlFor="date" className="text-right">日期</Label>
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
                    {selectedDate ? format(selectedDate, 'yyyy-MM-dd') : <span>选择日期</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
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
            <Label htmlFor="output_count" className="text-right">出力件数</Label>
            <div className="col-span-3">
              <Input
                id="output_count"
                type="number"
                min="0"
                value={formData.output_count}
                onChange={(e) => handleChange('output_count', e.target.value)}
              />
              {errors.output_count && <p className="text-sm text-red-500 mt-1">{errors.output_count}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="avg_time" className="text-right">平均时间（分钟）</Label>
            <div className="col-span-3">
              <Input
                id="avg_time"
                type="number"
                min="0"
                step="0.01"
                value={formData.avg_time}
                onChange={(e) => handleChange('avg_time', e.target.value)}
              />
              {errors.avg_time && <p className="text-sm text-red-500 mt-1">{errors.avg_time}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="min_time" className="text-right">最短时间（分钟）</Label>
            <div className="col-span-3">
              <Input
                id="min_time"
                type="number"
                min="0"
                step="0.01"
                value={formData.min_time}
                onChange={(e) => handleChange('min_time', e.target.value)}
              />
              {errors.min_time && <p className="text-sm text-red-500 mt-1">{errors.min_time}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="max_time" className="text-right">最长时间（分钟）</Label>
            <div className="col-span-3">
              <Input
                id="max_time"
                type="number"
                min="0"
                step="0.01"
                value={formData.max_time}
                onChange={(e) => handleChange('max_time', e.target.value)}
              />
              {errors.max_time && <p className="text-sm text-red-500 mt-1">{errors.max_time}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total_time" className="text-right">总时间（分钟）</Label>
            <div className="col-span-3">
              <Input
                id="total_time"
                type="number"
                min="0"
                step="0.01"
                value={formData.total_time}
                onChange={(e) => handleChange('total_time', e.target.value)}
              />
              {errors.total_time && <p className="text-sm text-red-500 mt-1">{errors.total_time}</p>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 