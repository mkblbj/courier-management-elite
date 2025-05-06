"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShopSelector } from "@/components/shop-output/ShopSelector";
import { DateRangeSelector } from "@/components/shop-output/DateSelector";
import { ShopOutputFilter } from "@/lib/types/shop-output";
import { DATE_FORMAT } from "@/lib/constants";

interface FilterPanelProps {
  onFilterChange: (filter: ShopOutputFilter) => void;
}

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const { t } = useTranslation(['common', 'shop']);
  const [shopId, setShopId] = useState<number | undefined>(undefined);
  const [courierTypeId, setCourierTypeId] = useState<number | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");

  // 这里应该添加快递类型选择器，
  // 但因为还没有相关API，暂时不实现

  const handleApplyFilter = () => {
    const filter: ShopOutputFilter = {};

    if (shopId) {
      filter.shop_id = shopId;
    }

    if (courierTypeId) {
      filter.courier_id = courierTypeId;
    }

    if (dateFrom) {
      filter.date_from = format(dateFrom, DATE_FORMAT.replace(/Y/g, "y"));
    }

    if (dateTo) {
      filter.date_to = format(dateTo, DATE_FORMAT.replace(/Y/g, "y"));
    }

    if (searchTerm) {
      filter.search = searchTerm;
    }

    onFilterChange(filter);
  };

  const handleResetFilter = () => {
    setShopId(undefined);
    setCourierTypeId(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchTerm("");
    onFilterChange({});
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <ShopSelector
              selectedShopId={shopId}
              onSelectShop={setShopId}
              label={t('shop:shop')}
            />
          </div>
          <div>
            {/* 快递类型选择器 - 占位，后续实现 */}
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium">{t('shop:courier_type')}</span>
              <Input
                placeholder={t('未实现')}
                disabled
              />
            </div>
          </div>
          <div className="relative">
            <span className="text-sm font-medium">{t('shop:search')}</span>
            <div className="relative mt-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('shop:search_placeholder')}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <DateRangeSelector
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={handleResetFilter}>
            {t('shop:reset')}
          </Button>
          <Button onClick={handleApplyFilter}>
            {t('shop:apply_filter')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 