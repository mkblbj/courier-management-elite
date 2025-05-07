import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShopCategory } from '@/lib/types/shop';
import { useTranslation } from 'react-i18next';

interface DeleteCategoryDialogProps {
  category: ShopCategory;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  dialogDescription?: string;
}

export function DeleteCategoryDialog({
  category,
  open,
  onClose,
  onConfirm,
  dialogDescription,
}: DeleteCategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation(['shop', 'common']);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      if (err instanceof Error && err.message.includes('关联')) {
        setError(t('shop:category_has_shops_error'));
      } else {
        setError(err instanceof Error ? err.message : t('shop:delete_failed'));
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
    return true;
  };

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('shop:delete_category')}</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogDescription || t('shop:delete_category_confirm', { name: category.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="text-sm text-red-500 py-2">{error}</div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>{t('common:cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm().then((success) => {
                if (success) {
                  onClose();
                }
              });
            }}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? t('shop:deleting') : t('shop:confirm_delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 