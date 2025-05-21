import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerWithRangeProps {
      dateRange: DateRange;
      onDateRangeChange: (range: DateRange) => void;
      className?: string;
}

export function DatePickerWithRange({
      dateRange,
      onDateRangeChange,
      className,
}: DatePickerWithRangeProps) {
      return (
            <div className={cn("grid gap-2", className)}>
                  <Popover>
                        <PopoverTrigger asChild>
                              <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                          "w-[240px] justify-start text-left font-normal",
                                          !dateRange && "text-muted-foreground"
                                    )}
                              >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                          dateRange.to ? (
                                                <>
                                                      {format(dateRange.from, "yyyy-MM-dd")} ~{" "}
                                                      {format(dateRange.to, "yyyy-MM-dd")}
                                                </>
                                          ) : (
                                                format(dateRange.from, "yyyy-MM-dd")
                                          )
                                    ) : (
                                          <span>选择日期范围</span>
                                    )}
                              </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={onDateRangeChange}
                                    numberOfMonths={2}
                              />
                              <div className="flex justify-between p-3 border-t">
                                    <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                                const today = new Date();
                                                const weekStart = new Date(today);
                                                weekStart.setDate(today.getDate() - today.getDay());
                                                const weekEnd = new Date(weekStart);
                                                weekEnd.setDate(weekStart.getDate() + 6);
                                                onDateRangeChange({ from: weekStart, to: weekEnd });
                                          }}
                                    >
                                          本周
                                    </Button>
                                    <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                                const today = new Date();
                                                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                                                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                                onDateRangeChange({ from: monthStart, to: monthEnd });
                                          }}
                                    >
                                          本月
                                    </Button>
                                    <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                                const today = new Date();
                                                const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                                                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                                                onDateRangeChange({ from: lastMonthStart, to: lastMonthEnd });
                                          }}
                                    >
                                          上月
                                    </Button>
                              </div>
                        </PopoverContent>
                  </Popover>
            </div>
      );
} 