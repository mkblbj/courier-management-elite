import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShieldAlert, Loader2 } from "lucide-react";
import { ShopOutput } from "@/lib/types/shop-output";
import { formatDisplayDate } from "@/lib/date-utils";

interface DeleteOutputModalProps {
      output: ShopOutput | null;
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onConfirm: () => Promise<void>;
      isLoading: boolean;
}

export default function DeleteOutputModal({
      output,
      open,
      onOpenChange,
      onConfirm,
      isLoading
}: DeleteOutputModalProps) {
      if (!output) return null;

      return (
            <AlertDialog open={open} onOpenChange={onOpenChange}>
                  <AlertDialogContent>
                        <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center">
                                    <ShieldAlert className="h-5 w-5 text-destructive mr-2" />
                                    删除出力数据
                              </AlertDialogTitle>
                              <AlertDialogDescription className="pb-2">
                                    此操作不可逆，删除后数据将无法恢复。请确认是否要删除以下出力数据？
                              </AlertDialogDescription>

                              <div className="mt-4 border rounded-md p-3 bg-muted/50">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div className="font-medium">日期:</div>
                                          <div>{formatDisplayDate(output.output_date)}</div>

                                          <div className="font-medium">店铺名称:</div>
                                          <div>{output.shop_name || "未知"}</div>

                                          <div className="font-medium">快递类型:</div>
                                          <div>{output.courier_name || "未知"}</div>

                                          <div className="font-medium">数量:</div>
                                          <div>{output.quantity}</div>

                                          {output.notes && (
                                                <>
                                                      <div className="font-medium">备注:</div>
                                                      <div className="truncate">{output.notes}</div>
                                                </>
                                          )}
                                    </div>
                              </div>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                              <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
                              <AlertDialogAction
                                    onClick={(e) => {
                                          e.preventDefault();
                                          onConfirm();
                                    }}
                                    disabled={isLoading}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                    {isLoading ? (
                                          <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                删除中...
                                          </>
                                    ) : "确认删除"}
                              </AlertDialogAction>
                        </AlertDialogFooter>
                  </AlertDialogContent>
            </AlertDialog>
      );
} 