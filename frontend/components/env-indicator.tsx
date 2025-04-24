"use client"

import { useEnvStore } from "@/lib/env-config"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function EnvIndicator({ className }: { className?: string }) {
  const { env, isDev, apiBaseUrl } = useEnvStore()

  // 只在开发环境中显示
  // 添加NODE_ENV检查，确保在生产环境中不显示
  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            variant={isDev ? "outline" : "destructive"}
            className={cn(
              "px-2 py-0.5 text-xs font-medium transition-all duration-300",
              isDev ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "hover:bg-red-700",
              className,
            )}
          >
            {env}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">API: {apiBaseUrl}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
