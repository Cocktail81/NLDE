import {
  LAUNDRY_ITEMS,
  calculateLaundryTotal,
  type LaundryItemKey,
  type LaundryItemQuantities,
} from '@/lib/laundry-items'
import type { DailySummary, Entry, OriginalLaundryItemQuantities } from '../types'
import type { RawEntry, RelationOneOrMany } from '../types/raw'

export function getRelationValue<T, K extends keyof T>(
  relation: RelationOneOrMany<T>,
  key: K,
  fallback: string
): string {
  if (Array.isArray(relation)) {
    const value = relation[0]?.[key]

    return typeof value === 'string' && value.trim() ? value : fallback
  }

  const value = relation?.[key]

  return typeof value === 'string' && value.trim() ? value : fallback
}

export function getCustomerName(
  customer: RelationOneOrMany<{ name: string }>
): string {
  return getRelationValue(customer, 'name', 'Unknown')
}

export function getProfileFullName(
  profile: RelationOneOrMany<{ full_name: string }>
): string {
  return getRelationValue(profile, 'full_name', 'Unknown User')
}

export function getLaundryItemQuantities(
  entry: Partial<LaundryItemQuantities>
): LaundryItemQuantities {
  return LAUNDRY_ITEMS.reduce((acc, item) => {
    acc[item.key] = entry[item.key] || 0
    return acc
  }, {} as LaundryItemQuantities)
}

export function getOriginalLaundryItemQuantities(
  entry: Partial<LaundryItemQuantities>
): OriginalLaundryItemQuantities {
  return LAUNDRY_ITEMS.reduce((acc, item) => {
    const originalKey = `original_${item.key}` as `original_${LaundryItemKey}`
    acc[originalKey] = entry[item.key] || 0
    return acc
  }, {} as OriginalLaundryItemQuantities)
}

export function formatEntry(entry: RawEntry, customerName?: string): Entry {
  const itemQuantities = getLaundryItemQuantities(entry)

  return {
    id: entry.id,
    entry_date: entry.entry_date,
    customer_id: entry.customer_id,
    customer_name: customerName || getCustomerName(entry.customers),
    ...itemQuantities,
    total: calculateLaundryTotal(itemQuantities),
    is_correction: entry.is_correction || false,
    correction_reason: entry.correction_reason,
  }
}

export function calculateSummary(
  entries: Entry[],
  dateLabel: string
): DailySummary {
  const itemTotals = LAUNDRY_ITEMS.reduce((acc, item) => {
    acc[item.key] = entries.reduce(
      (sum, entry) => sum + entry[item.key],
      0
    )

    return acc
  }, {} as LaundryItemQuantities)

  return {
    date: dateLabel,
    total_entries: entries.length,
    item_totals: itemTotals,
    grand_total: entries.reduce((sum, entry) => sum + entry.total, 0),
  }
}

export function sortByEntryDateAsc<T extends { entry_date: string }>(
  entries: T[]
): T[] {
  return [...entries].sort(
    (a, b) =>
      new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  )
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers: string[]
) {
  const csvRows = [headers.join(',')]

  for (const row of data) {
    const values = headers.map(header => {
      const key =
        Object.keys(row).find(
          currentKey => currentKey.toLowerCase() === header.toLowerCase()
        ) || header

      const value = row[key] !== undefined ? row[key] : ''
      const escaped = String(value).replace(/"/g, '""')

      if (
        escaped.includes(',') ||
        escaped.includes('\n') ||
        escaped.includes('"')
      ) {
        return `"${escaped}"`
      }

      return escaped
    })

    csvRows.push(values.join(','))
  }

  const blob = new Blob([csvRows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export function getDefaultReportDates() {
  const today = new Date()
  const todayText = today.toISOString().split('T')[0]

  const lastMonth = new Date(today)
  lastMonth.setDate(lastMonth.getDate() - 30)

  const lastMonthText = lastMonth.toISOString().split('T')[0]

  return {
    today: todayText,
    lastMonth: lastMonthText,
  }
}

export function toFileSafeName(value: string, fallback = 'report') {
  const safeValue = value.trim().replace(/\s+/g, '_')

  return safeValue || fallback
}