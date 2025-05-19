"use client";

import Link from "next/link";
import { Package, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { AnimatedMenu } from "@/components/animated-menu";

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
    <header className="bg-white dark:bg-gray-950 border-0 border-none sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 w-full">
        {/* 左侧区域：欢迎信息和时间 */}
        <div className="flex flex-col justify-center h-full pl-4">
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

          <div className={cn(
            "flex items-center gap-1 text-gray-600 dark:text-gray-300 transition-all duration-500",
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}>
            <Clock className="h-3 w-3" />
            <span className="text-xs">
              {formattedDate} {weekday} {formattedTime}
            </span>
          </div>
        </div>

        {/* 中间区域：菜单 - 使用flex而非绝对定位 */}
        <div className="flex-1 flex justify-center items-center">
          <div className="inline-block">
            <AnimatedMenu />
          </div>
        </div>

        {/* 右侧区域：主题和语言切换 */}
        <div className="flex items-center gap-4 pr-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
