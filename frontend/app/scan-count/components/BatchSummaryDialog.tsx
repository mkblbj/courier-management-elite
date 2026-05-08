"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useTranslation } from "react-i18next"

type BatchSummaryDialogProps = {
  open: boolean
  count: number
  courierName?: string
  onOpenChange: (open: boolean) => void
  onUndoBatch: () => Promise<void>
}

export function BatchSummaryDialog({ open, count, courierName, onOpenChange, onUndoBatch }: BatchSummaryDialogProps) {
  const { t } = useTranslation("common")
  const displayCourierName = courierName || t("current_courier_type")

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("batch_summary_title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("batch_summary_description", { courierName: displayCourierName, count })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={async () => {
              await onUndoBatch()
              onOpenChange(false)
            }}
          >
            {t("undo_batch")}
          </AlertDialogCancel>
          <AlertDialogAction>{t("confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
