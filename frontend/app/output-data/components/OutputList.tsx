"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShopOutput, ShopOutputFilter } from "@/lib/types/shop-output";
import { getShopOutputs, deleteShopOutput } from "@/lib/api/shop-output";
import OutputForm from "./OutputForm";

interface OutputListProps {
  filter?: ShopOutputFilter;
}

export default function OutputList({ filter = {} }: OutputListProps) {
  const { t } = useTranslation(['common', 'shop']);
  const [outputs, setOutputs] = useState<ShopOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<ShopOutput | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOutputs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getShopOutputs(filter);
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
  }, [filter]);

  const handleEdit = (output: ShopOutput) => {
    setSelectedOutput(output);
    setIsEditModalOpen(true);
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
      toast.success(t('shop:delete_success'));
      await fetchOutputs(); // 重新加载数据
    } catch (err) {
      console.error("Failed to delete output:", err);
      toast.error(t('common:operation_failed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    fetchOutputs(); // 重新加载数据
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>{t('shop:output_data_list')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{t('shop:loading')}</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : outputs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('shop:no_data')}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('shop:date')}</TableHead>
                    <TableHead>{t('shop:shop')}</TableHead>
                    <TableHead>{t('shop:courier_type')}</TableHead>
                    <TableHead className="text-right">{t('shop:quantity')}</TableHead>
                    <TableHead>{t('shop:notes')}</TableHead>
                    <TableHead className="text-right">{t('shop:actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outputs.map((output) => (
                    <TableRow key={output.id}>
                      <TableCell>{output.output_date}</TableCell>
                      <TableCell>{output.shop_name}</TableCell>
                      <TableCell>{output.courier_name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {output.quantity}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {output.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(output)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleDelete(output)}
                          >
                            <Trash2 className="h-4 w-4" />
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
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
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
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? t('shop:deleting') : t('shop:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedOutput && (
        <OutputForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          initialData={selectedOutput}
        />
      )}
    </>
  );
} 