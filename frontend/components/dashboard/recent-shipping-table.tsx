"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { LoadingSpinner } from "@/components/loading-spinner"

interface RecentShippingTableProps {
  entries: any[]
  isLoading: boolean
}

export function RecentShippingTable({ entries, isLoading }: RecentShippingTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <LoadingSpinner size="md" text="加载中..." />
      </div>
    )
  }

  if (!entries || entries.length === 0) {
    return <div className="flex justify-center items-center h-[200px] text-gray-500">暂无数据</div>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日期</TableHead>
            <TableHead>快递类型</TableHead>
            <TableHead className="text-center">数量</TableHead>
            <TableHead>录入时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">{entry.date}</TableCell>
              <TableCell>{entry.courier_name}</TableCell>
              <TableCell className="text-center">{entry.quantity}</TableCell>
              <TableCell>{format(new Date(entry.created_at), "yyyy-MM-dd HH:mm")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
