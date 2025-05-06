import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import ShopForm from "./ShopForm";
import { ShopFormData } from "@/lib/types/shop";
import { createShop } from "@/lib/api/shop";

interface AddShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddShopDialog: React.FC<AddShopDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation(['common', 'shop']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ShopFormData) => {
    try {
      setIsSubmitting(true);
      await createShop(data);
      toast.success(t('shop:shop_added_success'));
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("添加店铺失败:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('shop:shop_add_error')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen && !isSubmitting) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('shop:add_shop')}</DialogTitle>
          <DialogDescription>
            {t('shop:add_shop_description')}
          </DialogDescription>
        </DialogHeader>
        <ShopForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddShopDialog; 