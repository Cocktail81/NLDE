'use client'

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type {
  Content,
  TDocumentDefinitions,
  TableCell,
} from 'pdfmake/interfaces'
import {
  LAUNDRY_ITEMS,
  type LaundryItemQuantities,
} from '@/lib/laundry-items'
import type {
  CorrectionEntry,
  DailySummary,
  Entry,
} from '@/app/reports/types'

pdfMake.addVirtualFileSystem(pdfFonts)


interface ExportDateRangeReportPdfParams {
  startDate: string
  endDate: string
  customerLabel: string
  entries: Entry[]
  summary: DailySummary
  uniqueCustomers: number
}

interface ExportCustomerReportPdfParams {
  customerName: string
  startDate: string
  endDate: string
  entries: Entry[]
}

interface ExportDailyReportPdfParams {
  selectedDate: string
  entries: Entry[]
  summary: DailySummary
}

interface ExportChangeHistoryPdfParams {
  startDate: string
  endDate: string
  corrections: CorrectionEntry[]
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-GB')
  }

  function formatDateTime() {
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

  function toFileSafeName(value: string, fallback = 'report') {
    const safeValue = value.trim().replace(/\s+/g, '_')
  
    return safeValue || fallback
  }

function headerCell(text: string): TableCell {
  return {
    text,
    style: 'tableHeader',
    alignment: 'center',
  }
}

function textCell(text: string): TableCell {
    return {
      text,
      alignment: 'left',
    }
  }

  function centerCell(text: string): TableCell {
    return {
      text,
      alignment: 'center',
    }
  }

function numberCell(value: number): TableCell {
  return {
    text: String(value),
    alignment: 'center',
  }
}

function buildDailySummaryTable(summary: DailySummary): Content {
  const headerRow: TableCell[] = [
    headerCell('Total Entries'),
    ...LAUNDRY_ITEMS.map(item => headerCell(item.shortLabel)),
    headerCell('Total Items'),
  ]

  const valueRow: TableCell[] = [
    numberCell(summary.total_entries),
    ...LAUNDRY_ITEMS.map(item => numberCell(summary.item_totals[item.key])),
    numberCell(summary.grand_total),
  ]

  return {
    table: {
      headerRows: 1,
      widths: [
        55,
        ...LAUNDRY_ITEMS.map(() => '*'),
        50,
      ],
      body: [headerRow, valueRow],
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 12],
  }
}

function buildDailyEntriesTable(entries: Entry[]): Content {
    const headerRow: TableCell[] = [
      headerCell('Customer'),
      ...LAUNDRY_ITEMS.map(item => headerCell(item.shortLabel)),
      headerCell('Total'),
    ]
  
    const entryRows: TableCell[][] = entries.map(entry => {
      const row: TableCell[] = [
        textCell(entry.customer_name || 'Unknown'),
        ...LAUNDRY_ITEMS.map(item => numberCell(entry[item.key])),
        {
          text: String(entry.total),
          alignment: 'center',
          bold: true,
        },
      ]
  
      return row
    })
  
    return {
      table: {
        headerRows: 1,
        widths: [125, ...LAUNDRY_ITEMS.map(() => '*'), 38],
        body: [headerRow, ...entryRows],
      },
      layout: {
        fillColor: rowIndex => (rowIndex === 0 ? '#f3f4f6' : null),
        hLineColor: () => '#d1d5db',
        vLineColor: () => '#d1d5db',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
    }
  }

  function calculateEntryItemTotals(entries: Entry[]): LaundryItemQuantities {
    return LAUNDRY_ITEMS.reduce((acc, item) => {
      acc[item.key] = entries.reduce(
        (sum, entry) => sum + entry[item.key],
        0
      )
  
      return acc
    }, {} as LaundryItemQuantities)
  }
  
  function buildCustomerSummaryTable(entries: Entry[]): Content {
    const itemTotals = calculateEntryItemTotals(entries)
    const grandTotal = entries.reduce((sum, entry) => sum + entry.total, 0)
  
    const headerRow: TableCell[] = [
      headerCell('Total Entries'),
      ...LAUNDRY_ITEMS.map(item => headerCell(item.shortLabel)),
      headerCell('Total Items'),
    ]
  
    const valueRow: TableCell[] = [
      numberCell(entries.length),
      ...LAUNDRY_ITEMS.map(item => numberCell(itemTotals[item.key])),
      numberCell(grandTotal),
    ]
  
    return {
      table: {
        headerRows: 1,
        widths: [55, ...LAUNDRY_ITEMS.map(() => '*'), 50],
        body: [headerRow, valueRow],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 12],
    }
  }
  
  function buildCustomerEntriesTable(entries: Entry[]): Content {
    const headerRow: TableCell[] = [
      headerCell('Date'),
      ...LAUNDRY_ITEMS.map(item => headerCell(item.shortLabel)),
      headerCell('Total'),
    ]
  
    const entryRows: TableCell[][] = entries.map(entry => {
      const row: TableCell[] = [
        {
          text: formatDate(entry.entry_date),
          alignment: 'center',
        },
        ...LAUNDRY_ITEMS.map(item => numberCell(entry[item.key])),
        {
          text: String(entry.total),
          alignment: 'center',
          bold: true,
        },
      ]
  
      return row
    })
  
    return {
      table: {
        headerRows: 1,
        widths: [55, ...LAUNDRY_ITEMS.map(() => '*'), 38],
        body: [headerRow, ...entryRows],
      },
      layout: {
        fillColor: rowIndex => (rowIndex === 0 ? '#f3f4f6' : null),
        hLineColor: () => '#d1d5db',
        vLineColor: () => '#d1d5db',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
    }
  }

  function buildDateRangeSummaryTable(
    summary: DailySummary,
    uniqueCustomers: number
  ): Content {
    const headerRow: TableCell[] = [
      headerCell('Total Entries'),
      ...LAUNDRY_ITEMS.map(item => headerCell(item.shortLabel)),
      headerCell('Total Items'),
      headerCell('Customers'),
    ]
  
    const valueRow: TableCell[] = [
      numberCell(summary.total_entries),
      ...LAUNDRY_ITEMS.map(item => numberCell(summary.item_totals[item.key])),
      numberCell(summary.grand_total),
      numberCell(uniqueCustomers),
    ]
  
    return {
      table: {
        headerRows: 1,
        widths: [55, ...LAUNDRY_ITEMS.map(() => '*'), 50, 45],
        body: [headerRow, valueRow],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 12],
    }
  }
  
  function buildDateRangeEntriesTable(entries: Entry[]): Content {
    const headerRow: TableCell[] = [
      headerCell('Date'),
      headerCell('Customer'),
      ...LAUNDRY_ITEMS.map(item => headerCell(item.shortLabel)),
      headerCell('Total'),
    ]
  
    const entryRows: TableCell[][] = entries.map(entry => {
      const row: TableCell[] = [
        centerCell(formatDate(entry.entry_date)),
        textCell(entry.customer_name || 'Unknown'),
        ...LAUNDRY_ITEMS.map(item => numberCell(entry[item.key])),
        {
          text: String(entry.total),
          alignment: 'center',
          bold: true,
        },
      ]
  
      return row
    })
  
    return {
      table: {
        headerRows: 1,
        widths: [45, 105, ...LAUNDRY_ITEMS.map(() => '*'), 35],
        body: [headerRow, ...entryRows],
      },
      layout: {
        fillColor: rowIndex => (rowIndex === 0 ? '#f3f4f6' : null),
        hLineColor: () => '#d1d5db',
        vLineColor: () => '#d1d5db',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
    }
  }

  function getCorrectionCustomerName(correction: CorrectionEntry) {
    return correction.customers?.name || 'Unknown'
  }
  
  function getOriginalCorrectionValue(
    correction: CorrectionEntry,
    key: (typeof LAUNDRY_ITEMS)[number]['key']
  ) {
    const originalKey = `original_${key}` as keyof CorrectionEntry
  
    return Number(correction[originalKey] || 0)
  }
  
  function buildChangeHistoryTable(corrections: CorrectionEntry[]): Content {
    const headerRow: TableCell[] = [
      headerCell('Date'),
      headerCell('Customer'),
      headerCell('Item'),
      headerCell('Original'),
      headerCell('Corrected'),
      headerCell('Change'),
      headerCell('Reason'),
      headerCell('Corrected By'),
      headerCell('Corrected On'),
    ]
  
    const rows: TableCell[][] = corrections.flatMap(correction => {
      const changedItems = LAUNDRY_ITEMS.map(item => {
        const originalValue = getOriginalCorrectionValue(correction, item.key)
        const correctedValue = correction[item.key]
        const changeValue = correctedValue - originalValue
  
        return {
          item,
          originalValue,
          correctedValue,
          changeValue,
        }
      }).filter(item => item.changeValue !== 0)
  
      const rowsToRender =
        changedItems.length > 0
          ? changedItems
          : LAUNDRY_ITEMS.map(item => {
              const originalValue = getOriginalCorrectionValue(
                correction,
                item.key
              )
              const correctedValue = correction[item.key]
  
              return {
                item,
                originalValue,
                correctedValue,
                changeValue: correctedValue - originalValue,
              }
            })
  
      return rowsToRender.map(({ item, originalValue, correctedValue, changeValue }) => {
        const row: TableCell[] = [
          {
            text: formatDate(correction.entry_date),
            alignment: 'center',
          },
          textCell(getCorrectionCustomerName(correction)),
          textCell(item.shortLabel),
          numberCell(originalValue),
          numberCell(correctedValue),
          {
            text: `${changeValue > 0 ? '+' : ''}${changeValue}`,
            alignment: 'center',
            bold: changeValue !== 0,
            color: changeValue !== 0 ? '#15803d' : '#111827',
          },
          textCell(correction.correction_reason || 'N/A'),
          textCell(correction.corrected_by || 'Unknown'),
          {
            text: correction.created_at ? formatDate(correction.created_at) : 'N/A',
            alignment: 'center',
          },
        ]
  
        return row
      })
    })
  
    return {
      table: {
        headerRows: 1,
        widths: [42, 90, 60, 42, 42, 38, '*', 70, 52],
        body: [headerRow, ...rows],
      },
      layout: {
        fillColor: rowIndex => (rowIndex === 0 ? '#f3f4f6' : null),
        hLineColor: () => '#d1d5db',
        vLineColor: () => '#d1d5db',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
    }
  }

export function exportDailyReportPdf({
  selectedDate,
  entries,
  summary,
}: ExportDailyReportPdfParams) {
  const filename = `daily_report_${selectedDate}.pdf`

  const documentDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [24, 32, 24, 32],

    footer: (currentPage, pageCount) => ({
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: 'right',
      fontSize: 8,
      color: '#6b7280',
      margin: [0, 0, 24, 0],
    }),

    content: [
      {
        text: 'Nandlal Laundry',
        style: 'companyTitle',
        alignment: 'center',
      },
      {
        text: 'Daily Summary Report',
        style: 'reportTitle',
        alignment: 'center',
      },
      {
        text: `Date: ${formatDate(selectedDate)} | Generated: ${formatDateTime()}`,
        style: 'reportMeta',
        alignment: 'center',
        margin: [0, 0, 0, 14],
      },
      buildDailySummaryTable(summary),
      {
        text: 'Entries',
        style: 'sectionTitle',
        margin: [0, 0, 0, 6],
      },
      buildDailyEntriesTable(entries),
    ],

    styles: {
      companyTitle: {
        fontSize: 18,
        bold: true,
        color: '#1e40af',
      },
      reportTitle: {
        fontSize: 12,
        bold: true,
        color: '#374151',
        margin: [0, 2, 0, 2],
      },
      reportMeta: {
        fontSize: 8,
        color: '#6b7280',
      },
      sectionTitle: {
        fontSize: 10,
        bold: true,
        color: '#111827',
      },
      tableHeader: {
        fontSize: 7,
        bold: true,
        color: '#111827',
      },
    },

    defaultStyle: {
      fontSize: 7,
      color: '#111827',
    },
  }
  pdfMake.createPdf(documentDefinition).download(filename)
}

  export function exportCustomerReportPdf({
    customerName,
    startDate,
    endDate,
    entries,
  }: ExportCustomerReportPdfParams) {
    const safeCustomerName = toFileSafeName(customerName, 'customer')
    const filename = `${safeCustomerName}_report_${startDate}_to_${endDate}.pdf`
  
    const documentDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [24, 32, 24, 32],
  
      footer: (currentPage, pageCount) => ({
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: 'right',
        fontSize: 8,
        color: '#6b7280',
        margin: [0, 0, 24, 0],
      }),
  
      content: [
        {
          text: 'Nandlal Laundry',
          style: 'companyTitle',
          alignment: 'center',
        },
        {
          text: 'Customer Report',
          style: 'reportTitle',
          alignment: 'center',
        },
        {
          text: customerName,
          style: 'customerTitle',
          alignment: 'center',
        },
        {
          text: `Period: ${formatDate(startDate)} to ${formatDate(endDate)} | Generated: ${formatDateTime()}`,
          style: 'reportMeta',
          alignment: 'center',
          margin: [0, 0, 0, 14],
        },
        buildCustomerSummaryTable(entries),
        {
          text: 'Entries',
          style: 'sectionTitle',
          margin: [0, 0, 0, 6],
        },
        buildCustomerEntriesTable(entries),
      ],
  
      styles: {
        companyTitle: {
          fontSize: 18,
          bold: true,
          color: '#1e40af',
        },
        reportTitle: {
          fontSize: 12,
          bold: true,
          color: '#374151',
          margin: [0, 2, 0, 2],
        },
        customerTitle: {
          fontSize: 12,
          bold: true,
          color: '#15803d',
          margin: [0, 0, 0, 2],
        },
        reportMeta: {
          fontSize: 8,
          color: '#6b7280',
        },
        sectionTitle: {
          fontSize: 10,
          bold: true,
          color: '#111827',
        },
        tableHeader: {
          fontSize: 7,
          bold: true,
          color: '#111827',
        },
      },
  
      defaultStyle: {
        fontSize: 7,
        color: '#111827',
      },
    }
  
    pdfMake.createPdf(documentDefinition).download(filename)
  }


    export function exportDateRangeReportPdf({
      startDate,
      endDate,
      customerLabel,
      entries,
      summary,
      uniqueCustomers,
    }: ExportDateRangeReportPdfParams) {
      const safeCustomerLabel =
        customerLabel === 'All Customers'
          ? 'all_customers'
          : toFileSafeName(customerLabel, 'customer')
    
      const filename = `date_range_report_${safeCustomerLabel}_${startDate}_to_${endDate}.pdf`
    
      const documentDefinition: TDocumentDefinitions = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [24, 32, 24, 32],
    
        footer: (currentPage, pageCount) => ({
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'right',
          fontSize: 8,
          color: '#6b7280',
          margin: [0, 0, 24, 0],
        }),
    
        content: [
          {
            text: 'Nandlal Laundry',
            style: 'companyTitle',
            alignment: 'center',
          },
          {
            text: 'Date Range Report',
            style: 'reportTitle',
            alignment: 'center',
          },
          {
            text: customerLabel,
            style: 'customerTitle',
            alignment: 'center',
          },
          {
            text: `Period: ${formatDate(startDate)} to ${formatDate(endDate)} | Generated: ${formatDateTime()}`,
            style: 'reportMeta',
            alignment: 'center',
            margin: [0, 0, 0, 14],
          },
          buildDateRangeSummaryTable(summary, uniqueCustomers),
          {
            text: 'Entries',
            style: 'sectionTitle',
            margin: [0, 0, 0, 6],
          },
          buildDateRangeEntriesTable(entries),
        ],
    
        styles: {
          companyTitle: {
            fontSize: 18,
            bold: true,
            color: '#1e40af',
          },
          reportTitle: {
            fontSize: 12,
            bold: true,
            color: '#374151',
            margin: [0, 2, 0, 2],
          },
          customerTitle: {
            fontSize: 12,
            bold: true,
            color: '#15803d',
            margin: [0, 0, 0, 2],
          },
          reportMeta: {
            fontSize: 8,
            color: '#6b7280',
          },
          sectionTitle: {
            fontSize: 10,
            bold: true,
            color: '#111827',
          },
          tableHeader: {
            fontSize: 7,
            bold: true,
            color: '#111827',
          },
        },
    
        defaultStyle: {
          fontSize: 7,
          color: '#111827',
        },
      }
    
      pdfMake.createPdf(documentDefinition).download(filename)
    }

    export function exportChangeHistoryPdf({
      startDate,
      endDate,
      corrections,
    }: ExportChangeHistoryPdfParams) {
      const filename = `change_history_${startDate}_to_${endDate}.pdf`
    
      const documentDefinition: TDocumentDefinitions = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [24, 32, 24, 32],
    
        footer: (currentPage, pageCount) => ({
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'right',
          fontSize: 8,
          color: '#6b7280',
          margin: [0, 0, 24, 0],
        }),
    
        content: [
          {
            text: 'Nandlal Laundry',
            style: 'companyTitle',
            alignment: 'center',
          },
          {
            text: 'Change History Report',
            style: 'reportTitle',
            alignment: 'center',
          },
          {
            text: `Period: ${formatDate(startDate)} to ${formatDate(endDate)} | Generated: ${formatDateTime()}`,
            style: 'reportMeta',
            alignment: 'center',
            margin: [0, 0, 0, 8],
          },
          {
            text: `Total Corrections: ${corrections.length}`,
            style: 'sectionTitle',
            alignment: 'center',
            margin: [0, 0, 0, 12],
          },
          buildChangeHistoryTable(corrections),
        ],
    
        styles: {
          companyTitle: {
            fontSize: 18,
            bold: true,
            color: '#1e40af',
          },
          reportTitle: {
            fontSize: 12,
            bold: true,
            color: '#374151',
            margin: [0, 2, 0, 2],
          },
          reportMeta: {
            fontSize: 8,
            color: '#6b7280',
          },
          sectionTitle: {
            fontSize: 10,
            bold: true,
            color: '#111827',
          },
          tableHeader: {
            fontSize: 7,
            bold: true,
            color: '#111827',
          },
        },
    
        defaultStyle: {
          fontSize: 7,
          color: '#111827',
        },
      }
    
      pdfMake.createPdf(documentDefinition).download(filename)
    }