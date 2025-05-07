"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Edit2, Trash2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ShopOutput, ShopOutputFilter } from "@/lib/types/shop-output";
import { getShopOutputs, deleteShopOutput } from "@/lib/api/shop-output";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface OutputListProps {
  filter?: ShopOutputFilter;
  selectedDate?: Date;
}

export default function OutputList({ filter = {}, selectedDate }: OutputListProps) {
  const { t } = useTranslation(['common', 'shop']);
  const { toast } = useToast();
  const [outputs, setOutputs] = useState<ShopOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<ShopOutput | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const fetchOutputs = async () => {
    setLoading(true);
    setError(null);
    try {
      // 合并筛选条件，优先使用selectedDate
      const dateFilter = selectedDate ? {
        date_from: format(selectedDate, 'yyyy-MM-dd'),
        date_to: format(selectedDate, 'yyyy-MM-dd')
      } : {};

      const combinedFilter = { ...filter, ...dateFilter };
      const data = await getShopOutputs(combinedFilter);
      setOutputs(data);
    } catch (err) {
      console.error("Failed to fetch outputs:", err);
      setError(t('shop:data_fetch_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutputs();
  }, [filter, selectedDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleEdit = (output: ShopOutput) => {
    // 临时禁用编辑功能
    toast({
      title: "编辑功能暂时不可用",
      description: "该功能正在重新实现中",
      variant: "destructive",
    });
    // setSelectedOutput(output);
    // setIsEditModalOpen(true);
  };

  const handleDelete = (output: ShopOutput) => {
    setSelectedOutput(output);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedOutput) return;

    setIsDeleting(true);
    try {
      await deleteShopOutput(selectedOutput.id);
      setIsDeleteDialogOpen(false);
      toast({
        title: t('shop:delete_success'),
      });
      await fetchOutputs(); // 重新加载数据
    } catch (err) {
      console.error("Failed to delete output:", err);
      toast({
        variant: 'destructive',
        title: t('common:operation_failed'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = () => {
    fetchOutputs();
  };

  // 获取星期几
  const getWeekdayName = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return t(`weekday.full.${format(date, 'EEEE').toLowerCase()}`);
    } catch (e) {
      return '';
    }
  };

  return (
    <TooltipProvider>
      <Card className="border">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">{t('shop:loading')}</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : outputs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('shop:no_data')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="animate-fade-in" style={{ animationDelay: "50ms" }}>
                    <TableHead className="w-[120px]">{t('shop:date')}</TableHead>
                    <TableHead className="w-[180px]">{t('shop:shop')}</TableHead>
                    <TableHead className="w-[180px]">{t('shop:courier_type')}</TableHead>
                    <TableHead className="w-[80px] text-center">{t('shop:quantity')}</TableHead>
                    <TableHead>{t('shop:notes')}</TableHead>
                    <TableHead className="w-[100px] text-center">{t('shop:actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outputs.map((output, index) => (
                    <TableRow
                      key={output.id}
                      className={cn(
                        "transition-all duration-300 hover:bg-gray-50",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                      )}
                      style={{ transitionDelay: `${index * 50 + 100}ms` }}
                    >
                      <TableCell className="w-[120px] whitespace-nowrap">
                        {output.output_date}
                        <div className="text-xs text-gray-500">
                          {getWeekdayName(output.output_date)}
                        </div>
                      </TableCell>
                      <TableCell className="w-[180px] font-medium">{output.shop_name}</TableCell>
                      <TableCell className="w-[180px]">{output.courier_name}</TableCell>
                      <TableCell className="w-[80px] text-center">{output.quantity}</TableCell>
                      <TableCell>
                        {output.notes ? (
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger className="w-full text-left">
                              <div className="truncate text-sm text-muted-foreground max-w-[400px] group relative">
                                {output.notes}
                                {output.notes.length > 60 && (
                                  <span className="absolute -right-5 top-0 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    ···
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="start"
                              className="max-w-[400px] bg-white border shadow-md p-3 z-50"
                            >
                              <p className="text-sm text-gray-700 break-words whitespace-normal">{output.notes}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="w-[100px]">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(output)}
                            disabled={loading}
                            className="h-8 w-8 transition-colors hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4 text-blue-600" />
                            <span className="sr-only">{t('shop:edit')}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(output)}
                            disabled={loading}
                            className="h-8 w-8 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">{t('shop:delete')}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t px-6 py-3">
          <div className="text-sm text-muted-foreground">{t('shop:total_record', { count: outputs.length })}</div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('shop:delete_confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('shop:delete_confirm_message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('shop:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 transition-colors"
            >
              {isDeleting ? t('shop:deleting') : t('shop:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
} 