"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, User, Bell, Key, Shield, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import useI18n from "@/hooks/use-i18n"
import { Language } from "@/lib/i18n"
import { RefreshInterval } from "@/hooks/use-auto-refresh"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { t, currentLanguage, changeLanguage, languageNames } = useI18n();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(30)
  const [isDirty, setIsDirty] = useState(false)

  // 初始化时加载保存的刷新间隔设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInterval = localStorage.getItem('dashboard-refresh-interval');
      if (savedInterval) {
        if (savedInterval === 'null') {
          setRefreshInterval(null);
        } else {
          const interval = parseInt(savedInterval, 10) as RefreshInterval;
          if ([30, 60, 300, 600].includes(interval)) {
            setRefreshInterval(interval);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 保存设置
  const handleSaveSettings = () => {
    // 保存刷新间隔设置
    localStorage.setItem('dashboard-refresh-interval', refreshInterval ? refreshInterval.toString() : 'null');
    
    // 显示保存成功提示
    toast({
      title: t('common.saved'),
      description: t('settings.saveSuccess'),
    });
    
    setIsDirty(false);
  };

  // 处理刷新间隔变化
  const handleRefreshIntervalChange = (value: string) => {
    const interval = value === 'disabled' ? null : parseInt(value, 10) as RefreshInterval;
    setRefreshInterval(interval);
    setIsDirty(true);
  };

  // 处理语言变化
  const handleLanguageChange = (value: string) => {
    changeLanguage(value as Language);
    setIsDirty(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNav />
      
      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <PageHeader 
          title={t('settings.title')} 
          description={t('settings.description')}
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
              <CardTitle className="text-lg font-medium">{t('settings.settingsOptions')}</CardTitle>
              <CardDescription>{t('settings.customSettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full sm:w-auto sm:inline-flex mb-6">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>{t('settings.general.title')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="account" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{t('settings.account.title')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span>{t('settings.notifications.title')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>{t('settings.security.title')}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="animate-fade-in space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h3 className="font-medium">{t('settings.general.language')}</h3>
                        <p className="text-sm text-gray-500">{t('settings.general.languageDesc')}</p>
                      </div>
                      <div className="flex items-center">
                        <select 
                          className="border rounded p-1.5 text-sm"
                          value={currentLanguage}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                        >
                          {Object.entries(languageNames).map(([code, name]) => (
                            <option key={code} value={code}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h3 className="font-medium">{t('settings.general.theme')}</h3>
                        <p className="text-sm text-gray-500">{t('settings.general.themeDesc')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8">{t('settings.general.light')}</Button>
                        <Button variant="outline" size="sm" className="h-8">{t('settings.general.dark')}</Button>
                        <Button variant="outline" size="sm" className="h-8">{t('settings.general.system')}</Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h3 className="font-medium">{t('settings.general.pagination')}</h3>
                        <p className="text-sm text-gray-500">{t('settings.general.paginationDesc')}</p>
                      </div>
                      <div className="flex items-center">
                        <select className="border rounded p-1.5 text-sm">
                          <option value="10">10 {t('settings.general.perPage')}</option>
                          <option value="20">20 {t('settings.general.perPage')}</option>
                          <option value="50">50 {t('settings.general.perPage')}</option>
                          <option value="100">100 {t('settings.general.perPage')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{t('settings.general.autoRefresh')}</h3>
                        <p className="text-sm text-gray-500">{t('settings.general.autoRefreshDesc')}</p>
                      </div>
                      <div className="flex items-center">
                        <select 
                          className="border rounded p-1.5 text-sm"
                          value={refreshInterval?.toString() || 'disabled'}
                          onChange={(e) => handleRefreshIntervalChange(e.target.value)}
                        >
                          <option value="30">30 {t('settings.general.seconds')}</option>
                          <option value="60">1 {t('settings.general.minute')}</option>
                          <option value="300">5 {t('settings.general.minutes')}</option>
                          <option value="600">10 {t('settings.general.minutes')}</option>
                          <option value="disabled">{t('settings.general.disabled')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <CardFooter className="px-0 border-t pt-4">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 transition-all duration-300"
                      onClick={handleSaveSettings}
                      disabled={!isDirty}
                    >
                      {t('common.save')}
                    </Button>
                  </CardFooter>
                </TabsContent>

                <TabsContent value="account" className="animate-fade-in">
                  <p className="text-center py-6 text-gray-500">{t('settings.account.developing')}</p>
                </TabsContent>

                <TabsContent value="notifications" className="animate-fade-in">
                  <p className="text-center py-6 text-gray-500">{t('settings.notifications.developing')}</p>
                </TabsContent>

                <TabsContent value="security" className="animate-fade-in">
                  <p className="text-center py-6 text-gray-500">{t('settings.security.developing')}</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 