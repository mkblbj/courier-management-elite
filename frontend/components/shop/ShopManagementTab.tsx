import { useState, useEffect } from 'react';
import { ShopList } from './ShopList';
import { Shop, ShopCategory } from '@/lib/types/shop';
import { getShops, createShop, updateShop, deleteShop, updateShopSort, toggleShopStatus } from '@/lib/api/shop';
import { getShopCategories } from '@/lib/api/shop-category';
import { useToast } from '@/components/ui/use-toast';

export function ShopManagementTab() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { toast } = useToast();

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
        title: '获取店铺列表失败',
        description: error instanceof Error ? error.message : '请稍后重试',
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
        title: '获取店铺类别失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleAdd = async (shop: Omit<Shop, 'id'>) => {
    try {
      await createShop(shop);
      toast({
        title: '添加成功',
        description: `店铺 "${shop.name}" 已成功添加`,
      });
      await fetchShops();
    } catch (error) {
      console.error('添加店铺失败:', error);
      toast({
        variant: 'destructive',
        title: '添加失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      });
      throw error;
    }
  };

  const handleEdit = async (id: number, shop: Partial<Shop>) => {
    try {
      await updateShop(id, shop);
      toast({
        title: '更新成功',
        description: `店铺 "${shop.name || '店铺'}" 已成功更新`,
      });
      await fetchShops();
    } catch (error) {
      console.error('更新店铺失败:', error);
      toast({
        variant: 'destructive',
        title: '更新失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      });
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteShop(id);
      toast({
        title: '删除成功',
        description: '店铺已成功删除',
      });
      await fetchShops();
    } catch (error) {
      console.error('删除店铺失败:', error);
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: error instanceof Error ? error.message : '请稍后重试',
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
        title: '状态更新成功',
        description: `店铺 "${shop.name}" 已${shop.is_active ? '禁用' : '启用'}`,
      });
      await fetchShops();
    } catch (error) {
      console.error('切换店铺状态失败:', error);
      toast({
        variant: 'destructive',
        title: '状态更新失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      });
      throw error;
    }
  };

  const handleSort = async (sortedShops: { id: number; sort_order: number }[]) => {
    try {
      await updateShopSort(sortedShops);
      toast({
        title: '排序更新成功',
        description: '店铺顺序已成功更新',
      });
      await fetchShops();
    } catch (error) {
      console.error('更新排序失败:', error);
      toast({
        variant: 'destructive',
        title: '排序更新失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      });
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">店铺管理</h2>
        <p className="text-sm text-muted-foreground">
          管理店铺信息，包括店铺状态、排序等。
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