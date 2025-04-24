import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ToastProvider } from "@/components/ui/toast-provider"
import { PageLoading } from "@/components/page-loading"
import { RouteChangeLoading } from "@/components/route-change-loading"
import { EnvSwitcher } from "@/components/env-switcher"
import { DebugLogger } from "@/components/debug-logger"
import { EnvInitializer } from "@/components/env-initializer"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <EnvInitializer />
        <PageLoading />
        <RouteChangeLoading />
        {children}
        <ToastProvider />
        <EnvSwitcher />
        <DebugLogger />
      </body>
    </html>
  )
}
