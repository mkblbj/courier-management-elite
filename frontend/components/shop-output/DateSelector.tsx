import React from "react";
import { useTranslation } from "react-i18next";
import { format, addDays, isAfter, startOfDay, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { DATE_FORMAT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const handleSelectToday = () => {
    onDateChange(today);
    setOpen(false);
  };

  const handleSelectTomorrow = () => {
    onDateChange(tomorrow);
    setOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    return isAfter(today, date) && !isSameDay(today, date);
  };

  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      {label && <span className="text-sm font-medium">{label || defaultLabel}</span>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, DATE_FORMAT) : (placeholder || defaultPlaceholder)}
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
            locale={i18n.language === 'zh-CN' ? zhCN : undefined}
            disabled={isDateDisabled}
            defaultMonth={date || today}
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