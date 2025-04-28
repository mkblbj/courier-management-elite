import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";
import { PageLoading } from "@/components/page-loading";
import { RouteChangeLoading } from "@/components/route-change-loading";
import { EnvSwitcher } from "@/components/env-switcher";
import { DebugLogger } from "@/components/debug-logger";
import { EnvInitializer } from "@/components/env-initializer";
import { I18nProvider } from "@/components/i18n-provider";

export const metadata: Metadata = {
  title: "UOcourier",
  description: "Courier management system",
  generator: "UO Company",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <I18nProvider>
          <EnvInitializer />
          <PageLoading />
          <RouteChangeLoading />
          {children}
          <ToastProvider />
          <EnvSwitcher />
          <DebugLogger />
        </I18nProvider>
      </body>
    </html>
  );
}
