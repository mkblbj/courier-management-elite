"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getShopOutputs } from "@/lib/api/shop-output";
import { ShopOutput, ShopOutputFilter } from "@/lib/types/shop-output";
import { DATE_FORMAT } from "@/lib/constants";

// 扩展ShopOutputFilter类型，添加排序和分页相关属性
interface ExtendedShopOutputFilter extends ShopOutputFilter {
  sort?: string;
  order?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

interface OutputListProps {
  selectedDate?: Date;
}

export default function OutputList({ selectedDate }: OutputListProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentOutputs, setRecentOutputs] = useState<ShopOutput[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5; // 每页显示5条数据

  useEffect(() => {
    fetchRecentData();
  }, [selectedDate]);

  const fetchRecentData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 获取最近的出力数据
      const data = await getShopOutputs({
        sort: "created_at",
        order: "DESC",
        limit: 30
      } as ExtendedShopOutputFilter);

      setRecentOutputs(data);
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (err) {
      console.error("Failed to fetch recent outputs:", err);
      setError("获取最近录入数据失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 获取当前页的数据
  const paginatedOutputs = recentOutputs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 分页功能
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // 格式化创建时间
  const formatCreatedTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : recentOutputs.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          暂无录入数据
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>店铺</TableHead>
                  <TableHead>快递类型</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOutputs.map((output) => (
                  <TableRow key={output.id}>
                    <TableCell>{output.output_date}</TableCell>
                    <TableCell>{output.shop_name}</TableCell>
                    <TableCell>{output.courier_name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {output.quantity}
                    </TableCell>
                    <TableCell>{formatCreatedTime(output.created_at || '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页控制 */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              显示 {recentOutputs.length} 条中的 {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, recentOutputs.length)} 条
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}