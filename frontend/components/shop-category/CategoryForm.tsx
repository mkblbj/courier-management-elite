import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShopCategory } from '@/lib/types/shop';

interface CategoryFormProps {
  open: boolean;
  category?: ShopCategory;
  onClose: () => void;
  onSubmit: (data: Omit<ShopCategory, 'id'>) => Promise<void>;
}

export function CategoryForm({ open, category, onClose, onSubmit }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!category;
  const title = isEditMode ? '编辑店铺类别' : '添加店铺类别';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证
    if (!name.trim()) {
      setError('类别名称不能为空');
      return;
    }

    if (name.length > 255) {
      setError('类别名称不能超过255个字符');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        sort_order: category?.sort_order || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">类别名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入类别名称"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : '确认'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 