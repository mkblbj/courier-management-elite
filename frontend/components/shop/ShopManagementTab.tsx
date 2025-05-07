import { useState, useEffect } from 'react';
import { ShopList } from './ShopList';
import { Shop, ShopCategory, ShopFormData } from '@/lib/types/shop';
import { getShops, createShop, updateShop, deleteShop, updateShopSort, toggleShopStatus } from '@/lib/api/shop';
import { getShopCategories } from '@/lib/api/shop-category';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export function ShopManagementTab() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation(['common', 'shop']);

  useEffect(() => {
    fetchShops();
    fetchCategories();
  }, []);

  const fetchShops = async () => {
    setIsLoading(true);
    try {
      const data = await getShops({ sort: 'sort_order', order: 'ASC' });
      setShops(data);
    } catch (error) {
      console.error('获取店铺列表失败:', error);
      toast({
        variant: 'destructive',
        title: t('shop:error_loading_shops'),
        description: error instanceof Error ? error.message : t('common:data_fetch_failed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const data = await getShopCategories({ sort: 'sort_order', order: 'ASC' });
      setCategories(data);
    } catch (error) {
      console.error('获取店铺类别失败:', error);
      toast({
        variant: 'destructive',
        title: t('shop:error_loading_categories'),
        description: error instanceof Error ? error.message : t('common:data_fetch_failed'),
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleAdd = async (shopData: ShopFormData) => {
    try {
      await createShop(shopData);
      toast({
        title: t('shop:shop_added'),
        description: t('shop:shop_add_success', { name: shopData.name }),
      });
      await fetchShops();
    } catch (error) {
      console.error('添加店铺失败:', error);
      toast({
        variant: 'destructive',
        title: t('shop:error_adding_shop'),
        description: error instanceof Error ? error.message : t('common:operation_failed'),
      });
      throw error;
    }
  };

  const handleEdit = async (id: number, shopData: ShopFormData) => {
    try {
      await updateShop(id, shopData);
      toast({
        title: t('shop:shop_updated'),
        description: t('shop:shop_update_success', { name: shopData.name || t('shop:shop') }),
      });
      await fetchShops();
    } catch (error) {
      console.error('更新店铺失败:', error);
      toast({
        variant: 'destructive',
        title: t('shop:error_updating_shop'),
        description: error instanceof Error ? error.message : t('common:operation_failed'),
      });
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteShop(id);
      toast({
        title: t('shop:shop_deleted'),
        description: t('shop:delete_success'),
      });
      await fetchShops();
    } catch (error) {
      console.error('删除店铺失败:', error);
      toast({
        variant: 'destructive',
        title: t('shop:error_deleting_shop'),
        description: error instanceof Error ? error.message : t('common:operation_failed'),
      });
      throw error;
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const shop = shops.find(s => s.id === id);
      if (!shop) return;

      await toggleShopStatus(id);
      toast({
        title: t('shop:status_updated'),
        description: t('shop:status_update_success', {
          name: shop.name,
          status: shop.is_active ? t('shop:disabled') : t('shop:enabled')
        }),
      });
      await fetchShops();
    } catch (error) {
      console.error('切换店铺状态失败:', error);
      toast({
        variant: 'destructive',
        title: t('shop:error_updating_status'),
        description: error instanceof Error ? error.message : t('common:operation_failed'),
      });
      throw error;
    }
  };

  const handleSort = async () => {
    // 这里只负责打开排序对话框，具体排序逻辑在ShopSortModal中处理
    // 后续会实现ShopSortModal组件
    toast({
      title: t('shop:sort_feature'),
      description: t('shop:sort_feature_coming_soon'),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{t('shop:shop_management')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('shop:manage_shops_description')}
        </p>
      </div>

      <ShopList
        shops={shops}
        categories={categories}
        isLoading={isLoading || isLoadingCategories}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onSort={handleSort}
      />
    </div>
  );
} 