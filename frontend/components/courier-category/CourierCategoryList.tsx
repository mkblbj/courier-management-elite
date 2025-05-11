import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
      Table,
      TableBody,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
} from '@/components/ui/table';
import { PlusCircle, Search, ArrowUpDown, Edit, Trash, GripVertical, ArrowDown, ArrowUp } from 'lucide-react';
import { CourierCategory } from '@/services/api';
import { CourierCategoryForm } from './CourierCategoryForm';
import { CourierCategorySortModal } from './CourierCategorySortModal';
import { DeleteCourierCategoryDialog } from './DeleteCourierCategoryDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

type SortDirection = 'asc' | 'desc' | null;
type SortField = 'name' | 'sort_order' | null;

interface CourierCategoryListProps {
      categories: CourierCategory[];
      isLoading: boolean;
      onAdd: (category: Omit<CourierCategory, 'id'>) => Promise<void>;
      onEdit: (id: number | string, category: Partial<CourierCategory>) => Promise<void>;
      onDelete: (id: number | string) => Promise<void>;
      onSort: (categories: { id: number | string; sort_order: number }[]) => Promise<void>;
}

export function CourierCategoryList({
      categories,
      isLoading,
      onAdd,
      onEdit,
      onDelete,
      onSort
}: CourierCategoryListProps) {
      const [searchTerm, setSearchTerm] = useState('');
      const [showAddDialog, setShowAddDialog] = useState(false);
      const [editingCategory, setEditingCategory] = useState<CourierCategory | null>(null);
      const [deletingCategory, setDeletingCategory] = useState<CourierCategory | null>(null);
      const [showSortModal, setShowSortModal] = useState(false);
      const [currentPage, setCurrentPage] = useState(1);
      const [sortField, setSortField] = useState<SortField>(null);
      const [sortDirection, setSortDirection] = useState<SortDirection>(null);
      const { t } = useTranslation(['common', 'courier']);

      // 每页显示的项目数
      const itemsPerPage = 10;

      // 过滤类别
      const filteredCategories = useMemo(() => {
            return categories.filter(category =>
                  category.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
      }, [categories, searchTerm]);

      // 排序类别
      const sortedCategories = useMemo(() => {
            if (!sortField || !sortDirection) {
                  return [...filteredCategories];
            }

            return [...filteredCategories].sort((a, b) => {
                  if (sortField === 'name') {
                        return sortDirection === 'asc'
                              ? a.name.localeCompare(b.name)
                              : b.name.localeCompare(a.name);
                  } else if (sortField === 'sort_order') {
                        return sortDirection === 'asc'
                              ? a.sort_order - b.sort_order
                              : b.sort_order - a.sort_order;
                  }
                  return 0;
            });
      }, [filteredCategories, sortField, sortDirection]);

      // 计算总页数
      const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);

      // 获取当前页的数据
      const paginatedCategories = useMemo(() => {
            return sortedCategories.slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
            );
      }, [sortedCategories, currentPage, itemsPerPage]);

      const handleSort = async (sortOrder: { id: number | string; sort_order: number }[]) => {
            await onSort(sortOrder);
            setShowSortModal(false);
      };

      // 处理列标题排序点击
      const handleSortClick = (field: SortField) => {
            if (field === 'sort_order' && !sortField && !sortDirection) {
                  // 如果点击的是排序列，且当前没有排序，则打开排序模态框
                  setShowSortModal(true);
                  return;
            }

            // 更新排序状态
            if (sortField === field) {
                  // 如果点击的是当前排序的字段，切换方向或清除排序
                  if (sortDirection === 'asc') {
                        setSortDirection('desc');
                  } else if (sortDirection === 'desc') {
                        setSortField(null);
                        setSortDirection(null);
                  }
            } else {
                  // 设置新的排序字段和方向
                  setSortField(field);
                  setSortDirection('asc');
            }

            // 重置到第一页
            setCurrentPage(1);
      };

      // 获取排序图标
      const getSortIcon = (field: SortField) => {
            if (sortField !== field) {
                  return <ArrowUpDown className="h-4 w-4" />;
            }

            return sortDirection === 'asc' ?
                  <ArrowUp className="h-4 w-4" /> :
                  <ArrowDown className="h-4 w-4" />;
      };

      return (
            <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-2">
                              <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setShowAddDialog(true)}
                              >
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    {t('courier:add_category')}
                              </Button>
                              <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowSortModal(true)}
                              >
                                    <GripVertical className="w-4 h-4 mr-2" />
                                    {t('courier:adjust_sort')}
                              </Button>
                        </div>
                        <div className="relative w-full sm:w-64">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                    placeholder={t('courier:search_category')}
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => {
                                          setSearchTerm(e.target.value);
                                          setCurrentPage(1); // 重置到第一页
                                    }}
                              />
                        </div>
                  </div>

                  <div className="border rounded-md">
                        <Table>
                              <TableHeader>
                                    <TableRow>
                                          <TableHead className="w-[400px]">
                                                <button
                                                      className="flex items-center space-x-1"
                                                      onClick={() => handleSortClick('name')}
                                                >
                                                      <span>{t('courier:category_name')}</span>
                                                      {getSortIcon('name')}
                                                </button>
                                          </TableHead>
                                          <TableHead className="w-[100px]">
                                                <button
                                                      className="flex items-center space-x-1"
                                                      onClick={() => handleSortClick('sort_order')}
                                                >
                                                      <span>{t('courier:sort_order')}</span>
                                                      {getSortIcon('sort_order')}
                                                </button>
                                          </TableHead>
                                          <TableHead className="text-right">{t('common:actions')}</TableHead>
                                    </TableRow>
                              </TableHeader>
                              <TableBody>
                                    {isLoading ? (
                                          Array.from({ length: 5 }).map((_, index) => (
                                                <TableRow key={index}>
                                                      <TableCell colSpan={3}>
                                                            <Skeleton className="h-10 w-full" />
                                                      </TableCell>
                                                </TableRow>
                                          ))
                                    ) : paginatedCategories.length === 0 ? (
                                          <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center">
                                                      {searchTerm ? t('courier:no_matching_categories') : t('courier:no_categories')}
                                                </TableCell>
                                          </TableRow>
                                    ) : (
                                          paginatedCategories.map((category) => (
                                                <TableRow key={category.id}>
                                                      <TableCell className="font-medium">{category.name}</TableCell>
                                                      <TableCell>{category.sort_order}</TableCell>
                                                      <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                  <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => setEditingCategory(category)}
                                                                        aria-label={t('common:edit')}
                                                                  >
                                                                        <Edit className="h-4 w-4" />
                                                                  </Button>
                                                                  <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => setDeletingCategory(category)}
                                                                        aria-label={t('common:delete')}
                                                                  >
                                                                        <Trash className="h-4 w-4" />
                                                                  </Button>
                                                            </div>
                                                      </TableCell>
                                                </TableRow>
                                          ))
                                    )}
                              </TableBody>
                        </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                        <div className="flex justify-between items-center">
                              <div className="text-sm text-muted-foreground">
                                    {t('common:page_info', { current: currentPage, total: totalPages })}
                              </div>
                              <div className="flex space-x-2">
                                    <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                          disabled={currentPage === 1}
                                    >
                                          {t('common:previous')}
                                    </Button>
                                    <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                          disabled={currentPage === totalPages}
                                    >
                                          {t('common:next')}
                                    </Button>
                              </div>
                        </div>
                  )}

                  {/* 表单对话框 */}
                  {showAddDialog && (
                        <CourierCategoryForm
                              open={showAddDialog}
                              onClose={() => setShowAddDialog(false)}
                              onSubmit={onAdd}
                        />
                  )}

                  {/* 编辑对话框 */}
                  {editingCategory && (
                        <CourierCategoryForm
                              open={!!editingCategory}
                              category={editingCategory}
                              onClose={() => setEditingCategory(null)}
                              onSubmit={(data) => onEdit(editingCategory.id, data)}
                        />
                  )}

                  {/* 删除确认对话框 */}
                  {deletingCategory && (
                        <DeleteCourierCategoryDialog
                              open={!!deletingCategory}
                              category={deletingCategory}
                              onClose={() => setDeletingCategory(null)}
                              onConfirm={async () => {
                                    await onDelete(deletingCategory.id);
                                    setDeletingCategory(null);
                              }}
                        />
                  )}

                  {/* 排序模态框 */}
                  <CourierCategorySortModal
                        open={showSortModal}
                        categories={categories}
                        onClose={() => setShowSortModal(false)}
                        onSort={handleSort}
                        dialogDescription={t('courier:adjust_category_order_description')}
                  />
            </div>
      );
} 