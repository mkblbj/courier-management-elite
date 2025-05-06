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

  const handleFilterChange = (newFilter: ShopOutputFilter) => {
    setFilter(newFilter);
  };

  const handleFormSuccess = () => {
    // 表单提交成功后刷新列表
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

        <div className={cn(
          "grid grid-cols-1 gap-6 transition-all duration-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}>
          {/* 数据录入区域 */}
          <div>
            <OutputForm onSuccess={handleFormSuccess} />
          </div>

          {/* 最近录入数据区域 */}
          <div>
            <FilterPanel onFilterChange={handleFilterChange} />
            <div className="mt-4">
              <OutputList filter={filter} />
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