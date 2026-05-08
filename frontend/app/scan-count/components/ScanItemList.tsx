"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ScanCountRecord } from "@/services/scan-count-api"

type ScanItemListProps = {
  records: ScanCountRecord[]
  onDelete: (id: number) => Promise<void>
  onUndoLast: () => Promise<void>
}

export function ScanItemList({ records, onDelete, onUndoLast }: ScanItemListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>本轮扫描记录</CardTitle>
        <Button variant="outline" size="sm" disabled={records.length === 0} onClick={onUndoLast}>
          撤销最后一条
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>运单号</TableHead>
              <TableHead>原始输入</TableHead>
              <TableHead>快递类型</TableHead>
              <TableHead>扫描时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  暂无扫描记录
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
                      删除
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
