"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DateSelector as CommonDateSelector } from "@/components/shop-output/DateSelector";
import { DATE_FORMAT } from "@/lib/constants";

export default function DateSelector() {
      const [selectedDate, setSelectedDate] = useState<Date>(new Date());

      const handleDateChange = (date: Date | undefined) => {
            if (date) {
                  setSelectedDate(date);
                  // 在后续故事中实现日期变更处理逻辑
                  console.log("Selected date:", format(date, DATE_FORMAT));
            }
      };

      return (
            <CommonDateSelector
                  date={selectedDate}
                  onDateChange={handleDateChange}
                  showQuickButtons={true}
                  label=""
                  className="w-full max-w-xs"
            />
      );
} 