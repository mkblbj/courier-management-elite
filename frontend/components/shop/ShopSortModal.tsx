import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
      Dialog,
      DialogContent,
      DialogFooter,
      DialogHeader,
      DialogTitle,
} from "@/components/ui/dialog";
import { Shop, ShopCategory } from "@/lib/types/shop";
import { GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import {
      DndContext,
      closestCenter,
      KeyboardSensor,
      PointerSensor,
      useSensor,
      useSensors,
      DragEndEvent,
} from "@dnd-kit/core";
import {
      arrayMove,
      SortableContext,
      sortableKeyboardCoordinates,
      useSortable,
      verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

// 排序项组件
const SortableShopItem = ({ shop }: { shop: Shop }) => {
      const { t } = useTranslation();

      const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
            id: shop.id.toString(),
      });

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
                  <button
                        type="button"
                        className="mr-2 cursor-grab text-gray-400 hover:text-gray-600 focus:outline-none"
                        {...attributes}
                        {...listeners}
                  >
                        <GripVertical size={18} />
                  </button>
                  <span className="flex-grow">{shop.name}</span>
            </div>
      );
};

// 每个类别的店铺列表组件
const CategoryShopList = ({
      category,
      shops,
      onDragEnd,
}: {
      category: ShopCategory;
      shops: Shop[];
      onDragEnd: (event: DragEndEvent, categoryId: number) => void;
}) => {
      const { t } = useTranslation();

      const sensors = useSensors(
            useSensor(PointerSensor),
            useSensor(KeyboardSensor, {
                  coordinateGetter: sortableKeyboardCoordinates,
            })
      );

      return (
            (<div className="mb-4">
                  <div className="bg-muted dark:bg-gray-700 p-2 font-medium text-gray-700 dark:text-gray-300 rounded-t-md">
                        {category.name} ({shops.length}{t("家店铺)")}</div>
                  <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => onDragEnd(event, category.id)}
                        modifiers={[restrictToVerticalAxis]}
                  >
                        <SortableContext
                              items={shops.map((shop) => shop.id.toString())}
                              strategy={verticalListSortingStrategy}
                        >
                              <div className="border border-gray-200 rounded-b-md overflow-hidden">
                                    {shops.map((shop) => (
                                          <SortableShopItem key={shop.id} shop={shop} />
                                    ))}
                                    {shops.length === 0 && (
                                          <div className="p-3 text-gray-500 text-sm italic">{t("此类别下暂无店铺")}</div>
                                    )}
                              </div>
                        </SortableContext>
                  </DndContext>
            </div>)
      );
};

interface ShopSortModalProps {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      shops: Shop[];
      categories: ShopCategory[];
      onSortSave: (shops: Shop[]) => Promise<void>;
}

const ShopSortModal = ({
      open,
      onOpenChange,
      shops,
      categories,
      onSortSave,
}: ShopSortModalProps) => {
      const { t } = useTranslation();

      const [sortedShops, setSortedShops] = useState<Shop[]>([]);
      const [loading, setLoading] = useState(false);

      useEffect(() => {
            if (open) {
                  // 将shops按sortOrder排序，确保顺序正确
                  setSortedShops([...shops].sort((a, b) => a.sort_order - b.sort_order));
            }
      }, [open, shops]);

      const handleDragEnd = (event: DragEndEvent, categoryId: number) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            setSortedShops((shops) => {
                  // 仅在同一类别内排序
                  const categoryShops = shops.filter((shop) => shop.category_id === categoryId);
                  const otherShops = shops.filter((shop) => shop.category_id !== categoryId);

                  const oldIndex = categoryShops.findIndex((shop) => shop.id.toString() === active.id);
                  const newIndex = categoryShops.findIndex((shop) => shop.id.toString() === over.id);

                  const reorderedCategoryShops = arrayMove(categoryShops, oldIndex, newIndex);

                  // 分配新的排序值
                  const updatedCategoryShops = reorderedCategoryShops.map((shop, index) => ({
                        ...shop,
                        sort_order: index,
                  }));

                  return [...otherShops, ...updatedCategoryShops].sort((a, b) => {
                        // 首先按照类别ID排序，然后按照sort_order排序
                        if (a.category_id !== b.category_id) {
                              return a.category_id - b.category_id;
                        }
                        return a.sort_order - b.sort_order;
                  });
            });
      };

      const handleSave = async () => {
            try {
                  setLoading(true);
                  await onSortSave(sortedShops);
                  onOpenChange(false);
            } catch (error) {
                  console.error('排序保存失败:', error);
            } finally {
                  setLoading(false);
            }
      };

      return (
            (<Dialog open={open} onOpenChange={onOpenChange}>
                  <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
                        <DialogHeader>
                              <DialogTitle>{t("调整店铺排序")}</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto py-2">
                              {categories
                                    .sort((a, b) => a.sort_order - b.sort_order)
                                    .map((category) => (
                                          <CategoryShopList
                                                key={category.id}
                                                category={category}
                                                shops={sortedShops.filter((shop) => shop.category_id === category.id)}
                                                onDragEnd={handleDragEnd}
                                          />
                                    ))}
                              {categories.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">{t("暂无店铺类别")}</div>
                              )}
                        </div>
                        <DialogFooter>
                              <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={loading}
                              >{t("取消")}</Button>
                              <Button
                                    onClick={handleSave}
                                    disabled={loading}
                              >
                                    {loading ? "保存中..." : "保存排序"}
                              </Button>
                        </DialogFooter>
                  </DialogContent>
            </Dialog>)
      );
};

export default ShopSortModal; 