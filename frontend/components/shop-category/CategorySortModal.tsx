import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

interface CategorySortModalProps {
  open: boolean;
  categories: ShopCategory[];
  onClose: () => void;
  onSort: (categories: { id: number; sort_order: number }[]) => Promise<void>;
}

export function CategorySortModal({ open, categories, onClose, onSort }: CategorySortModalProps) {
  const [items, setItems] = useState(() => 
    [...categories].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
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
    setIsSubmitting(true);
    try {
      const updatedCategories = items.map((item, index) => ({
        id: item.id,
        sort_order: index + 1
      }));
      
      await onSort(updatedCategories);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>调整类别排序</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            拖拽调整类别顺序，完成后点击保存排序按钮。
          </p>
          <div className="border rounded-md p-4 max-h-[60vh] overflow-y-auto">
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
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '保存排序'}
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