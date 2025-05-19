"use client";
import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, User, Bell, Key, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"

export default function SettingsPage() {
  const {
    t: t
  } = useTranslation();

  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    (<div className="min-h-screen bg-background">
      <DashboardHeader />
      <DashboardNav />
      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <PageHeader
          title={t("系统设置")}
          description={t("管理系统设置和用户首选项")}
          className="max-w-5xl mx-auto"
        />

        <div
          className={cn(
            "transition-all duration-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <Card className="border max-w-5xl mx-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">{t("设置选项")}</CardTitle>
              <CardDescription>{t("自定义系统设置以满足您的需求")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full sm:w-auto sm:inline-flex mb-6">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>{t("常规设置")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="account" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{t("账户管理")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span>{t("通知设置")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>{t("安全选项")}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="animate-fade-in space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h3 className="font-medium">{t("界面语言")}</h3>
                        <p className="text-sm text-gray-500">{t("设置系统界面的显示语言")}</p>
                      </div>
                      <div className="flex items-center">
                        <select className="border rounded p-1.5 text-sm">
                          <option value="zh-CN">{t("简体中文")}</option>
                          <option value="en-US">English</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h3 className="font-medium">{t("主题设置")}</h3>
                        <p className="text-sm text-gray-500">{t("选择系统的显示主题")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8">{t("浅色")}</Button>
                        <Button variant="outline" size="sm" className="h-8">{t("深色")}</Button>
                        <Button variant="outline" size="sm" className="h-8">{t("跟随系统")}</Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{t("数据分页设置")}</h3>
                        <p className="text-sm text-gray-500">{t("设置每页显示的记录数量")}</p>
                      </div>
                      <div className="flex items-center">
                        <select className="border rounded p-1.5 text-sm">
                          <option value="10">{t("10条/页")}</option>
                          <option value="20">{t("20条/页")}</option>
                          <option value="50">{t("50条/页")}</option>
                          <option value="100">{t("100条/页")}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <CardFooter className="px-0 border-t pt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700 transition-all duration-300">{t("保存设置")}</Button>
                  </CardFooter>
                </TabsContent>

                <TabsContent value="account" className="animate-fade-in">
                  <p className="text-center py-6 text-gray-500">{t("账户管理功能正在开发中")}</p>
                </TabsContent>

                <TabsContent value="notifications" className="animate-fade-in">
                  <p className="text-center py-6 text-gray-500">{t("通知设置功能正在开发中")}</p>
                </TabsContent>

                <TabsContent value="security" className="animate-fade-in">
                  <p className="text-center py-6 text-gray-500">{t("安全选项功能正在开发中")}</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>)
  );
} 