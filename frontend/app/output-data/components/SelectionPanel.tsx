"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DateSelector from "@/components/shop-output/DateSelector";
import ShopSelector from "@/components/shop-output/ShopSelector";
import CourierSelector from "@/components/shop-output/CourierSelector";
import { DATE_FORMAT } from "@/lib/constants";

interface SelectionPanelProps {
  onSelectionChange: (selection: {
    date: Date | undefined;
    shopId: number | undefined;
    courierId: number | undefined;
  }) => void;
  showTitle?: boolean;
}

export default function SelectionPanel({
  onSelectionChange,
  showTitle = true,
}: SelectionPanelProps) {
  const { t } = useTranslation(['common', 'shop']);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [shopId, setShopId] = useState<number | undefined>(undefined);
  const [courierId, setCourierId] = useState<number | undefined>(undefined);

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    onSelectionChange({
      date: newDate,
      shopId,
      courierId,
    });
  };

  const handleShopChange = (newShopId: number | undefined) => {
    setShopId(newShopId);
    onSelectionChange({
      date,
      shopId: newShopId,
      courierId,
    });
  };

  const handleCourierChange = (newCourierId: number | undefined) => {
    setCourierId(newCourierId);
    onSelectionChange({
      date,
      shopId,
      courierId: newCourierId,
    });
  };

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle>{t('shop:selection_panel_title')}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DateSelector
            date={date}
            onDateChange={handleDateChange}
            label={t('shop:date')}
            className="w-full"
          />
          <ShopSelector
            selectedShopId={shopId}
            onSelectShop={handleShopChange}
            label={t('shop:shop')}
            className="w-full"
          />
          <CourierSelector
            selectedCourierId={courierId}
            onSelectCourier={handleCourierChange}
            label={t('shop:courier')}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
} 