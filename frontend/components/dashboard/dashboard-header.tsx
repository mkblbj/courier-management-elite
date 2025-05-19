"use client";

import Link from "next/link";
import { Package, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

export function DashboardHeader() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { t } = useTranslation("common");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    setIsMounted(true);

    return () => clearTimeout(timer);
  }, []);

  // 添加时间更新计时器
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // 每秒更新

    return () => clearInterval(intervalId); // 组件卸载时清除计时器
  }, []);

  // 格式化时间显示
  const formattedDate = isMounted ? format(currentTime, "yyyy-MM-dd") : "";
  const weekday = isMounted ? t(`weekday.full.${format(currentTime, 'EEEE').toLowerCase()}`) : "";
  const formattedTime = isMounted ? format(currentTime, "HH:mm:ss") : "";

  return (
    <header className="bg-white dark:bg-gray-950 border-b sticky top-0 z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 transition-all duration-500",
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-4"
            )}
          >
            <Package className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">
              {isMounted ? t("welcome") : ""}
            </span>
          </Link>
        </div>
        <div className={cn(
          "flex items-center gap-2 text-gray-600 dark:text-gray-300 transition-all duration-500",
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        )}>
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            {formattedDate} {weekday} {formattedTime}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
