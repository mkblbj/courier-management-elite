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
        <CardTitle>{t("current_batch_records")}</CardTitle>
        <Button variant="outline" size="sm" disabled={records.length === 0} onClick={onUndoLast}>
          {t("undo_last_scan")}
        </Button>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
