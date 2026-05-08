"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type BatchSummaryDialogProps = {
  open: boolean
  count: number
  courierName?: string
  onOpenChange: (open: boolean) => void
  onUndoBatch: () => Promise<void>
}

export function BatchSummaryDialog({ open, count, courierName, onOpenChange, onUndoBatch }: BatchSummaryDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>本轮计数完成</AlertDialogTitle>
          <AlertDialogDescription>
            {courierName || "当前快递类型"} 本轮共扫描 {count} 件。记录已保存到出荷计数。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={async () => {
              await onUndoBatch()
              onOpenChange(false)
            }}
          >
            撤销本轮
          </AlertDialogCancel>
          <AlertDialogAction>确认</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
