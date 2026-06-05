// lib/printUtils.ts

type PrintOrientation = 'portrait' | 'landscape'

interface PrintOptions {
  title: string
  subtitle?: string
  dateRange?: string
  customerName?: string
  companyName?: string
  additionalInfo?: Array<{ label: string; value: string | number }>
  orientation?: PrintOrientation
  compact?: boolean
}

function formatGeneratedDateTime() {
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

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getPrintableContent(reportContent: Element) {
  const clonedContent = reportContent.cloneNode(true) as HTMLElement

  clonedContent
    .querySelectorAll(
      [
        'button',
        '.print-only',
        '.print\\:hidden',
        '.fixed',
        '[data-print-hidden="true"]',
      ].join(',')
    )
    .forEach(element => element.remove())

  const tables = Array.from(clonedContent.querySelectorAll('table'))

  if (tables.length > 0) {
    return tables.map(table => table.outerHTML).join('\n')
  }

  return clonedContent.innerHTML
}

export const printReport = (options: PrintOptions) => {
  const reportContent = document.querySelector('.report-content')

  if (!reportContent) {
    console.error('Report content not found')
    return
  }

  const printableContent = getPrintableContent(reportContent)
  const generatedAt = formatGeneratedDateTime()
  const orientation = options.orientation || 'landscape'
  const compactClass = options.compact ? 'compact' : ''
  const reportTitle = `${options.title} - Nandlal Laundry`

  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    alert('Please allow pop-ups to print reports')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(reportTitle)}</title>
        <meta charset="UTF-8" />
        <style>
          * {
            box-sizing: border-box;
          }

          @page {
            size: A4 ${orientation};
            margin: 10mm;
          }

          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
            line-height: 1.35;
          }

          body.compact {
            font-size: 7px;
          }

          .report-container {
            width: 100%;
          }

          .report-header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #111827;
          }

          .company-name {
            font-size: 18px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 2px;
          }

          .report-title {
            font-size: 12px;
            font-weight: 700;
            color: #111827;
            margin-top: 4px;
          }

          .report-subtitle {
            font-size: 8px;
            color: #4b5563;
            margin-top: 2px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
            gap: 4px;
            margin: 8px 0 10px;            
          }

          .info-card {
            border: 1px solid #d1d5db;
            background: #f9fafb;
            padding: 4px;
            text-align: center;
            break-inside: avoid;
          }

          .info-label {
            font-size: 6px;
            font-weight: 700;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 2px;
          }

          .info-value {
            font-size: 10px;
            font-weight: 700;
            color: #111827;            
          }

          body.compact .info-grid {
            grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
          }

          body.compact .info-label {
            font-size: 5px;
          }

          body.compact .info-value {
            font-size: 8px;
          }

          .report-content-print {
            width: 100%;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-top: 6px;
            page-break-inside: auto;
            text-align: center;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }

          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          th,
          td {
            border: 1px solid #9ca3af;
            padding: 3px 2px;
            vertical-align: middle;
            word-break: break-word;
            overflow-wrap: anywhere;
          }

          th {
            background: #f3f4f6;
            color: #111827;
            font-weight: 700;
            text-align: center;
          }

          td {
            color: #111827;
          }

          body.compact th,
          body.compact td {
            padding: 2px 1px;
          }

          .report-footer {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-size: 7px;
            color: #6b7280;
          }

          .report-footer p {
            margin: 2px 0;
          }

          @media print {
            html,
            body {
              width: 100%;
            }

            .report-container {
              page-break-after: auto;
            }
          }
        </style>
      </head>

      <body class="${compactClass}">
        <div class="report-container">
          <div class="report-header">
            <div class="company-name">
              ${escapeHtml(options.companyName || 'Nandlal Laundry')}
            </div>

            <div class="report-title">
              ${escapeHtml(options.title)}
            </div>

            ${
              options.subtitle
                ? `<div class="report-subtitle">${escapeHtml(options.subtitle)}</div>`
                : ''
            }

            ${
              options.dateRange
                ? `<div class="report-subtitle">Period: ${escapeHtml(options.dateRange)}</div>`
                : ''
            }

            ${
              options.customerName
                ? `<div class="report-subtitle">Customer: ${escapeHtml(options.customerName)}</div>`
                : ''
            }

            <div class="report-subtitle">
              Generated: ${escapeHtml(generatedAt)}
            </div>
          </div>

          ${
            options.additionalInfo && options.additionalInfo.length > 0
              ? `
                <div class="info-grid">
                  ${options.additionalInfo
                    .map(
                      info => `
                        <div class="info-card">
                          <div class="info-label">${escapeHtml(info.label)}</div>
                          <div class="info-value" style="text-align: center;">
                            ${escapeHtml(info.value)}
                          </div>
                        </div>
                      `
                    )
                    .join('')}
                </div>
              `
              : ''
          }

          <div class="report-content-print">
            ${printableContent}
          </div>

          <div class="report-footer">
            <p>Nandlal Laundry - Data Entry System</p>
            <p>Generated on: ${escapeHtml(generatedAt)}</p>
            <p>This is a system-generated report.</p>
          </div>
        </div>

        <script>
          window.onload = function () {
            window.focus()
            window.print()
          }
        </script>
      </body>
    </html>
  `)

  printWindow.document.close()
}