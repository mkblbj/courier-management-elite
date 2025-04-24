"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { SingleEntryForm } from "@/components/single-entry-form"
import { BatchEntryForm } from "@/components/batch-entry-form"
import { RecentEntries } from "@/components/recent-entries"
import { useShippingData } from "@/hooks/use-shipping-data"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function ShippingDataEntry() {
  const [activeTab, setActiveTab] = useState<string>("single")
  const {
    entries,
    addEntry,
    addBatchEntries,
    updateEntry,
    deleteEntry,
    isLoading,
    error,
    totalRecords,
    currentPage,
    totalPages,
    pageSize,
    dateFilter,
    refetch,
    changePage,
    changePageSize,
    setFilter,
    clearFilters,
  } = useShippingData()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      <Alert
        className={cn(
          "bg-blue-50 border-blue-200 transition-all duration-300",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4",
        )}
      >
        <InfoIcon className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">使用提示</AlertTitle>
        <AlertDescription className="text-blue-700">
          您可以选择单条录入或批量录入模式来记录发货数据。单条录入适合零散记录，批量录入适合一次性录入多种快递类型的数据。
        </AlertDescription>
      </Alert>

      <Card
        className={cn(
          "border transition-all duration-500 delay-100",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="single" className="text-sm sm:text-base transition-all duration-200">
              单条录入
            </TabsTrigger>
            <TabsTrigger value="batch" className="text-sm sm:text-base transition-all duration-200">
              批量录入
            </TabsTrigger>
          </TabsList>
          <TabsContent value="single" className="animate-fade-in">
            <SingleEntryForm onSubmit={addEntry} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="batch" className="animate-fade-in">
            <BatchEntryForm onSubmit={addBatchEntries} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </Card>

      <div
        className={cn(
          "transition-all duration-500 delay-200",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <RecentEntries
          entries={entries}
          totalRecords={totalRecords}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          dateFilter={dateFilter}
          onUpdate={updateEntry}
          onDelete={deleteEntry}
          onRefresh={() => refetch()}
          onPageChange={changePage}
          onPageSizeChange={changePageSize}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
