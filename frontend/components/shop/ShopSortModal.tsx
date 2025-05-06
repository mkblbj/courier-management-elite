import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shop, ShopSortItem } from "@/lib/types/shop";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDownUp } from "lucide-react";

type ShopSortItemProps = {
  shop: Shop;
  index: number;
};

const SortableShopItem: React.FC<ShopSortItemProps> = ({ shop, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: shop.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center p-3 mb-2 bg-white rounded-md border cursor-move"
    >
      <div className="flex-1 mr-2 font-medium">{shop.name}</div>
      <div className="w-10">
        <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

type ShopSortModalProps = {
  isOpen: boolean;
  onClose: () => void;
  shops: Shop[];
  onSort: (items: ShopSortItem[]) => void;
  isSubmitting?: boolean;
};

export const ShopSortModal: React.FC<ShopSortModalProps> = ({
  isOpen,
  onClose,
  shops,
  onSort,
  isSubmitting = false,
}) => {
  const [sortedShops, setSortedShops] = useState<Shop[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    // 深拷贝并按照当前排序顺序排序
    setSortedShops([...shops].sort((a, b) => a.sort_order - b.sort_order));
  }, [shops]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = sortedShops.findIndex(shop => shop.id.toString() === active.id);
      const newIndex = sortedShops.findIndex(shop => shop.id.toString() === over.id);
      
      const newArray = [...sortedShops];
      const [removed] = newArray.splice(oldIndex, 1);
      newArray.splice(newIndex, 0, removed);
      
      setSortedShops(newArray);
    }
  };

  const handleSubmit = () => {
    const updatedItems = sortedShops.map((shop, index) => ({
      id: shop.id,
      sort_order: index + 1, // 从1开始的排序号
    }));
    
    onSort(updatedItems);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>店铺排序</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            拖拽店铺项目来调整显示顺序，排序将影响所有店铺列表的显示顺序。
          </p>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={sortedShops.map(shop => shop.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              <div className="max-h-[400px] overflow-y-auto">
                {sortedShops.map((shop, index) => (
                  <SortableShopItem
                    key={shop.id}
                    shop={shop}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存排序"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShopSortModal; 