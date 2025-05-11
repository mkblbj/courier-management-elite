import { useTranslation } from "react-i18next";
import { useState } from "react";
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
import { Loader2, AlertTriangle } from "lucide-react";
import { Shop } from "@/lib/types/shop";

interface DeleteShopDialogProps {
      shop: Shop | null;
      isOpen: boolean;
      onOpenChange: (open: boolean) => void;
      onDeleted: () => void;
}

export function DeleteShopDialog({
      shop,
      isOpen,
      onOpenChange,
      onDeleted,
}: DeleteShopDialogProps) {
      const {
            t: t
      } = useTranslation();

      const [isDeleting, setIsDeleting] = useState(false);

      const handleDelete = async () => {
            const {
                  t: t
            } = useTranslation();

            if (!shop) return;

            setIsDeleting(true);
            try {
                  // 调用父组件的删除回调
                  await onDeleted();
                  // 关闭对话框
                  onOpenChange(false);
            } catch (error) {
                  console.error("删除店铺失败:", error);
                  // 错误处理已在父组件完成
            } finally {
                  setIsDeleting(false);
            }
      };

      if (!shop) return null;

      return (
            (<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
                  <AlertDialogContent>
                        <AlertDialogHeader>
                              <AlertDialogTitle>{t("确认删除店铺")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("您确定要删除店铺")}<strong>{shop.name}</strong>{t("吗？此操作不可逆。")}{shop.hasRelatedData && (
                                          <p className="mt-2 text-destructive flex items-center">
                                                <AlertTriangle className="h-4 w-4 mr-1" />{t("警告：该店铺已有关联的出力数据，删除后相关数据也将一并删除。")}</p>
                                    )}
                              </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                              <AlertDialogCancel disabled={isDeleting}>{t("取消")}</AlertDialogCancel>
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
                                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("删除中...")}</>
                                          ) : (
                                                "确认删除"
                                          )}
                                    </Button>
                              </AlertDialogAction>
                        </AlertDialogFooter>
                  </AlertDialogContent>
            </AlertDialog>)
      );
} 