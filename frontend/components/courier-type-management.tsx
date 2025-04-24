"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { CourierTypeTable } from "@/components/courier-type-table"
import { CourierTypeDialog } from "@/components/courier-type-dialog"
import { useCourierTypes } from "@/hooks/use-courier-types"
import { Plus, RefreshCw, Search, Bell } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { CourierType } from "@/services/api"
import { cn } from "@/lib/utils"

// 调试模式开关，与API调试工具保持一致
const showDebugTool = false // 设置为true可以启用调试功能

export function CourierTypeManagement() {
  const { toast } = useToast()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const {
    courierTypes,
    filteredCourierTypes,
    isLoading,
    error,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    addCourierType,
    updateCourierType,
    deleteCourierType,
    toggleCourierTypeStatus,
    reorderCourierTypes,
    refetch,
  } = useCourierTypes()

  const [open, setOpen] = useState(false)
  const [editingCourierType, setEditingCourierType] = useState<CourierType | null>(null)

  const handleAddClick = () => {
    setEditingCourierType(null)
    setOpen(true)
  }

  const handleEditClick = (courierType: CourierType) => {
    setEditingCourierType(courierType)
    setOpen(true)
  }

  // 修改handleSave函数中的toast提示
  const handleSave = async (courierType: {
    name: string
    code: string
    remark?: string
    is_active: boolean
  }) => {
    try {
      if (editingCourierType) {
        await updateCourierType({
          ...editingCourierType,
          ...courierType,
        })
        toast({
          title: "更新成功",
          variant: "default",
        })
      } else {
        await addCourierType(courierType)
        toast({
          title: "添加成功",
          variant: "default",
        })
      }
      setOpen(false)
    } catch (err) {
      toast({
        title: "操作失败",
        variant: "destructive",
      })
    }
  }

  // 修改handleDelete函数中的toast提示
  const handleDelete = async (id: number | string) => {
    try {
      await deleteCourierType(id)
      toast({
        title: "删除成功",
        variant: "default",
      })
    } catch (err) {
      toast({
        title: "删除失败",
        variant: "destructive",
      })
    }
  }

  // 修改handleStatusChange函数中的toast提示
  const handleStatusChange = async (id: number | string, active: boolean) => {
    try {
      await toggleCourierTypeStatus(id)
      toast({
        title: `状态${active ? "激活" : "禁用"}成功`,
        variant: "default",
      })
    } catch (err) {
      toast({
        title: "状态更新失败",
        variant: "destructive",
      })
    }
  }

  // 修改handleReorder函数中的toast提示
  const handleReorder = async (reorderedTypes: CourierType[]) => {
    try {
      await reorderCourierTypes(reorderedTypes)
      toast({
        title: "排序更新成功",
        variant: "default",
      })
    } catch (err) {
      toast({
        title: "排序更新失败",
        variant: "destructive",
      })
    }
  }

  // 修改handleRefresh函数，添加刷新成功的通知
  const handleRefresh = () => {
    toast({
      title: "刷新中",
      duration: 1000,
    })
    
    refetch()
      .then(() => {
        // 延迟显示成功通知，确保通知不会被刷新过程覆盖
        setTimeout(() => {
          toast({
            title: "刷新成功",
            variant: "default",
            duration: 3000,
          })
        }, 1200)
      })
      .catch((err) => {
        toast({
          title: "刷新失败",
          variant: "destructive",
        })
      })
  }

  // 修改testToast函数
  const testToast = () => {
    toast({
      title: "测试提示",
      duration: 3000,
    })

    setTimeout(() => {
      toast({
        title: "成功提示测试",
        variant: "default",
        duration: 3000,
      })
    }, 1000)

    setTimeout(() => {
      toast({
        title: "失败提示测试",
        variant: "destructive",
        duration: 3000,
      })
    }, 2000)
  }

  return (
    <>
      <Card
        className={cn(
          "border max-w-5xl mx-auto transition-all duration-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <CardHeader className="pb-3">
          <div
            className={cn(
              "flex flex-col sm:flex-row justify-between gap-4 transition-all duration-300 delay-100",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <div className="relative w-full sm:w-[300px]">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              {/* 修改搜索和筛选的toast提示 */}
              <Input
                placeholder="搜索快递类型..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                }}
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {/* 修改搜索和筛选的toast提示 */}
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as "all" | "active" | "inactive")
                }}
              >
                <SelectTrigger className="w-[120px] transition-all duration-200 hover:border-blue-400">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent className="animate-fade-in">
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="active">激活</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                title="刷新数据"
                className="transition-all duration-200 hover:rotate-180"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={handleAddClick} className="bg-blue-600 transition-colors hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                添加快递类型
              </Button>
              {/* 测试提示按钮 - 仅在调试模式下显示 */}
              {showDebugTool && (
                <Button variant="outline" onClick={testToast} title="测试提示">
                  <Bell className="h-4 w-4 mr-2" />
                  测试提示
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex justify-center p-6 text-red-500 animate-fade-in">
              加载数据时出错: {error}
              <Button variant="outline" size="sm" className="ml-2" onClick={() => refetch()}>
                重试
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "transition-all duration-500 delay-200",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
              <CourierTypeTable
                courierTypes={filteredCourierTypes}
                isLoading={isLoading}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onReorder={handleReorder}
                onStatusChange={handleStatusChange}
                onRetry={() => refetch()}
                error={error}
                searchQuery={searchQuery} // 传递搜索查询
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/10">
          <div className="flex w-full justify-between items-center">
            <div className="text-sm text-muted-foreground">共 {filteredCourierTypes.length} 条记录</div>
          </div>
        </CardFooter>
      </Card>

      <CourierTypeDialog
        open={open}
        onOpenChange={setOpen}
        courierType={editingCourierType}
        onSave={handleSave}
        existingCourierTypes={courierTypes}
      />
    </>
  )
}
