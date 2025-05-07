import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShopCategory } from '@/lib/types/shop';
import { useTranslation } from 'react-i18next';

interface CategoryFormProps {
  open: boolean;
  category?: ShopCategory;
  onClose: () => void;
  onSubmit: (data: Omit<ShopCategory, 'id'>) => Promise<void>;
  dialogDescription?: string;
}

export function CategoryForm({ open, category, onClose, onSubmit, dialogDescription }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation(['shop']);

  const isEditMode = !!category;
  const title = isEditMode ? t('shop:edit_category') : t('shop:add_category');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证
    if (!name.trim()) {
      setError(t('shop:category_name_required'));
      return;
    }

    if (name.length > 255) {
      setError(t('shop:category_name_too_long'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        sort_order: category?.sort_order || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shop:submit_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {dialogDescription && (
            <DialogDescription>{dialogDescription}</DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('shop:category_name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('shop:enter_category_name')}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('shop:cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('shop:submitting') : t('shop:confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 