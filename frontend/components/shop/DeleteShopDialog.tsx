import { useState, useEffect } from "react";
import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteShop } from "@/lib/api/shop";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Shop } from "@/lib/types/shop";

interface DeleteShopDialogProps {
      shop: Shop | null;
      isOpen: boolean;
      onClose: () => void;
      onDeleted: () => void;
}

export function DeleteShopDialog({
      shop,
      isOpen,
      onClose,
      onDeleted,
}: DeleteShopDialogProps) {
      const [isDeleting, setIsDeleting] = useState(false);
      const { toast } = useToast();

      const handleDelete = async () => {
            if (!shop) return;

            setIsDeleting(true);
            try {
                  await deleteShop(shop.id);
                  toast({
                        title: "删除成功",
                        description: `店铺 "${shop.name}" 已成功删除`,
                  });
                  onDeleted();
                  onClose();
            } catch (error) {
                  console.error("删除店铺失败:", error);
                  toast({
                        title: "删除失败",
                        description: "无法删除店铺，请稍后重试",
                        variant: "destructive",
                  });
            } finally {
                  setIsDeleting(false);
            }
      };

      if (!shop) return null;

      return (
            <AlertDialog open={isOpen} onOpenChange={onClose}>
                  <AlertDialogContent>
                        <AlertDialogHeader>
                              <AlertDialogTitle>确认删除店铺</AlertDialogTitle>
                              <AlertDialogDescription>
                                    您确定要删除店铺 <strong>{shop.name}</strong> 吗？此操作不可逆。
                                    <p className="mt-2 text-destructive flex items-center">
                                          <AlertTriangle className="h-4 w-4 mr-1" />
                                          警告：该店铺已有关联的出力数据，删除后相关数据也将一并删除。
                                    </p>
                              </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                              <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
                              <AlertDialogAction
                                    asChild
                                    onClick={(e) => {
                                          e.preventDefault();
                                          handleDelete();
                                    }}
                              >
                                    <Button variant="destructive" disabled={isDeleting}>
                                          {isDeleting ? (
                                                <>
                                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                      删除中...
                                                </>
                                          ) : (
                                                "确认删除"
                                          )}
                                    </Button>
                              </AlertDialogAction>
                        </AlertDialogFooter>
                  </AlertDialogContent>
            </AlertDialog>
      );
} 