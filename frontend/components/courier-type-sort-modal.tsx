import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GripVertical } from 'lucide-react';
import { CourierType, CourierCategory } from '@/services/api';
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
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// 排序项组件
function SortableItem({ id, courierType }: { id: number | string; courierType: CourierType }) {
      const { t } = useTranslation(['courier', 'common']);

      const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging
      } = useSortable({ id });

      const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            zIndex: isDragging ? 1 : 0,
            opacity: isDragging ? 0.8 : 1,
            boxShadow: isDragging ? "0 0 10px rgba(0, 0, 0, 0.15)" : "none",
            background: isDragging ? "rgba(243, 244, 246, 1)" : "transparent",
            scale: isDragging ? "1.02" : "1",
      };

      return (
            <div
                  ref={setNodeRef}
                  style={style}
                  className="flex items-center p-3 border-b last:border-b-0 bg-background dark:bg-gray-800 hover:bg-muted dark:hover:bg-gray-700 transition-colors"
            >
                  <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-grab mr-2 text-gray-400 hover:text-gray-600"
                        {...attributes}
                        {...listeners}
                  >
                        <GripVertical className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                        <div className="font-medium">{courierType.name}</div>
                        <div className="text-xs text-muted-foreground">{courierType.code}</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-md bg-muted">
                        {courierType.is_active ? t('courier:courier_status_active') : t('courier:courier_status_inactive')}
                  </div>
            </div>
      );
}

// 每个类别的快递类型列表组件
function CategoryCourierTypeList({
      category,
      courierTypes,
      onDragEnd,
}: {
      category: CourierCategory;
      courierTypes: CourierType[];
      onDragEnd: (event: DragEndEvent, categoryId: number | string) => void;
}) {
      const { t } = useTranslation(['courier', 'common']);

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

      return (
            <div className="mb-4">
                  <div className="bg-muted dark:bg-gray-700 p-2 font-medium text-gray-700 dark:text-gray-300 rounded-t-md">
                        {category.name} ({courierTypes.length}{t('courier:types_count', { count: courierTypes.length })})
                  </div>
                  <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => onDragEnd(event, category.id)}
                        modifiers={[restrictToVerticalAxis]}
                  >
                        <SortableContext
                              items={courierTypes.map((item) => item.id)}
                              strategy={verticalListSortingStrategy}
                        >
                              <div className="border border-gray-200 rounded-b-md overflow-hidden">
                                    {courierTypes.map((courierType) => (
                                          <SortableItem key={courierType.id} id={courierType.id} courierType={courierType} />
                                    ))}
                                    {courierTypes.length === 0 && (
                                          <div className="p-3 text-gray-500 text-sm italic">{t('common:no_data')}</div>
                                    )}
                              </div>
                        </SortableContext>
                  </DndContext>
            </div>
      );
}

interface CourierTypeSortModalProps {
      open: boolean;
      courierTypes: CourierType[];
      categories: CourierCategory[];
      onClose: () => void;
      onSort: (courierTypes: { id: number | string; sort_order: number }[]) => Promise<void>;
      dialogDescription?: string;
}

export function CourierTypeSortModal({
      open,
      courierTypes,
      categories,
      onClose,
      onSort,
      dialogDescription
}: CourierTypeSortModalProps) {
      const { t } = useTranslation(['courier', 'common']);

      const [sortedTypes, setSortedTypes] = useState<CourierType[]>([]);
      const [isSubmitting, setIsSubmitting] = useState(false);

      // 为Dialog生成唯一ID，用于aria-describedby
      const dialogDescriptionId = "courier-type-sort-description";

      // 当courierTypes或open属性变化时，更新sortedTypes状态
      useEffect(() => {
            if (open && courierTypes && courierTypes.length > 0) {
                  setSortedTypes([...courierTypes].sort((a, b) => a.sort_order - b.sort_order));
            }
      }, [courierTypes, open]);

      const handleDragEnd = (event: DragEndEvent, categoryId: number | string) => {
            const { active, over } = event;

            if (!over || active.id === over.id) return;

            setSortedTypes((types) => {
                  // 仅在同一类别内排序
                  const categoryTypes = types.filter((type) => type.category_id === categoryId);
                  const otherTypes = types.filter((type) => type.category_id !== categoryId);

                  const oldIndex = categoryTypes.findIndex((type) => type.id === active.id);
                  const newIndex = categoryTypes.findIndex((type) => type.id === over.id);

                  const reorderedCategoryTypes = arrayMove(categoryTypes, oldIndex, newIndex);

                  // 分配新的排序值
                  const updatedCategoryTypes = reorderedCategoryTypes.map((type, index) => ({
                        ...type,
                        sort_order: index,
                  }));

                  return [...otherTypes, ...updatedCategoryTypes].sort((a, b) => {
                        // 首先按照类别ID排序，然后按照sort_order排序
                        if (a.category_id !== b.category_id) {
                              if (!a.category_id) return 1;
                              if (!b.category_id) return -1;
                              return a.category_id > b.category_id ? 1 : -1;
                        }
                        return a.sort_order - b.sort_order;
                  });
            });
      };

      const handleSubmit = async () => {
            if (sortedTypes.length === 0) return;

            setIsSubmitting(true);
            try {
                  const updatedCourierTypes = sortedTypes.map((item, index) => ({
                        id: item.id,
                        sort_order: index + 1
                  }));

                  await onSort(updatedCourierTypes);
                  onClose();
            } catch (error) {
                  console.error('排序保存失败:', error);
            } finally {
                  setIsSubmitting(false);
            }
      };

      // 将快递类型按类别分组
      const getTypesByCategory = (categoryId: number | string | null | undefined) => {
            return sortedTypes.filter(type =>
                  // 处理未分类的情况
                  (categoryId === null || categoryId === undefined)
                        ? (type.category_id === null || type.category_id === undefined)
                        : type.category_id === categoryId
            );
      };

      // 获取未分类的快递类型
      const getUncategorizedTypes = () => {
            return sortedTypes.filter(type => type.category_id === null || type.category_id === undefined);
      };

      // 生成默认描述文本，即使没有提供dialogDescription
      const defaultDescription = t('courier:sort_courier_types_description', '请拖动快递类型调整其排序顺序');

      return (
            <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
                  <DialogContent className="sm:max-w-md md:max-w-lg" aria-describedby={dialogDescriptionId}>
                        <DialogHeader>
                              <DialogTitle>{t('courier:sort_courier_types')}</DialogTitle>
                              <DialogDescription id={dialogDescriptionId}>
                                    {dialogDescription || defaultDescription}
                              </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto py-2">
                              {/* 显示有分类的快递类型 */}
                              {categories
                                    .sort((a, b) => a.sort_order - b.sort_order)
                                    .map((category) => (
                                          <CategoryCourierTypeList
                                                key={category.id}
                                                category={category}
                                                courierTypes={getTypesByCategory(category.id)}
                                                onDragEnd={handleDragEnd}
                                          />
                                    ))
                              }

                              {/* 显示未分类的快递类型 */}
                              {getUncategorizedTypes().length > 0 && (
                                    <CategoryCourierTypeList
                                          key="uncategorized"
                                          category={{
                                                id: 'uncategorized',
                                                name: t('courier:uncategorized'),
                                                sort_order: 9999
                                          }}
                                          courierTypes={getUncategorizedTypes()}
                                          onDragEnd={(event) => handleDragEnd(event, null)}
                                    />
                              )}

                              {sortedTypes.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">{t('common:no_data')}</div>
                              )}
                        </div>
                        <DialogFooter>
                              <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
                                    {t('common:cancel')}
                              </Button>
                              <Button onClick={handleSubmit} disabled={isSubmitting || sortedTypes.length === 0}>
                                    {isSubmitting ? t('common:saving') : t('common:save')}
                              </Button>
                        </DialogFooter>
                  </DialogContent>
            </Dialog>
      );
} 