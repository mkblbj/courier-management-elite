import React from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
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
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  date,
  onDateChange,
  label,
  placeholder,
  className,
}) => {
  const { t, i18n } = useTranslation(['common', 'shop']);
  const defaultLabel = t('shop:select_date');
  const defaultPlaceholder = t('shop:select_date_placeholder');

  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      {label && <span className="text-sm font-medium">{label || defaultLabel}</span>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, DATE_FORMAT.replace(/Y/g, "y")) : (placeholder || defaultPlaceholder)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            initialFocus
            locale={i18n.language === 'zh-CN' ? zhCN : undefined}
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
      />
      <DateSelector
        date={dateTo}
        onDateChange={onDateToChange}
        label={labelTo || t('shop:to_date')}
        placeholder={placeholder}
        className="w-full"
      />
    </div>
  );
};

export default DateSelector; 