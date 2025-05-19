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
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageFontProvider } from "@/components/language-font-provider";

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
    <html lang="zh-CN" className="theme-transition">
      <body className="bg-background text-foreground min-h-screen transition-colors">
        <I18nProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <LanguageFontProvider>
              <div className="bg-background min-h-screen flex flex-col">
                <EnvInitializer />
                <PageLoading />
                <RouteChangeLoading />
                <div className="flex-1 flex flex-col bg-background">
                  {children}
                </div>
                <ToastProvider />
                <EnvSwitcher />
                <DebugLogger />
              </div>
            </LanguageFontProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
