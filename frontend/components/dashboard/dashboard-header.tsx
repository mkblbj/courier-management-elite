"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/language-switcher";
import { useTranslation } from "react-i18next";

export function DashboardHeader() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { t } = useTranslation("common");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    setIsMounted(true);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <header className="bg-white border-b sticky top-0 z-30">
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
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
