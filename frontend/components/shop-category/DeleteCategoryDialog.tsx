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

interface DeleteCategoryDialogProps {
  category: ShopCategory;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteCategoryDialog({
  category,
  open,
  onClose,
  onConfirm,
}: DeleteCategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      if (err instanceof Error && err.message.includes('关联')) {
        setError('该类别已关联店铺，无法删除。请先移除关联的店铺或将店铺更换到其他类别。');
      } else {
        setError(err instanceof Error ? err.message : '删除失败，请重试');
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
          <AlertDialogTitle>删除店铺类别</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除类别 "{category.name}" 吗？此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="text-sm text-red-500 py-2">{error}</div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>取消</AlertDialogCancel>
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
            {isSubmitting ? '删除中...' : '确认删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 