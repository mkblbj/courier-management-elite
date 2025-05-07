import { useState } from 'react';
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
import { PlusCircle, Search, ArrowUpDown, Edit, Trash, GripVertical } from 'lucide-react';
import { ShopCategory } from '@/lib/types/shop';
import { CategoryForm } from './CategoryForm';
import { CategorySortModal } from './CategorySortModal';
import { DeleteCategoryDialog } from './DeleteCategoryDialog';

interface CategoryListProps {
  categories: ShopCategory[];
  isLoading: boolean;
  onAdd: (category: Omit<ShopCategory, 'id'>) => Promise<void>;
  onEdit: (id: number, category: Partial<ShopCategory>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onSort: (categories: { id: number; sort_order: number }[]) => Promise<void>;
}

export function CategoryList({ 
  categories, 
  isLoading, 
  onAdd, 
  onEdit, 
  onDelete, 
  onSort 
}: CategoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ShopCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ShopCategory | null>(null);
  const [showSortModal, setShowSortModal] = useState(false);

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (sortOrder: { id: number; sort_order: number }[]) => {
    onSort(sortOrder);
    setShowSortModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setShowAddDialog(true)}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            添加类别
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSortModal(true)}
          >
            <GripVertical className="w-4 h-4 mr-2" />
            调整排序
          </Button>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索类别..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">
                类别名称
                <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
              </TableHead>
              <TableHead className="w-[100px]">排序</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  {searchTerm ? '没有找到匹配的类别' : '暂无类别数据，请添加'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.sort_order}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingCategory(category)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>共 {filteredCategories.length} 个类别</span>
      </div>

      {showAddDialog && (
        <CategoryForm
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onSubmit={async (data) => {
            await onAdd(data);
            setShowAddDialog(false);
          }}
        />
      )}

      {editingCategory && (
        <CategoryForm
          open={!!editingCategory}
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSubmit={async (data) => {
            await onEdit(editingCategory.id, data);
            setEditingCategory(null);
          }}
        />
      )}

      {deletingCategory && (
        <DeleteCategoryDialog
          category={deletingCategory}
          open={!!deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onConfirm={async () => {
            await onDelete(deletingCategory.id);
            setDeletingCategory(null);
          }}
        />
      )}

      <CategorySortModal
        open={showSortModal}
        categories={categories}
        onClose={() => setShowSortModal(false)}
        onSort={handleSort}
      />
    </div>
  );
} 