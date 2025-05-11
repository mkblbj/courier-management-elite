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
import { ShopFormData, ShopCategory } from "@/lib/types/shop";

interface AddShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: ShopFormData) => Promise<void>;
  categories: ShopCategory[];
}

export const AddShopDialog: React.FC<AddShopDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  categories = [],
}) => {
  const { t } = useTranslation(['common', 'shop']);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ShopFormData) => {
    try {
      setIsSubmitting(true);

      if (onSuccess) {
        await onSuccess(data);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("添加店铺失败:", error);
      toast({
        variant: 'destructive',
        title: t('shop:error_adding_shop'),
        description: error instanceof Error ? error.message : t('common:operation_failed'),
      });
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
          categories={categories}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddShopDialog; 