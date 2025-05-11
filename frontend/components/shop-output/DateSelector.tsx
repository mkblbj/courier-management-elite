import React from "react";
import { useTranslation } from "react-i18next";
import { format, addDays, isAfter, startOfDay, isSameDay } from "date-fns";
import { zhCN, enUS, ja } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { DATE_FORMAT, DATE_WITH_WEEKDAY_FORMAT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  APP_TIMEZONE,
  getTodayInAppTimezone,
  getTomorrowInAppTimezone,
  formatDisplayDate,
  isSameDayInAppTimezone
} from "@/lib/date-utils";
import { formatInTimeZone } from "date-fns-tz";

interface DateSelectorProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  showQuickButtons?: boolean;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  date,
  onDateChange,
  label,
  placeholder,
  className,
  showQuickButtons = true,
}) => {
  const { t, i18n } = useTranslation(['common', 'shop']);
  const defaultLabel = t('shop:select_date');
  const defaultPlaceholder = t('shop:select_date_placeholder');
  const [open, setOpen] = React.useState(false);

  // 使用工具函数获取今天和明天的日期
  const today = getTodayInAppTimezone();
  const tomorrow = getTomorrowInAppTimezone();

  const handleSelectToday = () => {
    onDateChange(today);
    setOpen(false);
  };

  const handleSelectTomorrow = () => {
    onDateChange(tomorrow);
    setOpen(false);
  };

  // 根据当前语言选择locale
  const getLocale = () => {
    switch (i18n.language) {
      case 'zh-CN':
        return zhCN;
      case 'ja':
        return ja;
      case 'en':
      case 'en-US':
        return enUS;
      default:
        return undefined;
    }
  };

  // 格式化日期，添加星期信息，使用应用时区
  const formatDateWithWeekday = (date: Date) => {
    if (!date) return '';

    const locale = getLocale();

    // 根据当前语言格式化星期
    let weekdayFormat;
    switch (i18n.language) {
      case 'zh-CN':
        weekdayFormat = 'eeee';
        break;
      case 'ja':
        weekdayFormat = 'eeeeee曜日';
        break;
      case 'en':
      case 'en-US':
      default:
        weekdayFormat = 'eeee';
        break;
    }

    // 使用环境变量中的时区格式化日期
    const dateString = formatInTimeZone(date, APP_TIMEZONE, DATE_FORMAT);
    const weekday = formatInTimeZone(date, APP_TIMEZONE, weekdayFormat, { locale });
    return `${dateString} ${weekday}`;
  };

  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      {label && <span className="text-sm font-medium">{label || defaultLabel}</span>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full h-10 px-3 py-2 justify-between text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? formatDateWithWeekday(date) : (placeholder || defaultPlaceholder)}
            </div>
            <span className="opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0"><path d="m6 9 6 6 6-6" /></svg>
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {showQuickButtons && (
            <div className="flex border-b p-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleSelectToday}
              >
                {t('shop:today')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleSelectTomorrow}
              >
                {t('shop:tomorrow')}
              </Button>
            </div>
          )}
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            initialFocus
            locale={getLocale()}
            defaultMonth={date || today}
            formatters={{
              formatCaption: (date, options) => {
                return formatInTimeZone(date, APP_TIMEZONE, 'yyyy-MM', { locale: options?.locale });
              },
              formatDay: (date, options) => {
                return formatInTimeZone(date, APP_TIMEZONE, 'd', { locale: options?.locale });
              }
            }}
            modifiers={{
              today: (date) => isSameDayInAppTimezone(date, today)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface DateRangeSelectorProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  labelFrom?: string;
  labelTo?: string;
  placeholder?: string;
  className?: string;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  labelFrom,
  labelTo,
  placeholder,
  className,
}) => {
  const { t } = useTranslation(['common', 'shop']);

  return (
    <div className={cn("flex space-x-4", className)}>
      <DateSelector
        date={dateFrom}
        onDateChange={onDateFromChange}
        label={labelFrom || t('shop:from_date')}
        placeholder={placeholder}
        className="w-full"
        showQuickButtons={false}
      />
      <DateSelector
        date={dateTo}
        onDateChange={onDateToChange}
        label={labelTo || t('shop:to_date')}
        placeholder={placeholder}
        className="w-full"
        showQuickButtons={false}
      />
    </div>
  );
};

export default DateSelector; 