import { useState, useEffect } from 'react';
import { ShopList } from './ShopList';
import { Shop, ShopCategory, ShopFormData, ShopSortItem } from '@/lib/types/shop';
import { getShops, createShop, updateShop, deleteShop, updateShopsSortOrder, toggleShopStatus } from '@/lib/api/shop';
import { getShopCategories } from '@/lib/api/shop-category';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import ShopSortModal from './ShopSortModal';

export function ShopManagementTab() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [showSortModal, setShowSortModal] = useState(false);
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
      const result = await createShop(shopData);

      if (result && result.code === 0) {
        // 添加返回的新店铺到本地状态
        const newShop: Shop = {
          id: result.data.id,
          name: shopData.name,
          is_active: Boolean(shopData.is_active),
          sort_order: shopData.sort_order || 0,
          category_id: shopData.category_id || 0, // 确保category_id不为undefined
          remark: shopData.remark,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setShops(prevShops =>
          [...prevShops, newShop].sort((a, b) => a.sort_order - b.sort_order)
        );

        toast({
          title: t('shop:shop_added'),
          description: t('shop:shop_add_success', { name: shopData.name }),
        });
        // 不再调用fetchShops()
      } else {
        throw new Error(result?.message || t('shop:error_adding_shop'));
      }
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
      const result = await updateShop(id, shopData);

      if (result && result.code === 0) {
        // 本地更新状态，避免重新获取整个列表
        setShops(prevShops =>
          prevShops.map(s =>
            s.id === id ? { ...s, ...shopData } : s
          )
        );

        toast({
          title: t('shop:shop_updated'),
          description: t('shop:shop_update_success', { name: shopData.name || t('shop:shop') }),
        });
        // 不再调用fetchShops()
      } else {
        throw new Error(result?.message || t('shop:error_updating_shop'));
      }
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

  const refreshShops = async () => {
    // 现在我们采用本地状态更新，大多数情况下不需要重新获取数据
    // 但保留此函数作为必要时重新获取数据的方法
    await fetchShops();
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      const result = await deleteShop(id);

      if (result && result.code === 0) {
        // 找到被删除的店铺信息，用于显示更友好的消息
        const deletedShop = shops.find(shop => shop.id === id);
        const shopName = deletedShop ? deletedShop.name : '未知店铺';

        // 删除本地状态中的店铺
        setShops(prevShops => prevShops.filter(shop => shop.id !== id));

        // 显示成功消息
        toast({
          title: t('shop:shop_deleted'),
          description: t('shop:shop_delete_success', { name: shopName }),
        });

        // 无需再返回true或调用fetchShops
      } else {
        throw new Error(result?.message || t('shop:error_deleting_shop'));
      }
    } catch (error) {
      console.error('删除店铺失败:', error);

      // 检查错误信息是否表明店铺不存在
      const errorMessage = error instanceof Error ? error.message : '';
      const isShopNotFoundError = errorMessage.includes('不存在');

      // 如果是因为店铺不存在而失败，仍然更新本地状态（因为店铺已经被删除）
      if (isShopNotFoundError) {
        // 从本地状态中移除店铺
        setShops(prevShops => prevShops.filter(shop => shop.id !== id));
        toast({
          title: t('shop:shop_deleted'),
          description: t('shop:shop_delete_success', { name: '店铺' }),
        });
      } else {
        // 其他类型的错误，显示错误提示
        toast({
          variant: 'destructive',
          title: t('shop:error_deleting_shop'),
          description: error instanceof Error ? error.message : t('common:operation_failed'),
        });
        throw error; // 重新抛出错误，让调用者知道操作失败
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const shop = shops.find(s => s.id === id);
      if (!shop) return;

      const result = await toggleShopStatus(id);

      if (result && result.code === 0) {
        // 本地更新状态，避免重新获取整个列表
        setShops(prevShops =>
          prevShops.map(s =>
            s.id === id ? { ...s, is_active: !s.is_active } : s
          )
        );

        toast({
          title: t('shop:status_updated'),
          description: shop.is_active
            ? t('shop:shop_deactivated', { name: shop.name })
            : t('shop:shop_activated', { name: shop.name })
        });

        // 不再调用fetchShops()
      } else {
        throw new Error(result?.message || t('shop:error_updating_status'));
      }
    } catch (error) {
      console.error('切换店铺状态失败:', error);
      toast({
        variant: 'destructive',
        title: t('shop:error_updating_status'),
        description: error instanceof Error ? error.message : t('common:operation_failed'),
      });
    }
  };

  const handleSort = () => {
    setShowSortModal(true);
  };

  const handleSortSave = async (sortedShops: Shop[]) => {
    try {
      // 准备排序数据
      const sortItems: ShopSortItem[] = sortedShops.map(shop => ({
        id: shop.id,
        sort_order: shop.sort_order
      }));

      // 调用API保存排序
      const result = await updateShopsSortOrder(sortItems);

      if (result && result.code === 0) {
        // 更新本地状态
        setShops(sortedShops);

        toast({
          title: t('shop:sort_updated'),
          description: t('shop:sort_update_success'),
        });
      } else {
        throw new Error(result?.message || t('shop:error_updating_sort'));
      }
    } catch (error) {
      console.error('更新店铺排序失败:', error);
      toast({
        variant: 'destructive',
        title: t('shop:error_updating_sort'),
        description: error instanceof Error ? error.message : t('common:operation_failed'),
      });
      throw error;
    }
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
        onRefresh={refreshShops}
        onToggleStatus={handleToggleStatus}
        onSort={handleSort}
      />

      <ShopSortModal
        open={showSortModal}
        onOpenChange={setShowSortModal}
        shops={shops}
        categories={categories}
        onSortSave={handleSortSave}
      />
    </div>
  );
} 