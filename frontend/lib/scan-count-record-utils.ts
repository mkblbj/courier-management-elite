import type { ScanCountRecord } from "@/services/scan-count-api"

export type ScanRecordFilters = {
  courierId?: string
  search?: string
}

export type CourierScanSummary = {
  courier_id: number
  courier_name: string
  total: number
}

export function filterScanRecords(records: ScanCountRecord[], filters: ScanRecordFilters): ScanCountRecord[] {
  const courierId = filters.courierId && filters.courierId !== "all" ? filters.courierId : null
  const search = filters.search?.trim().toLowerCase() || ""

  return records.filter((record) => {
    if (courierId && record.courier_id.toString() !== courierId) return false

    if (!search) return true

    return [record.tracking_number, record.raw_input, record.courier_name, record.batch_id]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search))
  })
}

export function summarizeScanRecordsByCourier(records: ScanCountRecord[]): CourierScanSummary[] {
  const summaryByCourier = new Map<string, CourierScanSummary>()

  records.forEach((record) => {
    const key = record.courier_id.toString()
    const existing = summaryByCourier.get(key)

    if (existing) {
      existing.total += 1
      return
    }

    summaryByCourier.set(key, {
      courier_id: record.courier_id,
      courier_name: record.courier_name || record.courier_id.toString(),
      total: 1,
    })
  })

  return Array.from(summaryByCourier.values()).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    return a.courier_name.localeCompare(b.courier_name)
  })
}
