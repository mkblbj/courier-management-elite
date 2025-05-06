"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OutputForm from "./components/OutputForm";
import OutputList from "./components/OutputList";
import FilterPanel from "./components/FilterPanel";
import OutputSummary from "./components/OutputSummary";
import { ShopOutputFilter } from "@/lib/types/shop-output";

export default function OutputDataPage() {
  const { t } = useTranslation(['common', 'shop']);
  const [activeTab, setActiveTab] = useState("list");
  const [filter, setFilter] = useState<ShopOutputFilter>({});

  const handleFilterChange = (newFilter: ShopOutputFilter) => {
    setFilter(newFilter);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('shop:shop_output_management')}</h1>
      </div>

      <Tabs
        defaultValue="list"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="list">{t('shop:output_data_list')}</TabsTrigger>
          <TabsTrigger value="add">{t('shop:add_output_data')}</TabsTrigger>
          <TabsTrigger value="summary">{t('shop:data_summary')}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <FilterPanel onFilterChange={handleFilterChange} />
          <OutputList filter={filter} />
        </TabsContent>

        <TabsContent value="add">
          <OutputForm 
            onSuccess={() => setActiveTab("list")}
          />
        </TabsContent>

        <TabsContent value="summary">
          <OutputSummary />
        </TabsContent>
      </Tabs>
    </div>
  );
} 