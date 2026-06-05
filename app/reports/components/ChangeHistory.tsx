'use client'

import { useState } from 'react'
import { LAUNDRY_ITEMS } from '@/lib/laundry-items'
import { exportChangeHistoryPdf } from '@/lib/pdf/report-pdf'
import type { CorrectionEntry } from '../types'
import ActionButtons from './ActionButtons'
import EmptyState from './EmptyState'

interface ChangeHistoryProps {
  corrections: CorrectionEntry[]
  loading: boolean
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onLoad: () => void
  onExport: () => void
  onPrint: () => void
}

export default function ChangeHistory({
  corrections,
  loading,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onLoad,
  onExport,
  onPrint,
}: ChangeHistoryProps) {
  const [isFiltering, setIsFiltering] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)  

  const handleLoad = () => {
    setIsFiltering(true)
    onLoad()
    setTimeout(() => setIsFiltering(false), 500)
  }

  const handlePdfDownload = () => {
    if (!corrections.length) return
  
    setIsGeneratingPdf(true)
  
    try {
      exportChangeHistoryPdf({
        startDate,
        endDate,
        corrections,
      })
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const setLast7Days = () => {
    const today = new Date()
    const last7 = new Date()

    last7.setDate(today.getDate() - 7)
    onStartDateChange(last7.toISOString().split('T')[0])
    onEndDateChange(today.toISOString().split('T')[0])
  }

  const setLast30Days = () => {
    const today = new Date()
    const last30 = new Date()

    last30.setDate(today.getDate() - 30)
    onStartDateChange(last30.toISOString().split('T')[0])
    onEndDateChange(today.toISOString().split('T')[0])
  }

  const setLast90Days = () => {
    const today = new Date()
    const last90 = new Date()

    last90.setDate(today.getDate() - 90)
    onStartDateChange(last90.toISOString().split('T')[0])
    onEndDateChange(today.toISOString().split('T')[0])
  }

  const setMarch2026 = () => {
    onStartDateChange('2026-03-01')
    onEndDateChange('2026-03-31')
  }

  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString('en-GB')
  }
  
  const formatDateTime = () => {
    const now = new Date()
  
    const date = now.toLocaleDateString('en-GB')
    const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  
    return `${date}, ${time}`
  }

  const getOriginalKey = (
    key: (typeof LAUNDRY_ITEMS)[number]['key']
  ): keyof CorrectionEntry => {
    return `original_${key}` as keyof CorrectionEntry
  }

  const getOriginalValue = (
    correction: CorrectionEntry,
    key: (typeof LAUNDRY_ITEMS)[number]['key']
  ) => {
    return Number(correction[getOriginalKey(key)] || 0)
  }

  const getChangeValue = (
    correction: CorrectionEntry,
    key: (typeof LAUNDRY_ITEMS)[number]['key']
  ) => {
    return correction[key] - getOriginalValue(correction, key)
  }

  const getCustomerName = (correction: CorrectionEntry) => {
    return correction.customers?.name || 'Unknown'
  }

  const columnWidths = [
    'w-[45px]',
    'w-[100px]',
    ...LAUNDRY_ITEMS.map(() => 'w-[35px]'),
    ...LAUNDRY_ITEMS.map(() => 'w-[45px]'),
    'w-[110px]',
    'w-[55px]',
    'w-[55px]',
  ]

  const renderCorrectionsTable = () => (
    <div className="overflow-x-auto">
      <table
        className="
          w-full
          text-sm
          print:text-[6pt]
          border border-gray-300 print:border-black
          border-collapse
          [&_th]:border [&_td]:border
          [&_th]:border-gray-300 [&_td]:border-gray-300
          print:[&_th]:border-black print:[&_td]:border-black
        "
      >
        <colgroup>
          {columnWidths.map((width, index) => (
            <col key={index} className={width} />
          ))}
        </colgroup>

        <thead className="bg-gray-50 print:bg-gray-100">
          <tr>
            <th
              rowSpan={2}
              className="py-2 px-1 text-center font-semibold text-xs print:text-[5.5pt]"
            >
              Date
            </th>

            <th
              rowSpan={2}
              className="py-2 px-1 text-center font-semibold text-xs print:text-[5.5pt]"
            >
              Customer
            </th>

            <th
              colSpan={LAUNDRY_ITEMS.length}
              className="py-1 px-1 text-center text-xs font-bold text-red-600 border-r-2 border-gray-400 print:border-black"
            >
              Original
            </th>

            <th
              colSpan={LAUNDRY_ITEMS.length}
              className="py-1 px-1 text-center text-xs font-bold text-green-700"
            >
              Corrected
            </th>

            <th
              rowSpan={2}
              className="py-2 px-1 text-center font-semibold text-xs print:text-[5.5pt]"
            >
              Reason
            </th>

            <th
              rowSpan={2}
              className="py-2 px-1 text-center font-semibold text-xs print:text-[5.5pt]"
            >
              Corrected By
            </th>

            <th
              rowSpan={2}
              className="py-2 px-1 text-center font-semibold text-xs print:text-[5.5pt]"
            >
              Corrected On
            </th>
          </tr>

          <tr className="bg-gray-50 print:bg-gray-100">
            {LAUNDRY_ITEMS.map((item, index) => (
              <th
                key={`original-${item.key}`}
                className={`py-1 px-0.5 text-center font-semibold text-[10px] print:text-[5pt] ${
                  index === LAUNDRY_ITEMS.length - 1
                    ? 'border-r-2 border-gray-400 print:border-black'
                    : ''
                }`}
              >
                {item.shortLabel}
              </th>
            ))}

            {LAUNDRY_ITEMS.map(item => (
              <th
                key={`corrected-${item.key}`}
                className="py-1 px-0.5 text-center font-semibold text-[10px] print:text-[5pt]"
              >
                {item.shortLabel}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {corrections.map(correction => (
            <tr
              key={correction.id}
              className="hover:bg-gray-50 print:hover:bg-transparent"
            >
              <td className="py-1.5 px-1 whitespace-nowrap text-center text-xs print:text-[5.5pt]">
                {formatDate(correction.entry_date)}
              </td>

              <td className="py-1.5 px-1 font-medium truncate text-center text-xs print:text-[5.5pt] max-w-[100px]">
                {getCustomerName(correction)}
              </td>

              {LAUNDRY_ITEMS.map((item, index) => {
                const originalValue = getOriginalValue(correction, item.key)
                const changed = correction[item.key] !== originalValue

                return (
                  <td
                    key={`original-${correction.id}-${item.key}`}
                    className={`py-1.5 px-0.5 text-center tabular-nums text-xs print:text-[5.5pt] ${
                      changed ? 'line-through text-red-600' : ''
                    } ${
                      index === LAUNDRY_ITEMS.length - 1
                        ? 'border-r-2 border-gray-400 print:border-black'
                        : ''
                    }`}
                  >
                    {originalValue}
                  </td>
                )
              })}

              {LAUNDRY_ITEMS.map(item => {
                const changeValue = getChangeValue(correction, item.key)
                const changed = changeValue !== 0

                return (
                  <td
                    key={`corrected-${correction.id}-${item.key}`}
                    className={`py-1.5 px-0.5 text-center tabular-nums font-semibold text-xs print:text-[5.5pt] ${
                      changed ? 'text-green-700' : ''
                    }`}
                  >
                    {correction[item.key]}

                    {changed && (
                      <span className="ml-0.5 text-[8pt] print:text-[4.5pt] text-green-600">
                        ({changeValue > 0 ? '+' : ''}
                        {changeValue})
                      </span>
                    )}
                  </td>
                )
              })}

              <td className="py-1.5 px-1 break-words text-center text-xs print:text-[5.5pt] max-w-[130px]">
                {correction.correction_reason || 'N/A'}
              </td>

              <td className="py-1.5 px-1 text-center text-xs print:text-[5.5pt] truncate max-w-[100px]">
                {correction.corrected_by || 'Unknown'}
              </td>

              <td className="py-1.5 px-1 whitespace-nowrap text-center text-xs print:text-[5pt]">
                {correction.created_at ? formatDate(correction.created_at) : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Controls - Hide when printing */}
      <div className="bg-white rounded-xl border p-6 print:hidden">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Filter by Original Entry Date
          </h3>
          <p className="text-sm text-gray-500">
            Select date range to see corrections made to entries from that
            period
          </p>
        </div>

        {/* Quick Range Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={setLast7Days}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Last 7 Days
          </button>

          <button
            onClick={setLast30Days}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Last 30 Days
          </button>

          <button
            onClick={setLast90Days}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Last 90 Days
          </button>

          <button
            onClick={setMarch2026}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            March 2026
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Original Entry Date (From)
            </label>

            <input
              type="date"
              value={startDate}
              onChange={event => onStartDateChange(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Original Entry Date (To)
            </label>

            <input
              type="date"
              value={endDate}
              onChange={event => onEndDateChange(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing corrections for entries originally dated between{' '}
            <span className="font-medium text-gray-700">
            {startDate ? formatDate(startDate) : '—'}
            </span>{' '}
            and{' '}
            <span className="font-medium text-gray-700">
              {endDate ? formatDate(endDate) : '—'}
            </span>
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleLoad}
              disabled={loading || isFiltering}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading || isFiltering ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading...
                </span>
              ) : (
                'Show Corrections'
              )}
            </button>

            {corrections.length > 0 && (
              <button
                onClick={onExport}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📥 Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Content - Wrapped for PDF/Print */}
      <div id="change-history-content" className="report-content">
        {corrections.length > 0 ? (
          <div className="bg-white border overflow-hidden print:border-none">
            {/* Print/PDF Header - Only visible when printing or generating PDF */}
            <div className="print-only text-center mb-4 pb-3 border-b-2 border-black">
              <h1 className="text-xl font-bold">Nandlal Laundry</h1>
              <p className="text-sm">Change History Report</p>
              <p className="text-xs text-gray-600 mt-1">
                Period: {formatDate(startDate)} to {formatDate(endDate)}
              </p>
              <p className="text-xs text-gray-600">
              Generated: {formatDateTime()}
              </p>
            </div>

            {/* Screen Header */}
            <div className="p-4 border-b text-center print:hidden">
              <h2 className="text-4xl font-bold text-blue-800">
                Nandlal Laundry
              </h2>
              <p className="text-lg font-bold">Change History Report</p>
              <p className="text-sm text-gray-500">
                {formatDate(startDate)} to {formatDate(endDate)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Total Corrections: {corrections.length}
              </p>
            </div>

            {renderCorrectionsTable()}

            {/* Summary row */}
            <div className="p-3 bg-gray-50 border-t print:bg-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
                <span className="text-gray-600">
                  Total Corrections: <strong>{corrections.length}</strong>
                </span>

                <span className="text-gray-500 text-xs mt-2 sm:mt-0 print:hidden">
                Generated: {formatDateTime()}
                </span>
              </div>
            </div>

            <ActionButtons
              onPrint={onPrint}
              onExport={onExport}
              onPdf={handlePdfDownload}
            />
          </div>
        ) : null}
      </div>

      {/* Empty State */}
      {corrections.length === 0 && !loading && (
        <EmptyState
          icon="📝"
          title="No corrections found"
          message={`No corrections were found for entries originally dated between ${formatDate(startDate)} and ${formatDate(endDate)}`}
        />
      )}

      {/* PDF Generation Loading Overlay */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Generating PDF...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait</p>
          </div>
        </div>
      )}
    </div>
  )
}