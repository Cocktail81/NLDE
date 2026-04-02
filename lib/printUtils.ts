// lib/printUtils.ts

interface PrintOptions {
  title: string
  subtitle?: string
  dateRange?: string
  customerName?: string
  showCompanyLogo?: boolean
  companyName?: string
  additionalInfo?: Array<{ label: string; value: string | number }>
}

export const printReport = (options: PrintOptions) => {
  // Get the report content from the DOM
  const reportContent = document.querySelector('.report-content')
  if (!reportContent) {
    console.error('Report content not found')
    return
  }

  // Get the current date for the report
  const currentDate = new Date().toLocaleString()

  // Create a print-friendly version
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow pop-ups to print reports')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${options.title} - Nandlal Laundry</title>
      <meta charset="UTF-8">
      <style>
        /* Reset and Base Styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          background: white;
          color: #1f2937;
          line-height: 1.5;
          padding: 20px;
        }

        /* Print Optimization */
        @media print {
          body {
            padding: 0;
            margin: 0;
          }
          .no-break {
            page-break-inside: avoid;
          }
          .page-break {
            page-break-before: always;
          }
          @page {
            size: A4;
            margin: 2cm;
          }
        }

        /* Report Container */
        .report-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
        }

        /* Header Section */
        .report-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2563eb;
        }

        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }

        .company-tagline {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 10px;
        }

        .report-title {
          font-size: 20px;
          font-weight: bold;
          color: #111827;
          margin-top: 15px;
        }

        .report-subtitle {
          font-size: 14px;
          color: #4b5563;
          margin-top: 5px;
        }

        /* Info Cards */
        .info-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          margin: 25px 0;
        }

        .info-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px 25px;
          min-width: 120px;
          text-align: center;
        }

        .info-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: #6b7280;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }

        .info-value {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }

        /* Summary Cards */
        .summary-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 15px;
          margin: 25px 0;
        }

        .summary-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 15px 20px;
          min-width: 120px;
          text-align: center;
        }

        .summary-card.total {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .summary-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .summary-value {
          font-size: 28px;
          font-weight: bold;
          color: #111827;
        }

        .summary-value.total {
          color: #1e40af;
        }

        /* Tables */
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 12px;
        }

        .report-table th {
          background: #f3f4f6;
          color: #374151;
          font-weight: 600;
          padding: 10px 12px;
          text-align: left;
          border: 1px solid #e5e7eb;
        }

        .report-table td {
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          color: #4b5563;
        }

        /* Change History Specific Styling */
        .original-value {
          background: #fee2e2;
          color: #991b1b;
          text-decoration: line-through;
        }

        .corrected-value {
          background: #dcfce7;
          color: #166534;
          font-weight: 600;
        }

        .change-badge-positive {
          display: inline-block;
          background: #dcfce7;
          color: #166534;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          margin-left: 6px;
        }

        .change-badge-negative {
          display: inline-block;
          background: #fee2e2;
          color: #991b1b;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          margin-left: 6px;
        }

        /* Legend */
        .legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          margin: 20px 0;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
        }

        .legend-color.red {
          background: #fee2e2;
          border: 1px solid #fecaca;
        }

        .legend-color.green {
          background: #dcfce7;
          border: 1px solid #bbf7d0;
        }

        .legend-color.blue {
          background: #dbeafe;
          border: 1px solid #bfdbfe;
        }

        /* Footer */
        .report-footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 10px;
          color: #9ca3af;
        }

        .report-footer p {
          margin: 5px 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .summary-card {
            min-width: 100px;
            padding: 10px 15px;
          }
          .summary-value {
            font-size: 20px;
          }
          .report-table {
            font-size: 10px;
          }
          .report-table th,
          .report-table td {
            padding: 6px 8px;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <!-- Header -->
        <div class="report-header">
          <div class="company-name">${options.companyName || 'Nandlal Laundry'}</div>
          <div class="company-tagline">Quality Dry Cleaning & Laundry Services</div>
          <div class="report-title">${options.title}</div>
          ${options.subtitle ? `<div class="report-subtitle">${options.subtitle}</div>` : ''}
          ${options.dateRange ? `<div class="report-subtitle">Period: ${options.dateRange}</div>` : ''}
          ${options.customerName ? `<div class="report-subtitle">Customer: ${options.customerName}</div>` : ''}
        </div>

        <!-- Additional Info Cards -->
        ${options.additionalInfo && options.additionalInfo.length > 0 ? `
          <div class="info-grid">
            ${options.additionalInfo.map(info => `
              <div class="info-card">
                <div class="info-label">${info.label}</div>
                <div class="info-value">${info.value}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Report Content -->
        <div class="report-content-print">
          ${reportContent.innerHTML}
        </div>

        <!-- Footer -->
        <div class="report-footer">
          <p>Nandlal Laundry - Data Entry System</p>
          <p>Generated on: ${currentDate}</p>
          <p>This is a system-generated report. For queries, please contact administrator.</p>
        </div>
      </div>
      <script>
        // Auto-print when loaded
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `)

  printWindow.document.close()
}