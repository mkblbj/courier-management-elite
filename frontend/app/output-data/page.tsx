"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DateSelector } from "@/components/shop-output/DateSelector";
import OutputForm from "./components/OutputForm";
import OutputList from "./components/OutputList";
import OutputSummary from "./components/OutputSummary";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default function OutputDataPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNav />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">出力数据</h1>

        {/* 日期选择区域 */}
        <Card className="mb-6">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-xl">日期选择</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Suspense fallback={<DateSelectorSkeleton />}>
              <DateSelector
                date={new Date()}
                onDateChange={() => { }}
                showQuickButtons={true}
              />
            </Suspense>
          </CardContent>
        </Card>

        {/* 数据录入表单区域 */}
        <Card className="mb-6">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-xl">数据录入</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Suspense fallback={<OutputFormSkeleton />}>
              <OutputForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* 下部区域容器 - 响应式布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 最近录入数据区域 */}
          <Card className="lg:col-span-1">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-xl">最近录入数据</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Suspense fallback={<OutputListSkeleton />}>
                <OutputList />
              </Suspense>
            </CardContent>
          </Card>

          {/* 当日数据汇总区域 */}
          <Card className="lg:col-span-1">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-xl">当日数据汇总</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Suspense fallback={<OutputSummarySkeleton />}>
                <OutputSummary />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// 骨架屏组件
function DateSelectorSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

function OutputFormSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 w-full sm:w-1/3" />
        <Skeleton className="h-10 w-full sm:w-1/3" />
        <Skeleton className="h-10 w-full sm:w-1/3" />
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 w-full sm:w-1/2" />
        <Skeleton className="h-10 w-full sm:w-1/2" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

function OutputListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function OutputSummarySkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
} 