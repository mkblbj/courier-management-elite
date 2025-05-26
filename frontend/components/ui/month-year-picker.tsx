import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MonthYearRange {
      from?: { year: number; month?: number };
      to?: { year: number; month?: number };
}

interface MonthYearPickerProps {
      value?: MonthYearRange;
      onChange: (value: MonthYearRange | undefined) => void;
      mode: 'month' | 'year';
      className?: string;
}

export function MonthYearPicker({ value, onChange, mode, className }: MonthYearPickerProps) {
      const { t } = useTranslation();
      const [isOpen, setIsOpen] = useState(false);
      const [viewYear, setViewYear] = useState(new Date().getFullYear());

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const months = [
            { value: 1, label: t('1月') },
            { value: 2, label: t('2月') },
            { value: 3, label: t('3月') },
            { value: 4, label: t('4月') },
            { value: 5, label: t('5月') },
            { value: 6, label: t('6月') },
            { value: 7, label: t('7月') },
            { value: 8, label: t('8月') },
            { value: 9, label: t('9月') },
            { value: 10, label: t('10月') },
            { value: 11, label: t('11月') },
            { value: 12, label: t('12月') },
      ];

      const formatDisplay = () => {
            if (!value?.from) return mode === 'month' ? t('选择月份范围') : t('选择年份范围');

            if (mode === 'year') {
                  if (value.to && value.from.year !== value.to.year) {
                        return `${value.from.year} - ${value.to.year}`;
                  }
                  return `${value.from.year}`;
            } else {
                  const fromStr = `${value.from.year}-${String(value.from.month || 1).padStart(2, '0')}`;
                  if (value.to && (value.from.year !== value.to.year || value.from.month !== value.to.month)) {
                        const toStr = `${value.to.year}-${String(value.to.month || 12).padStart(2, '0')}`;
                        return `${fromStr} - ${toStr}`;
                  }
                  return fromStr;
            }
      };

      const handleYearSelect = (year: number) => {
            if (mode === 'year') {
                  if (!value?.from) {
                        onChange({ from: { year } });
                  } else if (!value.to) {
                        if (year >= value.from.year) {
                              onChange({ from: value.from, to: { year } });
                        } else {
                              onChange({ from: { year }, to: value.from });
                        }
                        setIsOpen(false);
                  } else {
                        onChange({ from: { year } });
                  }
            } else {
                  setViewYear(year);
            }
      };

      const handleMonthSelect = (month: number) => {
            if (mode === 'month') {
                  const selection = { year: viewYear, month };

                  if (!value?.from) {
                        onChange({ from: selection });
                  } else if (!value.to) {
                        const fromTime = value.from.year * 12 + (value.from.month || 1);
                        const toTime = selection.year * 12 + selection.month;

                        if (toTime >= fromTime) {
                              onChange({ from: value.from, to: selection });
                        } else {
                              onChange({ from: selection, to: value.from });
                        }
                        setIsOpen(false);
                  } else {
                        onChange({ from: selection });
                  }
            }
      };

      const handleQuickSelect = (type: string) => {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;

            switch (type) {
                  case 'thisYear':
                        onChange({ from: { year }, to: { year } });
                        break;
                  case 'lastYear':
                        onChange({ from: { year: year - 1 }, to: { year: year - 1 } });
                        break;
                  case 'thisMonth':
                        onChange({ from: { year, month }, to: { year, month } });
                        break;
                  case 'lastMonth':
                        const lastMonth = month === 1 ? 12 : month - 1;
                        const lastMonthYear = month === 1 ? year - 1 : year;
                        onChange({ from: { year: lastMonthYear, month: lastMonth }, to: { year: lastMonthYear, month: lastMonth } });
                        break;
                  case 'last3Months':
                        const threeMonthsAgo = new Date(year, month - 4, 1);
                        onChange({
                              from: { year: threeMonthsAgo.getFullYear(), month: threeMonthsAgo.getMonth() + 1 },
                              to: { year, month }
                        });
                        break;
                  case 'last6Months':
                        const sixMonthsAgo = new Date(year, month - 7, 1);
                        onChange({
                              from: { year: sixMonthsAgo.getFullYear(), month: sixMonthsAgo.getMonth() + 1 },
                              to: { year, month }
                        });
                        break;
            }
            setIsOpen(false);
      };

      const renderYearView = () => {
            const years = [];
            const startYear = currentYear - 10;
            const endYear = currentYear + 2;

            for (let year = startYear; year <= endYear; year++) {
                  years.push(year);
            }

            return (
                  <div className="p-3">
                        <div className="grid grid-cols-3 gap-2">
                              {years.map((year) => {
                                    const isSelected = value?.from?.year === year || value?.to?.year === year;
                                    const isInRange = value?.from && value?.to &&
                                          year >= Math.min(value.from.year, value.to.year) &&
                                          year <= Math.max(value.from.year, value.to.year);

                                    return (
                                          <Button
                                                key={year}
                                                variant={isSelected ? "default" : "outline"}
                                                size="sm"
                                                className={cn(
                                                      "h-8 text-xs",
                                                      isInRange && !isSelected && "bg-muted",
                                                      year === currentYear && "font-bold"
                                                )}
                                                onClick={() => handleYearSelect(year)}
                                          >
                                                {year}
                                          </Button>
                                    );
                              })}
                        </div>
                  </div>
            );
      };

      const renderMonthView = () => {
            return (
                  <div className="p-3">
                        <div className="flex items-center justify-between mb-3">
                              <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewYear(viewYear - 1)}
                              >
                                    <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <span className="font-medium">{viewYear}</span>
                              <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewYear(viewYear + 1)}
                              >
                                    <ChevronRight className="h-4 w-4" />
                              </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                              {months.map((month) => {
                                    const isSelected = value?.from?.year === viewYear && value?.from?.month === month.value ||
                                          value?.to?.year === viewYear && value?.to?.month === month.value;

                                    const isInRange = value?.from && value?.to && (() => {
                                          const fromTime = value.from.year * 12 + (value.from.month || 1);
                                          const toTime = value.to.year * 12 + (value.to.month || 12);
                                          const currentTime = viewYear * 12 + month.value;
                                          return currentTime >= Math.min(fromTime, toTime) && currentTime <= Math.max(fromTime, toTime);
                                    })();

                                    return (
                                          <Button
                                                key={month.value}
                                                variant={isSelected ? "default" : "outline"}
                                                size="sm"
                                                className={cn(
                                                      "h-8 text-xs",
                                                      isInRange && !isSelected && "bg-muted",
                                                      viewYear === currentYear && month.value === currentMonth && "font-bold"
                                                )}
                                                onClick={() => handleMonthSelect(month.value)}
                                          >
                                                {month.label}
                                          </Button>
                                    );
                              })}
                        </div>
                  </div>
            );
      };

      const renderQuickOptions = () => {
            const options = mode === 'year'
                  ? [
                        { key: 'thisYear', label: t('今年') },
                        { key: 'lastYear', label: t('去年') },
                  ]
                  : [
                        { key: 'thisMonth', label: t('本月') },
                        { key: 'lastMonth', label: t('上月') },
                        { key: 'last3Months', label: t('最近3个月') },
                        { key: 'last6Months', label: t('最近6个月') },
                  ];

            return (
                  <div className="p-3 border-b space-y-2">
                        <h3 className="text-sm font-medium">{t('快捷选项')}</h3>
                        <div className="grid grid-cols-2 gap-2">
                              {options.map((option) => (
                                    <Button
                                          key={option.key}
                                          variant="outline"
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => handleQuickSelect(option.key)}
                                    >
                                          {option.label}
                                    </Button>
                              ))}
                        </div>
                  </div>
            );
      };

      return (
            <div className={cn("grid gap-2", className)}>
                  <Popover open={isOpen} onOpenChange={setIsOpen}>
                        <PopoverTrigger asChild>
                              <Button
                                    variant="outline"
                                    className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !value?.from && "text-muted-foreground"
                                    )}
                              >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formatDisplay()}
                              </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                              <div className="flex flex-col">
                                    {renderQuickOptions()}
                                    {mode === 'year' ? renderYearView() : renderMonthView()}
                              </div>
                        </PopoverContent>
                  </Popover>
            </div>
      );
} 