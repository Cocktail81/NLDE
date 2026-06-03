'use client'

import { useRef, useState } from 'react'
import { LAUNDRY_ITEMS } from '@/lib/laundry-items'
import { generatePDF } from '@/lib/pdfExport'
import type { Customer, DailySummary, Entry } from '../types'
import ActionButtons from './ActionButtons'
import EmptyState from './EmptyState'

interface DateRangeReportProps {
  startDate: string
  setStartDate: (date: string) => void
  endDate: string
  setEndDate: (date: string) => void
  rangeEntries: Entry[]
  rangeSummary: DailySummary | null
  loading: boolean
  customers: Customer[]
  selectedCustomer: string
  setSelectedCustomer: (customerId: string) => void
  onGenerate: () => void
  onExport: () => void
  onPrint: () => void
}

export default function DateRangeReport({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  rangeEntries,
  rangeSummary,
  loading,
  customers,
  selectedCustomer,
  setSelectedCustomer,
  onGenerate,
  onExport,
  onPrint,
}: DateRangeReportProps) {
  const [isFiltering, setIsFiltering] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const handleGenerate = () => {
    setIsFiltering(true)
    onGenerate()
    setTimeout(() => setIsFiltering(false), 500)
  }

  const handlePdfDownload = async () => {
    if (!rangeEntries.length || !reportRef.current) return

    setIsGeneratingPdf(true)

    try {
      const customerLabel =
        selectedCustomer === 'all'
          ? 'all_customers'
          : getCustomerDisplay().replace(/\s+/g, '_')

      const filename = `date_range_report_${customerLabel}_${startDate}_to_${endDate}.pdf`

      await generatePDF(reportRef.current.id || 'date-range-report-content', {
        filename,
        title: `Date Range Report - ${startDate} to ${endDate}`,
        orientation: 'portrait',
        margin: 10,
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
    setStartDate(last7.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
  }

  const setLast30Days = () => {
    const today = new Date()
    const last30 = new Date()

    last30.setDate(today.getDate() - 30)
    setStartDate(last30.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
  }

  const setLast90Days = () => {
    const today = new Date()
    const last90 = new Date()

    last90.setDate(today.getDate() - 90)
    setStartDate(last90.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
  }

  const setCurrentMonth = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
  }

  const getCurrentMonthName = () => {
    const today = new Date()

    return today.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    })
  }

  const getCustomerDisplay = () => {
    if (selectedCustomer === 'all') return 'All Customers'

    const customer = customers.find(customer => customer.id === selectedCustomer)

    return customer?.name || 'Select Customer'
  }

  const getSummary = () => {
    if (rangeSummary) {
      return rangeSummary
    }

    const itemTotals = LAUNDRY_ITEMS.reduce((acc, item) => {
      acc[item.key] = rangeEntries.reduce(
        (sum, entry) => sum + entry[item.key],
        0
      )

      return acc
    }, {} as DailySummary['item_totals'])

    return {
      date: `${startDate} to ${endDate}`,
      total_entries: rangeEntries.length,
      item_totals: itemTotals,
      grand_total: rangeEntries.reduce((sum, entry) => sum + entry.total, 0),
    }
  }

  const summary = getSummary()
  const uniqueCustomers = new Set(rangeEntries.map(entry => entry.customer_id))
    .size

  const columnWidths = [
    'w-[70px]',
    'w-[100px]',
    ...LAUNDRY_ITEMS.map(() => 'w-[55px]'),
    'w-[60px]',
  ]

  const renderEntriesTable = () => (
    <div className="overflow-x-auto">
      <table
        className="
          w-full
          text-sm
          text-center
          print:text-[6.5pt]
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
            <th className="py-2 px-0.5 text-center font-semibold text-xs print:text-[6pt]">
              Date
            </th>

            <th className="py-2 px-0.5 text-center font-semibold text-xs print:text-[6pt]">
              Customer
            </th>

            {LAUNDRY_ITEMS.map(item => (
              <th
                key={item.key}
                className="py-2 px-0.5 text-center font-semibold text-xs print:text-[6pt]"
              >
                {item.shortLabel}
              </th>
            ))}

            <th className="py-2 px-0.5 text-center font-semibold text-xs print:text-[6pt]">
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {rangeEntries.map(entry => (
            <tr
              key={entry.id}
              className="hover:bg-gray-50 print:hover:bg-transparent"
            >
              <td className="py-1.5 px-0.5 whitespace-nowrap text-center text-xs print:text-[5.5pt]">
                {new Date(entry.entry_date).toLocaleDateString()}
              </td>

              <td className="py-1.5 px-0.5 font-medium truncate text-center text-xs print:text-[5.5pt] max-w-[100px]">
                {entry.customer_name}
              </td>

              {LAUNDRY_ITEMS.map(item => (
                <td
                  key={item.key}
                  className="py-1.5 px-0.5 text-center tabular-nums text-xs print:text-[5.5pt]"
                >
                  {entry[item.key]}
                </td>
              ))}

              <td className="py-1.5 px-0.5 text-center font-semibold tabular-nums text-xs print:text-[5.5pt]">
                {entry.total}
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
            Filter by Entry Date Range
          </h3>
          <p className="text-sm text-gray-500">
            Select date range and customer to view entries
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={setLast7Days}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Last 7 Days
          </button>

          <button
            onClick={setLast30Days}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Last 30 Days
          </button>

          <button
            onClick={setLast90Days}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Last 90 Days
          </button>

          <button
            onClick={setCurrentMonth}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            {getCurrentMonthName()}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={event => setStartDate(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={event => setEndDate(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer
          </label>

          <select
            value={selectedCustomer}
            onChange={event => setSelectedCustomer(event.target.value)}
            className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">-- All Customers --</option>

            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>

          <p className="text-xs text-gray-500 mt-1">
            Showing entries for:{' '}
            <span className="font-medium text-gray-700">
              {getCustomerDisplay()}
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing entries from{' '}
            <span className="font-medium text-gray-700">
              {startDate ? new Date(startDate).toLocaleDateString() : '—'}
            </span>{' '}
            to{' '}
            <span className="font-medium text-gray-700">
              {endDate ? new Date(endDate).toLocaleDateString() : '—'}
            </span>

            {selectedCustomer !== 'all' && (
              <span>
                {' '}
                for{' '}
                <span className="font-medium text-gray-700">
                  {getCustomerDisplay()}
                </span>
              </span>
            )}
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
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
                  Generating...
                </span>
              ) : (
                'Generate Report'
              )}
            </button>

            {rangeEntries.length > 0 && (
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
      <div
        ref={reportRef}
        id="date-range-report-content"
        className="report-content"
      >
        {rangeEntries.length > 0 ? (
          <div className="bg-white border overflow-hidden print:border-none">
            {/* Print/PDF Header - Only visible when printing or generating PDF */}
            <div className="print-only text-center mb-4 pb-3 border-b-2 border-black">
              <h1 className="text-xl font-bold">Nandlal Laundry</h1>
              <p className="text-sm">Date Range Report</p>
              <p className="text-xs text-gray-600 mt-1">
                {selectedCustomer !== 'all'
                  ? `Customer: ${getCustomerDisplay()}`
                  : 'All Customers'}
              </p>
              <p className="text-xs text-gray-600">
                Period: {new Date(startDate).toLocaleDateString()} to{' '}
                {new Date(endDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-600">
                Generated: {new Date().toLocaleString()}
              </p>
            </div>

            {/* Screen Header */}
            <div className="p-4 border-b text-center print:hidden">
              <h2 className="text-4xl font-bold text-blue-800">
                Nandlal Laundry
              </h2>
              <p className="text-lg font-bold">Date Range Report</p>
              <p className="text-lg font-bold text-green-600">
                {getCustomerDisplay()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(startDate).toLocaleDateString()} to{' '}
                {new Date(endDate).toLocaleDateString()}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="p-4 print:p-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg print:border print:border-gray-300">
                  <div className="text-xl font-bold text-gray-900 print:text-sm">
                    {summary.total_entries}
                  </div>
                  <div className="text-xs text-gray-600">Entries</div>
                </div>

                {LAUNDRY_ITEMS.map(item => (
                  <div
                    key={item.key}
                    className="text-center p-2 bg-gray-50 rounded-lg print:border print:border-gray-300"
                  >
                    <div className="text-xl font-bold text-gray-900 print:text-sm">
                      {summary.item_totals[item.key]}
                    </div>
                    <div className="text-xs text-gray-600">
                      {item.shortLabel}
                    </div>
                  </div>
                ))}

                <div className="text-center p-2 bg-blue-50 rounded-lg print:border print:border-gray-300">
                  <div className="text-xl font-bold text-blue-700 print:text-sm">
                    {summary.grand_total}
                  </div>
                  <div className="text-xs text-blue-600">Total Items</div>
                </div>

                <div className="text-center p-2 bg-gray-50 rounded-lg print:border print:border-gray-300">
                  <div className="text-xl font-bold text-gray-900 print:text-sm">
                    {uniqueCustomers}
                  </div>
                  <div className="text-xs text-gray-600">Customers</div>
                </div>
              </div>
            </div>

            {/* Entries Table */}
            <div className="p-4 pt-0 print:p-2 print:pt-0">
              {renderEntriesTable()}
            </div>

            {/* Summary row */}
            <div className="p-3 bg-gray-50 border-t print:bg-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
                <span className="text-gray-600">
                  Total Entries: <strong>{summary.total_entries}</strong> |
                  Total Items: <strong>{summary.grand_total}</strong> | Unique
                  Customers: <strong>{uniqueCustomers}</strong>
                </span>

                <span className="text-gray-500 text-xs mt-2 sm:mt-0 print:hidden">
                  Generated: {new Date().toLocaleString()}
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
      {rangeEntries.length === 0 && startDate && endDate && !loading && (
        <EmptyState
          icon="📊"
          title="No entries found"
          message={`No entries found${selectedCustomer !== 'all' ? ` for ${getCustomerDisplay()}` : ''} between ${new Date(startDate).toLocaleDateString()} and ${new Date(endDate).toLocaleDateString()}`}
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