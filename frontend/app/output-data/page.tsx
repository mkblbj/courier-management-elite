"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { PageHeader } from "@/components/page-header";
import OutputForm from "./components/OutputForm";
import OutputList from "./components/OutputList";
import FilterPanel from "./components/FilterPanel";
import OutputSummary from "./components/OutputSummary";
import { ShopOutputFilter } from "@/lib/types/shop-output";

export default function OutputDataPage() {
  const { t } = useTranslation(['common', 'shop']);
  const [filter, setFilter] = useState<ShopOutputFilter>({});
  const [isVisible, setIsVisible] = useState(false);
  const [selection, setSelection] = useState({
    date: new Date(),
    shopId: undefined as number | undefined,
    courierId: undefined as number | undefined,
  });

  const handleFilterChange = (newFilter: ShopOutputFilter) => {
    setFilter(newFilter);
  };

  const handleFormSuccess = () => {
    // 表单提交成功后刷新列表
  };

  const handleSelectionChange = (selection: {
    date: Date | undefined;
    shopId: number | undefined;
    courierId: number | undefined;
  }) => {
    setSelection(selection);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNav />
      
      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <PageHeader
          title={t('shop:output_data')}
          description={t('shop:shop_output_management')}
          className="w-full"
        />

        <div className="flex justify-between items-center">
          {/* 可以添加更多页面级操作按钮 */}
        </div>

        <div className={cn(
          "grid grid-cols-1 gap-6 transition-all duration-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}>
          {/* 数据录入区域 - 已合并日期与店铺选择 */}
          <div>
            <OutputForm 
              onSuccess={handleFormSuccess} 
              onSelectionChange={handleSelectionChange}
              selection={selection}
            />
          </div>

          {/* 最近录入数据区域 */}
          <div className="space-y-0">
            <div className="flex flex-col">
              <FilterPanel onFilterChange={handleFilterChange} />
              <div className="mt-[-1px]">
                <OutputList filter={filter} />
              </div>
            </div>
          </div>

          {/* 当日数据汇总区域 */}
          <div>
            <OutputSummary />
          </div>
        </div>
      </main>
    </div>
  );
} 