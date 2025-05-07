import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GripVertical } from 'lucide-react';
import { ShopCategory } from '@/lib/types/shop';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';

interface CategorySortModalProps {
  open: boolean;
  categories: ShopCategory[];
  onClose: () => void;
  onSort: (categories: { id: number; sort_order: number }[]) => Promise<void>;
  dialogDescription?: string;
}

export function CategorySortModal({ open, categories, onClose, onSort, dialogDescription }: CategorySortModalProps) {
  const [items, setItems] = useState<ShopCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation(['shop', 'common']);

  // 当categories或open属性变化时，更新items状态
  useEffect(() => {
    if (open && categories && categories.length > 0) {
      setItems([...categories].sort((a, b) => a.sort_order - b.sort_order));
    }
  }, [categories, open]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px的最小拖动距离，避免误触
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const updatedCategories = items.map((item, index) => ({
        id: item.id,
        sort_order: index + 1
      }));

      await onSort(updatedCategories);
    } catch (error) {
      console.error('排序保存失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('shop:adjust_category_sort')}</DialogTitle>
          {dialogDescription && (
            <DialogDescription>{dialogDescription}</DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            {t('shop:drag_to_adjust_order')}
          </p>
          <div className="border rounded-md p-4 max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                {t('shop:no_categories')}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {items.map((category) => (
                      <SortableItem key={category.id} id={category.id} category={category} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
            {t('common:cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || items.length === 0}>
            {isSubmitting ? t('shop:saving') : t('shop:save_sort')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SortableItemProps {
  id: number;
  category: ShopCategory;
}

function SortableItem({ id, category }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center bg-background border rounded-md p-3 select-none"
    >
      <Button
        variant="ghost"
        size="icon"
        className="cursor-grab mr-2"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </Button>
      <span>{category.name}</span>
    </div>
  );
} 