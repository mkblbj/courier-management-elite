import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import ShopForm from "./ShopForm";
import { Shop, ShopFormData, ShopCategory } from "@/lib/types/shop";
import { updateShop } from "@/lib/api/shop";

interface EditShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: ShopFormData) => void;
  shop?: Shop;
  categories: ShopCategory[];
}

const EditShopDialog: React.FC<EditShopDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  shop,
  categories = [],
}) => {
  const { t } = useTranslation(['common', 'shop']);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ShopFormData) => {
    if (!shop) return;

    setIsSubmitting(true);
    try {
      if (onSuccess) {
        await onSuccess(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update shop:', error);
      toast({
        variant: 'destructive',
        title: t('shop:error_updating_shop'),
        description: error instanceof Error ? error.message : t('common:operation_failed'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('shop:edit_shop')}</DialogTitle>
          <DialogDescription>
            {t('shop:edit_shop_description', { defaultValue: '修改店铺信息' })}
          </DialogDescription>
        </DialogHeader>
        <ShopForm
          initialValues={shop}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          categories={categories}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditShopDialog; 