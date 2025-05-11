import { useState, useEffect } from 'react';
import { CourierCategoryList } from './CourierCategoryList';
import { CourierCategory } from '@/services/api';
import {
      api
} from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export function CourierCategoryManagementTab() {
      const [categories, setCategories] = useState<CourierCategory[]>([]);
      const [isLoading, setIsLoading] = useState(true);
      const { toast } = useToast();
      const { t } = useTranslation(['common', 'courier']);

      useEffect(() => {
            fetchCategories();
      }, []);

      const fetchCategories = async () => {
            setIsLoading(true);
            try {
                  const data = await api.getCourierCategories();
                  setCategories(data);
            } catch (error) {
                  console.error('获取快递类别失败:', error);
                  toast({
                        variant: 'destructive',
                        title: t('courier:error_loading_categories'),
                        description: error instanceof Error ? error.message : t('common:data_fetch_failed'),
                  });
            } finally {
                  setIsLoading(false);
            }
      };

      const handleAdd = async (category: Omit<CourierCategory, 'id'>) => {
            try {
                  await api.createCourierCategory(category);
                  toast({
                        title: t('courier:category_created'),
                        description: t('courier:category_created_success', { name: category.name }),
                  });
                  await fetchCategories();
            } catch (error) {
                  console.error('添加快递类别失败:', error);
                  toast({
                        variant: 'destructive',
                        title: t('courier:error_creating_category'),
                        description: error instanceof Error ? error.message : t('common:operation_failed'),
                  });
                  throw error;
            }
      };

      const handleEdit = async (id: number | string, category: Partial<CourierCategory>) => {
            try {
                  await api.updateCourierCategory(id, category as { name: string; sort_order?: number });
                  toast({
                        title: t('courier:category_updated'),
                        description: t('courier:category_updated_success', { name: category.name }),
                  });
                  await fetchCategories();
            } catch (error) {
                  console.error('更新快递类别失败:', error);
                  toast({
                        variant: 'destructive',
                        title: t('courier:error_updating_category'),
                        description: error instanceof Error ? error.message : t('common:operation_failed'),
                  });
                  throw error;
            }
      };

      const handleDelete = async (id: number | string) => {
            try {
                  await api.deleteCourierCategory(id);
                  toast({
                        title: t('courier:category_deleted'),
                        description: t('courier:delete_success'),
                  });
                  await fetchCategories();
            } catch (error) {
                  console.error('删除快递类别失败:', error);
                  toast({
                        variant: 'destructive',
                        title: t('courier:error_deleting_category'),
                        description: error instanceof Error ? error.message : t('common:operation_failed'),
                  });
                  throw error;
            }
      };

      const handleSort = async (sortedCategories: { id: number | string; sort_order: number }[]) => {
            try {
                  await api.updateCourierCategoriesOrder(sortedCategories);
                  toast({
                        title: t('courier:sort_updated'),
                        description: t('courier:sort_updated_success'),
                  });
                  await fetchCategories();
            } catch (error) {
                  console.error('更新排序失败:', error);
                  toast({
                        variant: 'destructive',
                        title: t('courier:error_updating_sort'),
                        description: error instanceof Error ? error.message : t('common:operation_failed'),
                  });
                  throw error;
            }
      };

      return (
            <div className="space-y-6">
                  <div>
                        <h2 className="text-xl font-bold">{t('courier:category_management')}</h2>
                        <p className="text-sm text-muted-foreground">
                              {t('courier:manage_categories')}
                        </p>
                  </div>

                  <CourierCategoryList
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