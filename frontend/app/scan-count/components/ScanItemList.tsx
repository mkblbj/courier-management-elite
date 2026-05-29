"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ScanCountRecord } from "@/services/scan-count-api"
import { useTranslation } from "react-i18next"

type ScanItemListProps = {
  records: ScanCountRecord[]
  onDelete: (id: number) => Promise<void>
  onUndoLast: () => Promise<void>
}

export function ScanItemList({ records, onDelete, onUndoLast }: ScanItemListProps) {
  const { t } = useTranslation("common")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base sm:text-lg">{t("current_batch_records")}</CardTitle>
        <Button variant="outline" size="sm" className="h-10" disabled={records.length === 0} onClick={onUndoLast}>
          {t("undo_last_scan")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tracking_number")}</TableHead>
                <TableHead>{t("raw_input")}</TableHead>
                <TableHead>{t("courier_type")}</TableHead>
                <TableHead>{t("scanned_at")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("no_scan_records")}
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono font-medium">{record.tracking_number}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{record.raw_input}</TableCell>
                    <TableCell>{record.courier_name || record.courier_id}</TableCell>
                    <TableCell>{record.created_at ? new Date(record.created_at).toLocaleTimeString() : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => onDelete(record.id)}>
                        {t("delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 md:hidden">
          {records.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("no_scan_records")}
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="rounded-lg border p-4">
                <div className="break-all font-mono text-lg font-semibold leading-tight">
                  {record.tracking_number}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{record.courier_name || record.courier_id}</span>
                  <span>{record.created_at ? new Date(record.created_at).toLocaleTimeString() : "-"}</span>
                </div>
                <div className="mt-2 break-all font-mono text-xs text-muted-foreground">
                  {t("raw_input")}: {record.raw_input}
                </div>
                <Button variant="outline" className="mt-3 h-11 w-full" onClick={() => onDelete(record.id)}>
                  {t("delete")}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
