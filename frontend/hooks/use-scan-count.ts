"use client"

import { useCallback, useMemo, useState } from "react"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import { toast } from "@/components/ui/use-toast"
import { parseBarcode, type BarcodeParseError, type BarcodeRuleType } from "@/lib/barcode-parser"
import { resolveCourierBarcodeRuleType } from "@/lib/courier-barcode-rule"
import { beepDuplicate, beepError, beepSuccess, unlockAudioFeedback } from "@/lib/audio-feedback"
import { createScanBatchId } from "@/lib/scan-batch-id"
import { scanCountApi, ScanCountDuplicateError, type ScanCountRecord, type ScanCountStats } from "@/services/scan-count-api"

type ScanStatus = "idle" | "active"

type CourierForScan = {
  id: number | string
  name: string
  code?: string
  barcode_rule_type?: BarcodeRuleType
}

export function useScanCount() {
  const { t } = useTranslation("common")
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
      await unlockAudioFeedback()
      await refreshTodayData()
      setSelectedCourier(courier)
      setBatchId(createScanBatchId())
      setCurrentBatch([])
      setStatus("active")
    } catch (error) {
      const message = error instanceof Error ? error.message : t("scan_count_start_failed")
      setLastError(message)
      beepError()
      toast({ title: t("startup_failed"), description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [refreshTodayData, t])

  const stop = useCallback(() => {
    setStatus("idle")
  }, [])

  const getTranslatedBarcodeErrorMessage = useCallback((reason: BarcodeParseError) => {
    switch (reason) {
      case "looksLikeNonShipping":
        return t("looks_like_non_shipping_barcode")
      case "empty":
        return t("empty_barcode")
      case "tooShort":
        return t("barcode_too_short")
      default:
        return t("invalid_barcode")
    }
  }, [t])

  const submitScan = useCallback(async (rawInput: string) => {
    if (status !== "active" || !selectedCourier || !batchId) {
      beepError()
      toast({ title: t("select_courier_and_start"), variant: "destructive" })
      return
    }

    const parseResult = parseBarcode(rawInput, resolveCourierBarcodeRuleType(selectedCourier))

    if (parseResult.ok === false) {
      const message = getTranslatedBarcodeErrorMessage(parseResult.reason)
      setLastError(message)
      beepError()
      toast({ title: t("scan_error"), description: message, variant: "destructive" })
      return
    }

    if (todaySeenSet.has(parseResult.trackingNumber)) {
      const message = t("duplicate_tracking_number")
      setLastError(message)
      beepDuplicate()
      toast({ title: t("duplicate_scan"), description: message, variant: "destructive" })
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
      const message = error instanceof ScanCountDuplicateError
        ? t("duplicate_tracking_number")
        : error instanceof Error ? error.message : t("save_scan_failed")
      setLastError(message)

      if (error instanceof ScanCountDuplicateError) {
        beepDuplicate()
        await refreshTodayData()
      } else {
        beepError()
      }

      toast({ title: t("scan_failed"), description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [batchId, getTranslatedBarcodeErrorMessage, refreshTodayData, selectedCourier, status, t, today, todaySeenSet])

  const removeItem = useCallback(async (id: number) => {
    await scanCountApi.delete(id)
    setCurrentBatch((prev) => prev.filter((item) => item.id !== id))
    await refreshTodayData()
  }, [refreshTodayData])

  const deleteTodayRecord = useCallback(async (id: number) => {
    await scanCountApi.delete(id)
    setCurrentBatch((prev) => prev.filter((item) => item.id !== id))
    setTodayRecords((prev) => prev.filter((item) => item.id !== id))
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
    todayRecords,
    stats,
    todaySelectedCourierTotal,
    isLoading,
    lastError,
    setSelectedCourier,
    start,
    stop,
    submitScan,
    removeItem,
    deleteTodayRecord,
    undoLast,
    updateItem,
    deleteBatch,
    refreshTodayData,
  }
}
