import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CourierCategory } from '@/services/api';
import { useTranslation } from 'react-i18next';

interface CourierCategoryFormProps {
      open: boolean;
      category?: CourierCategory;
      onClose: () => void;
      onSubmit: (data: Omit<CourierCategory, 'id'>) => Promise<void>;
      dialogDescription?: string;
}

export function CourierCategoryForm({ open, category, onClose, onSubmit, dialogDescription }: CourierCategoryFormProps) {
      const [name, setName] = useState(category?.name || '');
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const { t } = useTranslation(['courier']);

      const isEditMode = !!category;
      const title = isEditMode ? t('courier:edit_category') : t('courier:add_category');

      const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError(null);

            // 验证
            if (!name.trim()) {
                  setError(t('courier:category_name_required'));
                  return;
            }

            if (name.length > 255) {
                  setError(t('courier:category_name_too_long'));
                  return;
            }

            setIsSubmitting(true);
            try {
                  await onSubmit({
                        name,
                        sort_order: category?.sort_order || 0
                  });
            } catch (err) {
                  setError(err instanceof Error ? err.message : t('courier:submit_failed'));
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
                                    <Label htmlFor="name">{t('courier:category_name')}</Label>
                                    <Input
                                          id="name"
                                          value={name}
                                          onChange={(e) => setName(e.target.value)}
                                          placeholder={t('courier:enter_category_name')}
                                    />
                                    {error && <p className="text-sm text-red-500">{error}</p>}
                              </div>
                              <DialogFooter>
                                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                          {t('courier:cancel')}
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                          {isSubmitting ? t('courier:submitting') : t('courier:confirm')}
                                    </Button>
                              </DialogFooter>
                        </form>
                  </DialogContent>
            </Dialog>
      );
} 