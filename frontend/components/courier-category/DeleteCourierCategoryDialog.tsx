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
import { CourierCategory } from '@/services/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DeleteCourierCategoryDialogProps {
      open: boolean;
      category: CourierCategory;
      onClose: () => void;
      onConfirm: () => Promise<void>;
}

export function DeleteCourierCategoryDialog({
      open,
      category,
      onClose,
      onConfirm,
}: DeleteCourierCategoryDialogProps) {
      const [isDeleting, setIsDeleting] = useState(false);
      const { t } = useTranslation(['courier', 'common']);

      const handleConfirm = async () => {
            setIsDeleting(true);
            try {
                  await onConfirm();
            } catch (error) {
                  console.error('删除快递类别失败:', error);
            } finally {
                  setIsDeleting(false);
                  onClose();
            }
      };

      return (
            <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
                  <AlertDialogContent>
                        <AlertDialogHeader>
                              <AlertDialogTitle>{t('courier:delete_category')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                    {t('courier:confirm_delete_category', { name: category.name })}
                              </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                              <AlertDialogCancel disabled={isDeleting}>{t('common:cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                    onClick={(e) => {
                                          e.preventDefault();
                                          handleConfirm();
                                    }}
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                              >
                                    {isDeleting ? t('courier:deleting') : t('common:delete')}
                              </AlertDialogAction>
                        </AlertDialogFooter>
                  </AlertDialogContent>
            </AlertDialog>
      );
} 