import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import {
      Table,
      TableBody,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
      Search,
      Plus,
      Pencil,
      Trash,
      Filter,
      Loader2
} from "lucide-react";
import { CourierType, CourierCategory } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourierTypeDialog } from "@/components/courier-type-dialog";
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

interface CourierTypeListProps {
      courierTypes: CourierType[];
      categories: CourierCategory[];
      isLoading?: boolean;
      onAdd?: (type: {
            name: string;
            code: string;
            remark?: string;
            is_active: boolean;
            category_id?: number | string | null;
      }) => Promise<void>;
      onEdit?: (id: number | string, type: {
            name: string;
            code: string;
            remark?: string;
            is_active: boolean;
            category_id?: number | string | null;
      }) => Promise<void>;
      onDelete?: (id: number | string) => Promise<void>;
      onRefresh?: () => Promise<void>;
      onToggleStatus?: (id: number | string) => Promise<void>;
      onSort?: () => void;
      searchVisible?: boolean;
      addButtonVisible?: boolean;
}

export const CourierTypeList: React.FC<CourierTypeListProps> = ({
      courierTypes = [],
      categories = [],
      isLoading = false,
      onAdd,
      onEdit,
      onDelete,
      onRefresh,
      onToggleStatus,
      onSort,
      searchVisible = true,
      addButtonVisible = true,
}) => {
      const { t } = useTranslation(['common', 'courier']);
      const [localSearchTerm, setLocalSearchTerm] = useState('');
      const [showAddDialog, setShowAddDialog] = useState(false);
      const [showEditDialog, setShowEditDialog] = useState(false);
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);
      const [selectedType, setSelectedType] = useState<CourierType | undefined>(undefined);
      const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
      const [toggleStatusLoading, setToggleStatusLoading] = useState<number | string | null>(null);

      // 将快递类型按类别分组
      const groupedTypes = useMemo(() => {
            // 先过滤
            const filteredTypes = courierTypes.filter(type =>
                  type.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                  type.code.toLowerCase().includes(localSearchTerm.toLowerCase())
            );

            // 如果选择了特定类别，只返回该类别的快递类型
            if (selectedCategoryId !== 'all') {
                  return {
                        [selectedCategoryId]: filteredTypes.filter(
                              type => type.category_id && type.category_id.toString() === selectedCategoryId
                        )
                  };
            }

            // 否则按类别分组
            return filteredTypes.reduce((groups: Record<string, CourierType[]>, type) => {
                  const categoryId = type.category_id ? type.category_id.toString() : 'uncategorized';
                  if (!groups[categoryId]) {
                        groups[categoryId] = [];
                  }
                  groups[categoryId].push(type);
                  return groups;
            }, {});
      }, [courierTypes, localSearchTerm, selectedCategoryId]);

      // 处理搜索
      const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalSearchTerm(e.target.value);
      };

      // 处理状态切换
      const handleToggleStatus = async (id: number | string) => {
            if (onToggleStatus) {
                  try {
                        setToggleStatusLoading(id);
                        await onToggleStatus(id);
                  } catch (error) {
                        console.error('状态切换失败:', error);
                  } finally {
                        setToggleStatusLoading(null);
                  }
            }
      };

      // 处理类别筛选变化
      const handleCategoryChange = (value: string) => {
            setSelectedCategoryId(value);
      };

      // 获取类别名称
      const getCategoryName = (categoryId: string) => {
            if (categoryId === 'uncategorized') {
                  return t('courier:uncategorized');
            }
            const category = categories.find(c => c.id.toString() === categoryId);
            return category ? category.name : t('courier:unknown_category');
      };

      // 计算快递类型总数
      const totalTypes = useMemo(() => {
            return Object.values(groupedTypes).reduce((total, types) => total + types.length, 0);
      }, [groupedTypes]);

      // 处理添加快递类型按钮点击
      const handleAddClick = () => {
            setShowAddDialog(true);
      };

      // 处理添加快递类型成功
      const handleAddType = async (data: {
            name: string;
            code: string;
            remark?: string;
            is_active: boolean;
            category_id?: number | string | null;
      }) => {
            if (onAdd) {
                  try {
                        await onAdd(data);
                        setShowAddDialog(false);
                  } catch (error) {
                        // 错误处理已在父组件完成
                  }
            }
      };

      // 处理编辑快递类型按钮点击
      const handleEditClick = (type: CourierType) => {
            setSelectedType(type);
            setShowEditDialog(true);
      };

      // 处理编辑成功
      const handleEditType = async (data: {
            name: string;
            code: string;
            remark?: string;
            is_active: boolean;
            category_id?: number | string | null;
      }) => {
            if (onEdit && selectedType) {
                  try {
                        await onEdit(selectedType.id, data);
                        setShowEditDialog(false);
                  } catch (error) {
                        // 错误处理已在父组件完成
                  }
            }
      };

      // 处理删除快递类型按钮点击
      const handleDeleteClick = (type: CourierType) => {
            setSelectedType(type);
            setShowDeleteDialog(true);
      };

      // 处理删除成功
      const handleDeleteSuccess = async () => {
            if (onDelete && selectedType) {
                  try {
                        await onDelete(selectedType.id);
                        setShowDeleteDialog(false);
                  } catch (error) {
                        console.error('删除处理失败：', error);
                  }
            }
      };

      return (
            <div className="space-y-6">
                  <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                              {searchVisible && (
                                    <div className="relative w-64">
                                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                          <Input
                                                placeholder={t('courier:search_courier_type')}
                                                className="pl-8"
                                                value={localSearchTerm}
                                                onChange={handleSearch}
                                          />
                                    </div>
                              )}
                              {addButtonVisible && (
                                    <Button
                                          onClick={handleAddClick}
                                          className="flex items-center gap-1"
                                    >
                                          <Plus className="h-4 w-4" />
                                          {t('courier:add_courier_type')}
                                    </Button>
                              )}
                        </div>
                  </div>

                  {isLoading ? (
                        <div className="rounded-md border p-8 text-center">
                              <p className="text-muted-foreground">{t('common:loading')}</p>
                        </div>
                  ) : totalTypes === 0 ? (
                        <div className="rounded-md border p-8 text-center">
                              <div className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-2" />
                              <h3 className="text-lg font-medium">{t('courier:no_courier_types_found')}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                    {localSearchTerm
                                          ? t('courier:no_courier_types_matching_search')
                                          : t('courier:add_your_first_courier_type')}
                              </p>
                        </div>
                  ) : (
                        // 按类别分组显示快递类型
                        <div className="space-y-6">
                              {Object.entries(groupedTypes).map(([categoryId, types]) => {
                                    if (types.length === 0) return null;

                                    return (
                                          <div key={categoryId} className="border rounded-md w-full">
                                                <div className="bg-muted p-3 flex justify-between items-center">
                                                      <h3 className="font-medium">
                                                            [{getCategoryName(categoryId)}] {t('courier:types_count', { count: types.length })}
                                                      </h3>
                                                </div>
                                                <div className="w-full overflow-hidden">
                                                      <Table className="table-fixed w-full">
                                                            <TableHeader>
                                                                  <TableRow>
                                                                        <TableHead className="w-[15%]">{t('courier:code')}</TableHead>
                                                                        <TableHead className="w-[25%]">{t('courier:type_name')}</TableHead>
                                                                        <TableHead className="w-[40%]">{t('courier:remark')}</TableHead>
                                                                        <TableHead className="w-[10%] text-center">{t('courier:status')}</TableHead>
                                                                        <TableHead className="w-[10%] text-right">{t('common:actions')}</TableHead>
                                                                  </TableRow>
                                                            </TableHeader>

                                                            <TableBody>
                                                                  {types.map((type) => (
                                                                        <TableRow
                                                                              key={type.id}
                                                                              className={`hover:bg-muted/50 transition-colors ${!type.is_active ? 'bg-gray-50 opacity-60' : ''}`}
                                                                        >
                                                                              <TableCell className="w-[15%] font-mono">{type.code}</TableCell>
                                                                              <TableCell className="w-[25%] font-medium">{type.name}</TableCell>
                                                                              <TableCell className="w-[40%] max-w-xs truncate">
                                                                                    {type.remark || '-'}
                                                                              </TableCell>
                                                                              <TableCell className="w-[10%] text-center">
                                                                                    <div className="flex justify-center">
                                                                                          {toggleStatusLoading === type.id ? (
                                                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                                          ) : (
                                                                                                <Switch
                                                                                                      checked={Boolean(type.is_active)}
                                                                                                      onCheckedChange={() => handleToggleStatus(type.id)}
                                                                                                />
                                                                                          )}
                                                                                    </div>
                                                                              </TableCell>
                                                                              <TableCell className="w-[10%] text-right">
                                                                                    <div className="flex justify-end gap-2">
                                                                                          <Button
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                onClick={() => handleEditClick(type)}
                                                                                          >
                                                                                                <Pencil className="h-4 w-4" />
                                                                                          </Button>
                                                                                          <Button
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                onClick={() => handleDeleteClick(type)}
                                                                                          >
                                                                                                <Trash className="h-4 w-4" />
                                                                                          </Button>
                                                                                    </div>
                                                                              </TableCell>
                                                                        </TableRow>
                                                                  ))}
                                                            </TableBody>
                                                      </Table>
                                                </div>
                                          </div>
                                    );
                              })}
                        </div>
                  )}

                  {/* 删除确认对话框 */}
                  {selectedType && (
                        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                              <AlertDialogContent>
                                    <AlertDialogHeader>
                                          <AlertDialogTitle>{t('courier:delete_courier_type')}</AlertDialogTitle>
                                          <AlertDialogDescription>
                                                {t('courier:delete_courier_type_confirm', { name: selectedType.name })}
                                          </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                          <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
                                          <AlertDialogAction onClick={handleDeleteSuccess} className="bg-red-600 hover:bg-red-700">
                                                {t('common:delete')}
                                          </AlertDialogAction>
                                    </AlertDialogFooter>
                              </AlertDialogContent>
                        </AlertDialog>
                  )}

                  {/* 添加和编辑对话框使用现有的 CourierTypeDialog 组件 */}
                  <CourierTypeDialog
                        open={showAddDialog}
                        onOpenChange={setShowAddDialog}
                        onSave={handleAddType}
                        existingCourierTypes={courierTypes}
                        availableCategories={categories}
                        courierType={null}
                  />

                  {selectedType && (
                        <CourierTypeDialog
                              open={showEditDialog}
                              onOpenChange={setShowEditDialog}
                              courierType={selectedType}
                              onSave={handleEditType}
                              existingCourierTypes={courierTypes}
                              availableCategories={categories}
                        />
                  )}
            </div>
      );
};

export default CourierTypeList; 