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

export function CategoryManagementTab() {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
        title: '获取店铺类别失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (category: Omit<ShopCategory, 'id'>) => {
    try {
      await createShopCategory(category);
      toast({
        title: '添加成功',
        description: `类别 "${category.name}" 已成功添加`,
      });
      await fetchCategories();
    } catch (error) {
      console.error('添加店铺类别失败:', error);
      toast({
        variant: 'destructive',
        title: '添加失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      });
      throw error;
    }
  };

  const handleEdit = async (id: number, category: Partial<ShopCategory>) => {
    try {
      await updateShopCategory(id, category);
      toast({
        title: '更新成功',
        description: `类别 "${category.name}" 已成功更新`,
      });
      await fetchCategories();
    } catch (error) {
      console.error('更新店铺类别失败:', error);
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
      await deleteShopCategory(id);
      toast({
        title: '删除成功',
        description: '店铺类别已成功删除',
      });
      await fetchCategories();
    } catch (error) {
      console.error('删除店铺类别失败:', error);
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      });
      throw error;
    }
  };

  const handleSort = async (sortedCategories: { id: number; sort_order: number }[]) => {
    try {
      await updateCategorySort(sortedCategories);
      toast({
        title: '排序更新成功',
        description: '店铺类别顺序已成功更新',
      });
      await fetchCategories();
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
        <h2 className="text-xl font-bold">店铺类别管理</h2>
        <p className="text-sm text-muted-foreground">
          管理店铺类别，用于对店铺进行分类。
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