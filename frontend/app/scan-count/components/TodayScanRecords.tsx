"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { filterScanRecords, summarizeScanRecordsByCourier } from "@/lib/scan-count-record-utils"
import type { CourierType } from "@/services/api"
import type { ScanCountRecord } from "@/services/scan-count-api"
import { useTranslation } from "react-i18next"

type TodayScanRecordsProps = {
  records: ScanCountRecord[]
  courierTypes: CourierType[]
  isLoading: boolean
  onRefresh: () => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function TodayScanRecords({
  records,
  courierTypes,
  isLoading,
  onRefresh,
  onDelete,
}: TodayScanRecordsProps) {
  const { t } = useTranslation("common")
  const [courierId, setCourierId] = useState("all")
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<ScanCountRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredRecords = useMemo(() => {
    return filterScanRecords(records, { courierId, search })
  }, [courierId, records, search])

  const courierSummary = useMemo(() => summarizeScanRecordsByCourier(records), [records])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await onDelete(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("today_scan_records")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("today_scan_records_description")}
            </p>
          </div>
          <Button variant="outline" className="h-11 w-full sm:w-auto" disabled={isLoading} onClick={onRefresh}>
            {t("refresh")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
            <Select value={courierId} onValueChange={setCourierId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t("all_courier_types")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_courier_types")}</SelectItem>
                {courierTypes.map((courier) => (
                  <SelectItem key={courier.id} value={courier.id.toString()}>
                    {courier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("search_tracking_number")}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{t("today_scan_total")}</div>
              <div className="mt-1 text-2xl font-bold">{records.length}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{t("filtered_records")}</div>
              <div className="mt-1 text-2xl font-bold text-blue-700">{filteredRecords.length}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {courierSummary.length === 0 ? (
              <span className="text-sm text-muted-foreground">{t("no_scan_records")}</span>
            ) : (
              courierSummary.map((item) => (
                <Badge key={item.courier_id} variant="secondary" className="px-3 py-1 text-sm">
                  {item.courier_name}: {item.total}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("record_list")}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {t("no_scan_records")}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <div key={record.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="break-all font-mono text-lg font-semibold leading-tight">
                        {record.tracking_number}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{record.courier_name || record.courier_id}</Badge>
                        <span>{record.created_at ? new Date(record.created_at).toLocaleString() : "-"}</span>
                        <span>{t("batch_short")}: {record.batch_id.slice(0, 8)}</span>
                      </div>
                      <div className="break-all font-mono text-xs text-muted-foreground">
                        {t("raw_input")}: {record.raw_input}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      className="h-11 w-full sm:w-auto"
                      onClick={() => setDeleteTarget(record)}
                    >
                      {t("delete")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-lg sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm_delete_scan_record")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm_delete_scan_record_description", {
                trackingNumber: deleteTarget?.tracking_number || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={confirmDelete}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
