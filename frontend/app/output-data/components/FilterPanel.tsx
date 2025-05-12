"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Search, X, RefreshCw, Package, Store, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShopSelector } from "@/components/shop-output/ShopSelector";
import { DateRangeSelector } from "@/components/shop-output/DateSelector";
import { ShopOutputFilter } from "@/lib/types/shop-output";
import { DATE_FORMAT } from "@/lib/constants";
import CourierSelector from "@/components/shop-output/CourierSelector";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface FilterPanelProps {
  onFilterChange: (filter: ShopOutputFilter) => void;
}

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const { t } = useTranslation(['common', 'shop']);
  const [shopId, setShopId] = useState<number | undefined>(undefined);
  const [courierId, setCourierId] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentFilter, setCurrentFilter] = useState<ShopOutputFilter>({});
  const [shopNames, setShopNames] = useState<Record<string, string>>({});
  const [courierNames, setCourierNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 加载店铺和快递类型名称缓存（实际应用中，这些数据应从API获取）
  useEffect(() => {
    // 加载数据的示例代码
    const fetchData = async () => {
      try {
        // 这里应该是真实的API调用
        // const shops = await api.getShops({ active_only: true });
        // const couriers = await api.getCouriers({ active_only: true });

        // 暂时使用假数据
        const shopsMap: Record<string, string> = {};
        const couriersMap: Record<string, string> = {};

        setShopNames(shopsMap);
        setCourierNames(couriersMap);
      } catch (err) {
        console.error("获取数据失败:", err);
      }
    };

    fetchData();
  }, []);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);

    if (range?.from && range?.to) {
      applyFilter({
        date_from: format(range.from, DATE_FORMAT),
        date_to: format(range.to, DATE_FORMAT),
      });
    } else if (!range) {
      const newFilter = { ...currentFilter };
      delete newFilter.date_from;
      delete newFilter.date_to;
      applyFilter(newFilter);
    }
  };

  const handleShopChange = (value: number | undefined) => {
    setShopId(value);

    if (value) {
      applyFilter({ shop_id: value });
    } else {
      const newFilter = { ...currentFilter };
      delete newFilter.shop_id;
      applyFilter(newFilter);
    }
  };

  const handleCourierChange = (value: number | undefined) => {
    setCourierId(value);

    if (value) {
      applyFilter({ courier_id: value });
    } else {
      const newFilter = { ...currentFilter };
      delete newFilter.courier_id;
      applyFilter(newFilter);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim()) {
      applyFilter({ search: value.trim() });
    } else {
      const newFilter = { ...currentFilter };
      delete newFilter.search;
      applyFilter(newFilter);
    }
  };

  const applyFilter = (newFilterPart: Partial<ShopOutputFilter>) => {
    const updatedFilter = { ...currentFilter, ...newFilterPart };
    setCurrentFilter(updatedFilter);
    onFilterChange(updatedFilter);
  };

  const handleResetFilters = () => {
    setShopId(undefined);
    setCourierId(undefined);
    setDateRange(undefined);
    setSearchTerm("");
    setCurrentFilter({});
    onFilterChange({});
  };

  const handleRefresh = () => {
    // 这里可以触发刷新操作
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const getFilterDescription = () => {
    const descriptions: string[] = [];

    // 添加日期范围描述
    if (currentFilter.date_from && currentFilter.date_to) {
      descriptions.push(`日期范围: ${currentFilter.date_from} 至 ${currentFilter.date_to}`);
    }

    // 添加店铺描述
    if (currentFilter.shop_id && shopNames[currentFilter.shop_id.toString()]) {
      descriptions.push(`店铺: ${shopNames[currentFilter.shop_id.toString()]}`);
    }

    // 添加快递类型描述
    if (currentFilter.courier_id && courierNames[currentFilter.courier_id.toString()]) {
      descriptions.push(`快递类型: ${courierNames[currentFilter.courier_id.toString()]}`);
    }

    // 添加搜索描述
    if (currentFilter.search) {
      descriptions.push(`搜索: ${currentFilter.search}`);
    }

    return descriptions.join(", ");
  };

  return (
    <Card className="border">
      {/* 标题单独一行 */}
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium">{t('shop:recent_outputs')}</CardTitle>
      </CardHeader>

      {/* 筛选功能放第二行 */}
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* 左侧筛选项 */}
          <div className="flex items-center gap-3">
            {/* 日期图标和选择器 */}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
            </div>

            {/* 店铺图标和选择器 */}
            <div className="flex items-center gap-1">
              <Store className="h-4 w-4 text-muted-foreground" />
              <div className="w-[150px]">
                <ShopSelector
                  selectedShopId={shopId}
                  onSelectShop={handleShopChange}
                />
              </div>
            </div>

            {/* 快递图标和选择器 */}
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="w-[150px]">
                <CourierSelector
                  selectedCourierId={courierId}
                  onSelectCourier={handleCourierChange}
                />
              </div>
            </div>
          </div>

          {/* 右侧搜索框和刷新按钮 */}
          <div className="flex items-center gap-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('shop:search_placeholder')}
                className="pl-8 w-[200px]"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            {/* 刷新按钮 */}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* 显示当前筛选条件 */}
        {Object.keys(currentFilter).length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm mt-3">
            <span className="truncate max-w-[250px]">{getFilterDescription()}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full flex-shrink-0" onClick={handleResetFilters}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 