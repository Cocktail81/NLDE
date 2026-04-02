'use client'

import { useState, useRef } from 'react'
import { Entry, DailySummary } from '../types'
import SummaryCards from './SummaryCards'
import ActionButtons from './ActionButtons'
import EmptyState from './EmptyState'
import { generatePDF } from '@/lib/pdfExport'

interface DailyReportProps {
  selectedDate: string
  setSelectedDate: (date: string) => void
  dailyEntries: Entry[]
  dailySummary: DailySummary | null
  loading: boolean
  onGenerate: () => void
  onExport: () => void
  onPrint: () => void
}

export default function DailyReport({
  selectedDate,
  setSelectedDate,
  dailyEntries,
  dailySummary,
  loading,
  onGenerate,
  onExport,
  onPrint
}: DailyReportProps) {
  const [isFiltering, setIsFiltering] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const handleGenerate = () => {
    setIsFiltering(true)
    onGenerate()
    setTimeout(() => setIsFiltering(false), 500)
  }

  const handlePdfDownload = async () => {
    if (!dailyEntries.length || !reportRef.current) return
    
    setIsGeneratingPdf(true)
    try {
      const filename = `daily_report_${selectedDate}.pdf`
      await generatePDF(reportRef.current.id || 'daily-report-content', {
        filename,
        title: `Daily Report - ${selectedDate}`,
        orientation: 'portrait',
        margin: 10,
        quality: 1.0  // Lower = smaller file (0.5-0.7 is good balance)
      })
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Table column widths matching ChangeHistory style
  const columnWidths = [
    "w-[100px]",  // Customer
    "w-[25px]",   // Ironing
    "w-[25px]",   // Saree
    "w-[25px]",   // Dry Clean
    "w-[60px]",   // Total
  ]

  const renderEntriesTable = () => (
    <div className="overflow-x-auto">
      <table
        className="
          w-full
          text-sm
          text-center
          print:text-[8pt]
          border border-gray-300 print:border-black
          border-collapse
          [&_th]:border [&_td]:border
          [&_th]:border-gray-300 [&_td]:border-gray-300
          print:[&_th]:border-black print:[&_td]:border-black
        "
      >
        <colgroup>
          {columnWidths.map((width, i) => (
            <col key={i} className={width} />
          ))}
        </colgroup>

        <thead className="bg-gray-50 print:bg-gray-100">
          <tr>
            <th className="py-2 px-2 text-center font-semibold">Customer</th>
            <th className="py-2 px-2 text-center font-semibold">Ironing</th>
            <th className="py-2 px-2 text-center font-semibold">Saree</th>
            <th className="py-2 px-2 text-center font-semibold">Dry Clean</th>
            <th className="py-2 px-2 text-center font-semibold">Total</th>
          </tr>
        </thead>

        <tbody>
          {dailyEntries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50 print:hover:bg-transparent">
              <td className="py-1.5 px-2 font-medium truncate max-w-[140px] text-sm print:text-[7.5pt]">
                {entry.customer_name}
              </td>
              <td className="py-1.5 px-2 text-center tabular-nums text-sm print:text-[7.5pt]">
                {entry.ironing}
              </td>
              <td className="py-1.5 px-2 text-center tabular-nums text-sm print:text-[7.5pt]">
                {entry.saree_ironing}
              </td>
              <td className="py-1.5 px-2 text-center tabular-nums text-sm print:text-[7.5pt]">
                {entry.dry_cleaning}
              </td>
              <td className="py-1.5 px-2 text-center font-semibold tabular-nums text-sm print:text-[7.5pt]">
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
      {/* Controls */}
      <div className="bg-white rounded-xl border p-6 print:hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading || isFiltering}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading || isFiltering ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Report'
              )}
            </button>
            {dailyEntries.length > 0 && (
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
        id="daily-report-content"
        className="report-content"
      >
        {dailyEntries.length > 0 && dailySummary ? (
          <div className="bg-white border overflow-hidden print:border-none">
            {/* Print/PDF Header - Only visible when printing or generating PDF */}
            <div className="print-only text-center mb-4 pb-3 border-b-2 border-black">
              <h1 className="text-xl font-bold">Nandlal Laundry</h1>
              <p className="text-sm">Daily Summary Report</p>
              <p className="text-xs text-gray-600 mt-1">
                Date: {new Date(selectedDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-600">Generated: {new Date().toLocaleString()}</p>
            </div>

            {/* Screen Header */}
            <div className="p-4 border-b text-center print:hidden">
              <h2 className="text-4xl font-bold text-blue-800">Nandlal Laundry</h2>
              <p className="text-lg font-bold text-gray-600">Daily Summary Report</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(selectedDate).toLocaleDateString()}</p>
            </div>

            {/* Summary Cards - Screen only (print version handled by print CSS) */}
            <div className="p-4 print:p-2">
              <SummaryCards summary={dailySummary} />
            </div>

            {/* Entries Table */}
            <div className="p-4 pt-0 print:p-2 print:pt-0">
              {renderEntriesTable()}
            </div>

            {/* Summary row */}
            <div className="p-3 bg-gray-50 border-t print:bg-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
                <span className="text-gray-600">
                  Total Entries: <strong>{dailySummary.total_entries}</strong> | 
                  Total Items: <strong>{dailySummary.grand_total}</strong>
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
      {dailyEntries.length === 0 && !loading && (
        <EmptyState
          icon="📅"
          title={`No entries found for ${selectedDate}`}
          message="Try a different date or add some entries"
        />
      )}

      {/* PDF Generation Loading Overlay */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Generating PDF...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait</p>
          </div>
        </div>
      )}
    </div>
  )
}