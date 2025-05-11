"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { CourierTypeList } from "@/components/courier-type-list"
import { CourierTypeDialog } from "@/components/courier-type-dialog"
import { CourierTypeSortModal } from "@/components/courier-type-sort-modal"
import { useCourierTypes } from "@/hooks/use-courier-types"
import { Plus, RefreshCw, Search, Bell, ArrowUpDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { CourierType, CourierCategory } from "@/services/api"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { api } from "@/services/api"

// 调试模式开关，与API调试工具保持一致
const showDebugTool = false // 设置为true可以启用调试功能

export function CourierTypeManagement() {
  const { toast } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useTranslation(['common', 'courier'])

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
    fetchCourierTypes,
    categories,
    categoriesLoading,
  } = useCourierTypes()

  const [open, setOpen] = useState(false)
  const [sortModalOpen, setSortModalOpen] = useState(false)
  const [editingCourierType, setEditingCourierType] = useState<CourierType | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("all_categories")

  // 将快递类型按类别分组
  const groupedTypes = useMemo(() => {
    // 先过滤
    const filteredTypes = courierTypes.filter(type =>
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 根据状态过滤
    const statusFilteredTypes = filteredTypes.filter(type => {
      if (statusFilter === "all") return true;
      return statusFilter === "active" ? Boolean(type.is_active) : !Boolean(type.is_active);
    });

    // 根据类别过滤
    return categoryFilter === "all_categories"
      ? statusFilteredTypes
      : statusFilteredTypes.filter(type =>
        type.category_id && type.category_id.toString() === categoryFilter
      );
  }, [courierTypes, searchQuery, statusFilter, categoryFilter]);

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchCourierTypes()
    }

    loadInitialData()
  }, [])

  const handleAddClick = () => {
    setEditingCourierType(null)
    setOpen(true)
  }

  const handleEditClick = (courierType: CourierType) => {
    setEditingCourierType(courierType)
    setOpen(true)
  }

  const handleSave = async (courierType: {
    name: string
    code: string
    remark?: string
    is_active: boolean
    category_id?: number | string | null
  }) => {
    try {
      if (editingCourierType) {
        await updateCourierType({
          ...editingCourierType,
          ...courierType,
        })
        toast({
          title: t('common:save') + t('common:success'),
          variant: "default",
        })
      } else {
        await addCourierType(courierType)
        toast({
          title: t('common:create') + t('common:success'),
          variant: "default",
        })
      }
      setOpen(false)
    } catch (err) {
      toast({
        title: t('common:operation_failed'),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number | string) => {
    try {
      await deleteCourierType(id)
      toast({
        title: t('common:delete') + t('common:success'),
        variant: "default",
      })
    } catch (err) {
      toast({
        title: t('common:delete') + t('common:failed'),
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (id: number | string, active: boolean) => {
    try {
      await toggleCourierTypeStatus(id)
      toast({
        title: active
          ? t('courier:courier_status_active') + t('common:success')
          : t('courier:courier_status_inactive') + t('common:success'),
        variant: "default",
      })
    } catch (err) {
      toast({
        title: t('common:status_update_failed'),
        variant: "destructive",
      })
    }
  }

  const handleReorder = async (reorderedTypes: CourierType[]) => {
    try {
      await reorderCourierTypes(reorderedTypes)
      toast({
        title: t('common:sort') + t('common:success'),
        variant: "default",
      })
    } catch (err) {
      toast({
        title: t('common:sort') + t('common:failed'),
        variant: "destructive",
      })
    }
  }

  const handleRefresh = () => {
    try {
      fetchCourierTypes();
      toast({
        title: t('common:refresh') + t('common:success'),
        description: t('common:data_updated'),
        variant: "default",
      });
    } catch (error) {
      toast({
        title: t('common:refresh') + t('common:failed'),
        description: error instanceof Error ? error.message : t('common:data_fetch_failed'),
        variant: "destructive",
      });
    }
  }

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

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as "all" | "active" | "inactive");
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
  };

  const getAvailableCategories = () => {
    return categories
  }

  const handleOpenSortModal = () => {
    setSortModalOpen(true);
  };

  const handleCloseSortModal = () => {
    setSortModalOpen(false);
  };

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
              "flex flex-col gap-4 transition-all duration-300 delay-100",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            {/* 第一行：搜索框和选择框 */}
            <div className="flex flex-col gap-2 sm:flex-row items-start sm:items-center">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder={t('courier:search_courier_type')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-white text-black"
                />
              </div>
              <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('courier:category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_categories">{t('courier:all_categories')}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('courier:courier_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common:all')}</SelectItem>
                  <SelectItem value="active">{t('courier:courier_status_active')}</SelectItem>
                  <SelectItem value="inactive">{t('courier:courier_status_inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 第二行：按钮组 */}
            <div className="flex justify-start items-center gap-2">
              <Button onClick={handleAddClick}>
                <Plus className="mr-2 h-4 w-4" />
                {t('courier:add_courier_type')}
              </Button>
              <Button variant="outline" onClick={handleOpenSortModal}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {t('courier:sort_courier_types')}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                className="h-9 w-9 p-0"
                aria-label={t('common:refresh')}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <CourierTypeList
            courierTypes={groupedTypes}
            categories={categories}
            isLoading={isLoading}
            onAdd={handleSave}
            onEdit={async (id, type) => {
              await updateCourierType({
                id,
                ...type,
                sort_order: courierTypes.find(ct => ct.id === id)?.sort_order || 0
              });
            }}
            onDelete={handleDelete}
            onToggleStatus={async (id) => {
              await toggleCourierTypeStatus(id);
            }}
            onRefresh={async () => {
              await fetchCourierTypes();
            }}
            onSort={() => Promise.resolve()}
            searchVisible={false}
            addButtonVisible={false}
          />
        </CardContent>
        <CardFooter className="pb-6 pt-3 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {!error
              ? groupedTypes.length > 0
                ? t('common:total_count', { count: groupedTypes.length })
                : t('common:no_data')
              : t('common:loading_error')}
          </div>
          {showDebugTool && (
            <Button size="sm" variant="outline" onClick={testToast}>
              <Bell className="h-4 w-4 mr-2" />
              {t('common:test_notification')}
            </Button>
          )}
        </CardFooter>
      </Card>

      <CourierTypeDialog
        open={open}
        onOpenChange={setOpen}
        courierType={editingCourierType}
        onSave={handleSave}
        existingCourierTypes={courierTypes}
        availableCategories={getAvailableCategories()}
      />

      <CourierTypeSortModal
        open={sortModalOpen}
        courierTypes={groupedTypes}
        categories={categories}
        onClose={handleCloseSortModal}
        onSort={handleReorder}
      />
    </>
  )
}
