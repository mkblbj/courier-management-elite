"use client"
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useState, useEffect } from "react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  value?: DateRange
  onChange: (value: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleTodayClick = () => {
    const today = new Date()
    onChange({ from: today, to: today })
    setIsOpen(false)
  }

  const handleQuickOptionSelect = (option: string) => {
    const today = new Date()
    let from: Date
    let to: Date = today

    switch (option) {
      case "last7Days":
        from = subDays(today, 6) // Last 7 days including today
        break
      case "last30Days":
        from = subDays(today, 29) // Last 30 days including today
        break
      case "thisMonth":
        from = startOfMonth(today)
        to = endOfMonth(today)
        break
      case "lastMonth":
        const lastMonth = subMonths(today, 1)
        from = startOfMonth(lastMonth)
        to = endOfMonth(lastMonth)
        break
      case "thisWeek":
        from = startOfWeek(today, { weekStartsOn: 1 }) // Week starts on Monday
        to = endOfWeek(today, { weekStartsOn: 1 })
        break
      default:
        return
    }

    onChange({ from, to })
    setIsOpen(false)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal transition-all",
              !value && "text-muted-foreground",
              "hover:bg-muted/20 focus:ring-1 focus:ring-blue-500",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "yyyy-MM-dd")} - {format(value.to, "yyyy-MM-dd")}
                </>
              ) : (
                format(value.from, "yyyy-MM-dd")
              )
            ) : (
              <span>选择日期范围</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          sideOffset={4}
          alignOffset={0}
          side="bottom"
          avoidCollisions={true}
          collisionPadding={20}
          style={{ zIndex: 9999, minWidth: isMobile ? "280px" : "auto" }}
        >
          <div className="flex flex-col md:flex-row">
            {/* Quick Options - Always visible on the left */}
            <div className="p-3 border-b md:border-b-0 md:border-r md:w-[180px] space-y-2 bg-muted/5">
              <h3 className="text-sm font-medium mb-2">快捷选项</h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left hover:bg-blue-50 transition-colors"
                onClick={handleTodayClick}
              >
                今天
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left hover:bg-blue-50 transition-colors"
                onClick={() => handleQuickOptionSelect("last7Days")}
              >
                最近7天
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left hover:bg-blue-50 transition-colors"
                onClick={() => handleQuickOptionSelect("last30Days")}
              >
                最近30天
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left hover:bg-blue-50 transition-colors"
                onClick={() => handleQuickOptionSelect("thisWeek")}
              >
                本周
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left hover:bg-blue-50 transition-colors"
                onClick={() => handleQuickOptionSelect("thisMonth")}
              >
                本月
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left hover:bg-blue-50 transition-colors"
                onClick={() => handleQuickOptionSelect("lastMonth")}
              >
                上个月
              </Button>
            </div>

            {/* Calendar - Always visible on the right */}
            <div className="p-3">
              <div className="p-1 border-b mb-2 flex justify-between items-center">
                <span className="text-sm font-medium">选择日期范围</span>
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={onChange}
                numberOfMonths={isMobile ? 1 : 2}
                className="p-0"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
