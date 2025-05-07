"use client";

import { Suspense, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileInput, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { useEnvStore } from "@/lib/env-config";
import { ApiDebug } from "@/components/api-debug";
import { ShopOutputList } from "@/components/shop-output/ShopOutputList";
import { OutputListSkeleton } from "@/components/shop-output/OutputListSkeleton";

export default function OutputDataPage() {
  const { debug } = useEnvStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNav />
      
      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <PageHeader
          title="店铺出力数据管理"
          description="管理店铺每日出力数据"
          className="max-w-5xl mx-auto"
          action={
            <Link href="/courier-types?tab=shop-management">
              <Button variant="outline" className="transition-all duration-300">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回店铺管理
              </Button>
            </Link>
          }
        />
        <div
          className={cn(
            "transition-all duration-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <div className="bg-white shadow rounded-lg p-6 max-w-5xl mx-auto">
            <Suspense fallback={<OutputListSkeleton />}>
              <ShopOutputList />
            </Suspense>
          </div>
          {debug && (
            <div className="mt-8 max-w-5xl mx-auto">
              <ApiDebug />
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 