"use client";
import { useTranslation } from "react-i18next";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { LoadingSpinner } from "@/components/loading-spinner"

interface RecentShippingTableProps {
  entries: any[]
  isLoading: boolean
}

export function RecentShippingTable({ entries, isLoading }: RecentShippingTableProps) {
  const {
    t: t
  } = useTranslation();

  if (isLoading) {
    return (
      (<div className="flex justify-center items-center h-[300px]">
        <LoadingSpinner size="md" text={t("加载中...")} />
      </div>)
    );
  }

  if (!entries || entries.length === 0) {
    return <div className="flex justify-center items-center h-[200px] text-gray-500">{t("暂无数据")}</div>;
  }

  return (
    (<div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("日期")}</TableHead>
            <TableHead>{t("快递类型")}</TableHead>
            <TableHead className="text-center">{t("数量")}</TableHead>
            <TableHead>{t("录入时间")}</TableHead>
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
    </div>)
  );
}
