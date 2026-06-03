import { LAUNDRY_ITEMS } from '@/lib/laundry-items'
import type { DailySummary } from '../types'

interface SummaryCardsProps {
  summary: DailySummary
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-2xl font-bold text-gray-900">
          {summary.total_entries}
        </div>
        <div className="text-sm text-gray-600">Total Entries</div>
      </div>

      {LAUNDRY_ITEMS.map(item => (
        <div key={item.key} className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {summary.item_totals[item.key]}
          </div>
          <div className="text-sm text-gray-600">{item.shortLabel}</div>
        </div>
      ))}

      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-700">
          {summary.grand_total}
        </div>
        <div className="text-sm text-blue-600">Total Items</div>
      </div>
    </div>
  )
}