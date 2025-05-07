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
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash,
  Store,
  Filter
} from "lucide-react";
import { Shop, ShopCategory, ShopFormData } from "@/lib/types/shop";
import AddShopDialog from './AddShopDialog';
import EditShopDialog from './EditShopDialog';
import { DeleteShopDialog } from './DeleteShopDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ShopListProps {
  shops: Shop[];
  categories: ShopCategory[];
  isLoading?: boolean;
  onAdd?: (shop: ShopFormData) => Promise<void>;
  onEdit?: (id: number, shop: ShopFormData) => Promise<void>;
  onRefresh?: () => Promise<void>;
  onToggleStatus?: (id: number) => Promise<void>;
  onSort?: () => void;
}

export const ShopList: React.FC<ShopListProps> = ({
  shops = [],
  categories = [],
  isLoading = false,
  onAdd,
  onEdit,
  onRefresh,
  onToggleStatus,
  onSort,
}) => {
  const { t } = useTranslation(['common', 'shop']);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // 将店铺按类别分组
  const groupedShops = useMemo(() => {
    // 先过滤
    const filteredShops = shops.filter(shop =>
      shop.name.toLowerCase().includes(localSearchTerm.toLowerCase())
    );

    // 如果选择了特定类别，只返回该类别的店铺
    if (selectedCategoryId !== 'all') {
      return {
        [selectedCategoryId]: filteredShops.filter(
          shop => shop.category_id && shop.category_id.toString() === selectedCategoryId
        )
      };
    }

    // 否则按类别分组
    return filteredShops.reduce((groups: Record<string, Shop[]>, shop) => {
      const categoryId = shop.category_id ? shop.category_id.toString() : 'uncategorized';
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(shop);
      return groups;
    }, {});
  }, [shops, localSearchTerm, selectedCategoryId]);

  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  // 处理状态切换
  const handleToggleStatus = (id: number) => {
    if (onToggleStatus) {
      onToggleStatus(id);
    }
  };

  // 处理类别筛选变化
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
  };

  // 获取类别名称
  const getCategoryName = (categoryId: number | string | undefined) => {
    if (!categoryId) return t('shop:uncategorized');
    const category = categories.find(c => c.id.toString() === categoryId.toString());
    return category ? category.name : t('shop:uncategorized');
  };

  // 计算店铺总数
  const totalShops = useMemo(() => {
    return Object.values(groupedShops).reduce((total, shops) => total + shops.length, 0);
  }, [groupedShops]);

  // 转换Shop到ShopFormData
  const convertToFormData = (shop: Shop): ShopFormData => {
    return {
      name: shop.name,
      is_active: Boolean(shop.is_active),
      sort_order: shop.sort_order,
      category_id: shop.category_id,
      remark: shop.remark
    };
  };

  // 处理添加店铺成功
  const handleAddSuccess = async (data: ShopFormData): Promise<void> => {
    if (onAdd) {
      return onAdd(data);
    }
    return Promise.resolve();
  };

  // 处理编辑店铺按钮点击
  const handleEditClick = (shop: Shop) => {
    setSelectedShop(shop);
    setShowEditDialog(true);
  };

  // 处理编辑成功
  const handleEditSuccess = async (data: ShopFormData) => {
    if (selectedShop && onEdit) {
      try {
        await onEdit(selectedShop.id, data);
      } catch (error) {
        // 错误会在onEdit内部处理
        console.error('编辑店铺出错:', error);
      }
    }
    setShowEditDialog(false);
    setSelectedShop(undefined);
  };

  // 处理删除店铺按钮点击
  const handleDeleteClick = (shop: Shop) => {
    setSelectedShop(shop);
    setShowDeleteDialog(true);
  };

  // 处理删除成功
  const handleDeleteSuccess = () => {
    // 关闭删除对话框
    setShowDeleteDialog(false);
    // 重置选中的店铺
    setSelectedShop(null);
    // 刷新列表
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('shop:search_shop')}
              className="pl-8"
              value={localSearchTerm}
              onChange={handleSearch}
            />
          </div>
          <Select
            value={selectedCategoryId}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('shop:filter_by_category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('shop:all_categories')}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            {t('shop:add_shop')}
          </Button>
        </div>
        <Button variant="outline" onClick={onSort}>
          {t('shop:sort_shops')}
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground">{t('common:loading')}</p>
        </div>
      ) : totalShops === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <Store className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-2" />
          <h3 className="text-lg font-medium">{t('shop:no_shops_found')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {localSearchTerm
              ? t('shop:no_shops_matching_search')
              : t('shop:add_your_first_shop')}
          </p>
        </div>
      ) : (
        // 按类别分组显示店铺
        <div className="space-y-6">
          {Object.entries(groupedShops).map(([categoryId, shops]) => {
            if (shops.length === 0) return null;

            return (
              <div key={categoryId} className="border rounded-md w-full">
                <div className="bg-muted p-3 flex justify-between items-center">
                  <h3 className="font-medium">
                    [{getCategoryName(categoryId)}] {t('shop:shops_count', { count: shops.length })}
                  </h3>
                </div>
                <div className="w-full overflow-hidden">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/4">{t('shop:shop_name')}</TableHead>
                        <TableHead className="w-1/6 text-center">{t('shop:status')}</TableHead>
                        <TableHead className="w-1/6 text-center">{t('shop:sort_order')}</TableHead>
                        <TableHead className="w-1/3">{t('shop:remark')}</TableHead>
                        <TableHead className="w-1/6 text-right">{t('common:actions')}</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {shops.map((shop) => (
                        <TableRow
                          key={shop.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="w-1/4 font-medium">{shop.name}</TableCell>
                          <TableCell className="w-1/6 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={Boolean(shop.is_active)}
                                onCheckedChange={() => handleToggleStatus(shop.id)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="w-1/6 text-center">{shop.sort_order}</TableCell>
                          <TableCell className="w-1/3 max-w-xs truncate">
                            {shop.remark || '-'}
                          </TableCell>
                          <TableCell className="w-1/6 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(shop)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(shop)}
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

      {/* 底部总计信息 */}
      <div className="text-sm text-muted-foreground">
        {t('shop:total_shops', { count: totalShops })}
      </div>

      {/* 添加店铺对话框 */}
      <AddShopDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddSuccess}
        categories={categories}
      />

      {/* 编辑店铺对话框 */}
      <EditShopDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleEditSuccess}
        shop={selectedShop}
        categories={categories}
      />

      {/* 删除店铺对话框 */}
      <DeleteShopDialog
        shop={selectedShop || null}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleted={handleDeleteSuccess}
      />
    </div>
  );
};

export default ShopList; 