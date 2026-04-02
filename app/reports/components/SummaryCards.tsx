import { DailySummary } from '../types'

interface SummaryCardsProps {
  summary: DailySummary
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-2xl font-bold text-gray-900">{summary.total_entries}</div>
        <div className="text-sm text-gray-600">Total Entries</div>
      </div>
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-2xl font-bold text-gray-900">{summary.total_ironing}</div>
        <div className="text-sm text-gray-600">Ironing</div>
      </div>
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-2xl font-bold text-gray-900">{summary.total_saree_ironing}</div>
        <div className="text-sm text-gray-600">Saree Ironing</div>
      </div>
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-2xl font-bold text-gray-900">{summary.total_dry_cleaning}</div>
        <div className="text-sm text-gray-600">Dry Cleaning</div>
      </div>
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-700">{summary.grand_total}</div>
        <div className="text-sm text-blue-600">Total Items</div>
      </div>
    </div>
  )
}