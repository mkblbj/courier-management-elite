"use client";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ApiErrorProps {
  message: string
  onRetry?: () => void
}

export function ApiError({ message, onRetry }: ApiErrorProps) {
  const {
    t: t
  } = useTranslation();

  return (
    (<div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{t("数据加载失败")}</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />{t("重试")}</Button>
      )}
    </div>)
  );
}
