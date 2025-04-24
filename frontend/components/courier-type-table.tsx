"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ApiError } from "@/components/api-error"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { highlightText } from "@/lib/highlight-text"
import type { CourierType } from "@/services/api"

// 导入useToast
import { useToast } from "@/components/ui/use-toast"

// 可排序的行组件
function SortableRow({
  courierType,
  searchQuery,
  onEdit,
  onDelete,
  onStatusChange,
  toggleExpand,
  isExpanded,
  gridTemplateColumns,
  isMobile = false,
  index = 0,
}: {
  courierType: CourierType
  searchQuery?: string
  onEdit: (courierType: CourierType) => void
  onDelete: (id: number | string) => void
  onStatusChange: (id: number | string, active: boolean) => void
  toggleExpand?: (id: number | string) => void
  isExpanded?: boolean
  gridTemplateColumns?: string
  isMobile?: boolean
  index?: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: courierType.id })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setIsVisible(true)
      },
      50 + index * 30,
    ) // Staggered animation

    return () => clearTimeout(timer)
  }, [index])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  }

  if (isMobile) {
    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          opacity: isVisible ? (isDragging ? 0.5 : 1) : 0,
          transform: isVisible
            ? CSS.Transform.toString(transform)
            : `${CSS.Transform.toString(transform)} translateY(10px)`,
          transition: isVisible ? transition : `${transition}, opacity 300ms ease, transform 300ms ease`,
        }}
        className={cn(
          "border rounded-md overflow-hidden transition-all duration-300",
          !courierType.is_active && "opacity-60",
          isDragging && "shadow-lg",
        )}
      >
        <div className="flex items-center justify-between p-3 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="cursor-grab" {...attributes} {...listeners}>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="font-medium truncate">
              {searchQuery ? highlightText(courierType.name, searchQuery) : courierType.name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={courierType.is_active ? "default" : "outline"} className="text-xs">
              {courierType.is_active ? "激活" : "禁用"}
            </Badge>
            {toggleExpand && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 transition-transform duration-200"
                onClick={() => toggleExpand(courierType.id)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {toggleExpand && (
          <div
            className={cn(
              "grid grid-cols-1 gap-2 px-3 overflow-hidden transition-all duration-300",
              isExpanded ? "py-3 max-h-60" : "max-h-0 py-0",
            )}
          >
            <div className="grid grid-cols-3 gap-1">
              <div className="text-sm font-medium">代码:</div>
              <div className="col-span-2 font-mono">
                {searchQuery ? highlightText(courierType.code, searchQuery) : courierType.code}
              </div>
            </div>

            {courierType.remark && (
              <div className="grid grid-cols-3 gap-1">
                <div className="text-sm font-medium">备注:</div>
                <div className="col-span-2 text-sm text-muted-foreground break-words">
                  {searchQuery ? highlightText(courierType.remark, searchQuery) : courierType.remark}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-1 items-center">
              <div className="text-sm font-medium">状态:</div>
              <div className="col-span-2">
                <Switch
                  checked={Boolean(courierType.is_active)}
                  onCheckedChange={(checked) => onStatusChange(courierType.id, checked)}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(courierType)}
                className="transition-colors hover:bg-blue-50"
              >
                <Edit className="h-3.5 w-3.5 mr-1 text-blue-600" />
                编辑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(courierType.id)}
                className="transition-colors hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1 text-red-500" />
                删除
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isVisible ? (isDragging ? 0.5 : 1) : 0,
        transform: isVisible
          ? CSS.Transform.toString(transform)
          : `${CSS.Transform.toString(transform)} translateY(10px)`,
        transition: isVisible ? transition : `${transition}, opacity 300ms ease, transform 300ms ease`,
      }}
      className={cn(
        "border-b last:border-b-0 transition-colors hover:bg-muted/30",
        isDragging ? "bg-accent shadow-md" : "bg-card even:bg-muted/50",
        !courierType.is_active && "opacity-60",
      )}
    >
      <div className="grid items-center gap-2 p-4" style={{ gridTemplateColumns }}>
        <div className="flex items-center justify-center w-6 cursor-grab" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-center font-mono">
          {searchQuery ? highlightText(courierType.code, searchQuery) : courierType.code}
        </div>
        <div className="flex items-center">
          <span className="truncate font-medium">
            {searchQuery ? highlightText(courierType.name, searchQuery) : courierType.name}
          </span>
        </div>
        {courierType.remark ? (
          <Tooltip delayDuration={200}>
            <TooltipTrigger className="w-full">
              <div className="truncate text-sm text-muted-foreground max-w-[400px] group relative text-left">
                {searchQuery ? highlightText(courierType.remark, searchQuery) : courierType.remark}
                {courierType.remark && courierType.remark.length > 60 && (
                  <span className="absolute -right-5 top-0 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    ···
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" className="max-w-[400px] bg-white border shadow-md p-3 z-50">
              <p className="text-sm text-gray-700 break-words whitespace-normal">
                {searchQuery ? highlightText(courierType.remark, searchQuery) : courierType.remark}
              </p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-sm text-muted-foreground text-left">-</span>
        )}
        <div className="flex justify-center">
          <Switch
            checked={Boolean(courierType.is_active)}
            onCheckedChange={(checked) => onStatusChange(courierType.id, checked)}
          />
        </div>
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(courierType)}
            className="h-8 w-8 transition-colors hover:bg-blue-50"
          >
            <Edit className="h-4 w-4 text-blue-600" />
            <span className="sr-only">编辑</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(courierType.id)}
            className="h-8 w-8 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
            <span className="sr-only">删除</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

interface CourierTypeTableProps {
  courierTypes: CourierType[]
  isLoading: boolean
  onEdit: (courierType: CourierType) => void
  onDelete: (id: number | string) => void
  onReorder: (items: CourierType[]) => void
  onStatusChange: (id: number | string, active: boolean) => void
  onRetry?: () => void
  error?: string | null
  searchQuery?: string
}

// 在CourierTypeTable组件中添加toast
export function CourierTypeTable({
  courierTypes,
  isLoading,
  onEdit,
  onDelete,
  onReorder,
  onStatusChange,
  onRetry,
  error,
  searchQuery = "",
}: CourierTypeTableProps) {
  const { toast } = useToast()
  const [deleteId, setDeleteId] = useState<number | string | null>(null)
  const [items, setItems] = useState(courierTypes)
  const [expandedItems, setExpandedItems] = useState<Record<string | number, boolean>>({})
  const [activeId, setActiveId] = useState<string | number | null>(null)
  const [reorderedItems, setReorderedItems] = useState<CourierType[] | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 使用useEffect更新本地状态，避免在渲染期间更新状态
  useEffect(() => {
    if (JSON.stringify(courierTypes) !== JSON.stringify(items)) {
      setItems(courierTypes)
    }
  }, [courierTypes])

  // 使用useEffect处理重新排序的副作用
  useEffect(() => {
    if (reorderedItems) {
      onReorder(reorderedItems)
      setReorderedItems(null)
    }
  }, [reorderedItems, onReorder])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 需要移动5px才会触发拖拽，防止误触
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // 修改handleDragStart函数，保留排序模式提示
  const handleDragStart = (event: { active: { id: string | number } }) => {
    setActiveId(event.active.id)
    toast({
      title: "排序模式",
      description: "拖动项目调整顺序，松开后自动保存",
      duration: 2000,
    })
  }

  // 修改handleDragEnd函数，简化成功提示并保留排序未变更提示
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)

      // 更新排序值
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        sort_order: index + 1,
      }))

      // 更新本地状态
      setItems(updatedItems)

      // 将重新排序的项目保存到状态中，以便在useEffect中处理
      setReorderedItems(updatedItems)

      toast({
        title: "排序已更改",
        variant: "success",
        duration: 2000,
      })
    } else {
      toast({
        title: "排序未变更",
        description: "项目顺序保持不变",
        duration: 2000,
      })
    }
  }

  // 修改toggleExpand函数，简化提示
  const toggleExpand = (id: number | string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleDeleteClick = (id: number | string) => {
    setDeleteId(id)
  }

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  if (isLoading && courierTypes.length === 0) {
    return (
      <div className="flex justify-center items-center p-8 animate-pulse-subtle">
        <div className="flex flex-col items-center">
          <div className="relative h-10 w-10">
            <div className="absolute h-10 w-10 rounded-full border-4 border-muted-foreground/30 border-t-muted-foreground animate-spin"></div>
          </div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <ApiError message={error} onRetry={onRetry} />
  }

  if (courierTypes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground animate-fade-in">
        没有找到快递类型数据。请添加新的快递类型。
      </div>
    )
  }

  // Define the grid template columns based on actual data length
  const gridTemplateColumns = "40px 80px 200px 1fr 80px 100px"

  return (
    <TooltipProvider>
      {/* Desktop View - Hidden on small screens */}
      <div
        className={cn(
          "rounded-md border overflow-hidden hidden md:block transition-all duration-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <div
          className="grid items-center gap-2 p-4 bg-muted/50 font-medium text-sm animate-fade-in"
          style={{ gridTemplateColumns }}
        >
          <div className="w-6 flex justify-center">#</div>
          <div className="text-center">代码</div>
          <div>名称</div>
          <div className="text-left">备注</div>
          <div className="text-center">状态</div>
          <div className="text-center">操作</div>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            {items.map((courierType, index) => (
              <SortableRow
                key={courierType.id}
                courierType={courierType}
                searchQuery={searchQuery}
                onEdit={onEdit}
                onDelete={handleDeleteClick}
                onStatusChange={onStatusChange}
                gridTemplateColumns={gridTemplateColumns}
                index={index}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Mobile View - Shown only on small screens */}
      <div
        className={cn(
          "md:hidden space-y-3 transition-all duration-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            {items.map((courierType, index) => (
              <SortableRow
                key={courierType.id}
                courierType={courierType}
                searchQuery={searchQuery}
                onEdit={onEdit}
                onDelete={handleDeleteClick}
                onStatusChange={onStatusChange}
                toggleExpand={toggleExpand}
                isExpanded={expandedItems[courierType.id]}
                isMobile={true}
                index={index}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>您确定要删除这个快递类型吗？此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="transition-colors duration-200">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
