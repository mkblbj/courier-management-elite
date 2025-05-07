import { useState, useEffect } from 'react';
import { CategoryList } from './CategoryList';
import { ShopCategory } from '@/lib/types/shop';
import { 
  getShopCategories, 
  createShopCategory, 
  updateShopCategory,
  deleteShopCategory,
  updateCategorySort
} from '@/lib/api/shop-category';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export function CategoryManagementTab() {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation(['common', 'shop']);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleAdd = async (category: Omit<ShopCategory, 'id'>) => {
    try {
      await createShopCategory(category);
      toast({
        title: t('shop:category_created'),
        description: t('shop:category_updated_success', { name: category.name }),
      });
      await fetchCategories();
    } catch (error) {
      console.error('添加店铺类别失败:', error);
      toast({
        variant: 'destructive',
        title: t('shop:error_creating_category'),
        description: error instanceof Error ? error.message : t('common:operation_failed'),
      });
      throw error;
    }
  };

  const handleEdit = async (id: number, category: Partial<ShopCategory>) => {
    try {
      await updateShopCategory(id, category);
      toast({
        title: t('shop:category_updated'),
        description: t('shop:category_updated_success', { name: category.name }),
      });
      await fetchCategories();
    } catch (error) {
      console.error('更新店铺类别失败:', error);
      toast({
        variant: 'destructive',
        title: t('shop:error_updating_category'),
        description: error instanceof Error ? error.message : t('common:operation_failed'),
      });
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteShopCategory(id);
      toast({
        title: t('shop:category_deleted'),
        description: t('shop:delete_success'),
      });
      await fetchCategories();
    } catch (error) {
      console.error('删除店铺类别失败:', error);
      toast({
        variant: 'destructive',
        title: t('shop:error_deleting_category'),
        description: error instanceof Error ? error.message : t('common:operation_failed'),
      });
      throw error;
    }
  };

  const handleSort = async (sortedCategories: { id: number; sort_order: number }[]) => {
    try {
      await updateCategorySort(sortedCategories);
      toast({
        title: t('shop:sort_updated'),
        description: t('shop:sort_updated_success'),
      });
      await fetchCategories();
    } catch (error) {
      console.error('更新排序失败:', error);
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
        <h2 className="text-xl font-bold">{t('shop:category_management')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('shop:manage_categories')}
        </p>
      </div>

      <CategoryList
        categories={categories}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSort={handleSort}
      />
    </div>
  );
} 