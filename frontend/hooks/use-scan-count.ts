"use client"

import { useCallback, useMemo, useState } from "react"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { parseBarcode, getBarcodeErrorMessage, type BarcodeRuleType } from "@/lib/barcode-parser"
import { beepDuplicate, beepError, beepSuccess } from "@/lib/audio-feedback"
import { scanCountApi, ScanCountDuplicateError, type ScanCountRecord, type ScanCountStats } from "@/services/scan-count-api"

type ScanStatus = "idle" | "active"

type CourierForScan = {
  id: number | string
  name: string
  barcode_rule_type?: BarcodeRuleType
}

export function useScanCount() {
  const today = format(new Date(), "yyyy-MM-dd")
  const [status, setStatus] = useState<ScanStatus>("idle")
  const [selectedCourier, setSelectedCourier] = useState<CourierForScan | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [currentBatch, setCurrentBatch] = useState<ScanCountRecord[]>([])
  const [todayRecords, setTodayRecords] = useState<ScanCountRecord[]>([])
  const [stats, setStats] = useState<ScanCountStats>({ total: 0, by_courier: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const todaySeenSet = useMemo(() => {
    return new Set(todayRecords.map((record) => record.tracking_number))
  }, [todayRecords])

  const todaySelectedCourierTotal = useMemo(() => {
    if (!selectedCourier) return 0
    const row = stats.by_courier.find((item) => item.courier_id.toString() === selectedCourier.id.toString())
    return row?.total || 0
  }, [selectedCourier, stats.by_courier])

  const refreshTodayData = useCallback(async () => {
    const [listResponse, statsResponse] = await Promise.all([
      scanCountApi.list({ date: today }),
      scanCountApi.getStats({ date: today }),
    ])

    setTodayRecords(listResponse.records)
    setStats(statsResponse)
  }, [today])

  const start = useCallback(async (courier: CourierForScan) => {
    setIsLoading(true)
    setLastError(null)

    try {
      await refreshTodayData()
      setSelectedCourier(courier)
      setBatchId(crypto.randomUUID())
      setCurrentBatch([])
      setStatus("active")
    } catch (error) {
      const message = error instanceof Error ? error.message : "启动出荷计数失败"
      setLastError(message)
      beepError()
      toast({ title: "启动失败", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [refreshTodayData])

  const stop = useCallback(() => {
    setStatus("idle")
  }, [])

  const submitScan = useCallback(async (rawInput: string) => {
    if (status !== "active" || !selectedCourier || !batchId) {
      beepError()
      toast({ title: "请先选择快递类型并开始计数", variant: "destructive" })
      return
    }

    const parseResult = parseBarcode(rawInput, selectedCourier.barcode_rule_type || "generic")

    if (!parseResult.ok) {
      const message = getBarcodeErrorMessage(parseResult.reason)
      setLastError(message)
      beepError()
      toast({ title: "扫码错误", description: message, variant: "destructive" })
      return
    }

    if (todaySeenSet.has(parseResult.trackingNumber)) {
      const message = "该运单号今天已扫描"
      setLastError(message)
      beepDuplicate()
      toast({ title: "重复扫描", description: message, variant: "destructive" })
      return
    }

    setIsLoading(true)
    setLastError(null)

    try {
      const saved = await scanCountApi.create({
        tracking_number: parseResult.trackingNumber,
        raw_input: parseResult.rawInput,
        courier_id: selectedCourier.id,
        scan_date: today,
        batch_id: batchId,
      })

      setCurrentBatch((prev) => [saved, ...prev])
      setTodayRecords((prev) => [saved, ...prev])
      setStats((prev) => {
        const byCourier = [...prev.by_courier]
        const existingIndex = byCourier.findIndex((item) => item.courier_id.toString() === saved.courier_id.toString())

        if (existingIndex >= 0) {
          byCourier[existingIndex] = {
            ...byCourier[existingIndex],
            total: byCourier[existingIndex].total + 1,
          }
        } else {
          byCourier.push({
            courier_id: saved.courier_id,
            courier_name: saved.courier_name || selectedCourier.name,
            total: 1,
          })
        }

        return { total: prev.total + 1, by_courier: byCourier }
      })

      beepSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : "保存扫码记录失败"
      setLastError(message)

      if (error instanceof ScanCountDuplicateError) {
        beepDuplicate()
        await refreshTodayData()
      } else {
        beepError()
      }

      toast({ title: "扫码失败", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [batchId, refreshTodayData, selectedCourier, status, today, todaySeenSet])

  const removeItem = useCallback(async (id: number) => {
    await scanCountApi.delete(id)
    setCurrentBatch((prev) => prev.filter((item) => item.id !== id))
    await refreshTodayData()
  }, [refreshTodayData])

  const undoLast = useCallback(async () => {
    const last = currentBatch[0]
    if (!last) return
    await removeItem(last.id)
  }, [currentBatch, removeItem])

  const updateItem = useCallback(async (id: number, data: Partial<ScanCountRecord>) => {
    const updated = await scanCountApi.update(id, data)
    setCurrentBatch((prev) => prev.map((item) => (item.id === id ? updated : item)))
    await refreshTodayData()
  }, [refreshTodayData])

  const deleteBatch = useCallback(async () => {
    if (!batchId) return 0
    const result = await scanCountApi.deleteBatch(batchId)
    setCurrentBatch([])
    await refreshTodayData()
    return result.deleted
  }, [batchId, refreshTodayData])

  return {
    today,
    status,
    selectedCourier,
    batchId,
    currentBatch,
    stats,
    todaySelectedCourierTotal,
    isLoading,
    lastError,
    setSelectedCourier,
    start,
    stop,
    submitScan,
    removeItem,
    undoLast,
    updateItem,
    deleteBatch,
    refreshTodayData,
  }
}
