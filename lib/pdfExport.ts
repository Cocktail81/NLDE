// lib/pdfExport.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface PdfOptions {
  filename?: string
  title?: string
  orientation?: 'portrait' | 'landscape'
  margin?: number
  quality?: number
  pageTopMargin?: number  // Top margin for pages after first
}

export async function generatePDF(
  elementId: string, 
  options: PdfOptions = {}
): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with id "${elementId}" not found`)
    return
  }

  const {
    filename = 'report.pdf',
    orientation = 'portrait',
    margin = 10,
    quality = 0.7,
    pageTopMargin = 15  // Default 15mm top margin on subsequent pages
  } = options

  try {
    // Show loading indicator
    const loadingOverlay = document.createElement('div')
    loadingOverlay.style.position = 'fixed'
    loadingOverlay.style.top = '0'
    loadingOverlay.style.left = '0'
    loadingOverlay.style.width = '100%'
    loadingOverlay.style.height = '100%'
    loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)'
    loadingOverlay.style.display = 'flex'
    loadingOverlay.style.alignItems = 'center'
    loadingOverlay.style.justifyContent = 'center'
    loadingOverlay.style.zIndex = '9999'
    loadingOverlay.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
        <div style="width: 48px; height: 48px; border: 4px solid #e5e7eb; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
        <p style="margin: 0; color: #374151; font-weight: 500;">Generating PDF...</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">Please wait</p>
      </div>
    `
    document.body.appendChild(loadingOverlay)

    // Add spin animation if not already present
    if (!document.getElementById('pdf-spin-animation')) {
      const style = document.createElement('style')
      style.id = 'pdf-spin-animation'
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `
      document.head.appendChild(style)
    }

    // Clone the element to avoid affecting the original
    const clone = element.cloneNode(true) as HTMLElement
    
    // Add PDF-specific styles to clone
    clone.style.backgroundColor = 'white'
    clone.style.padding = '20px'
    clone.style.width = '100%'
    clone.style.maxWidth = '210mm'
    clone.style.margin = '0 auto'
    clone.style.position = 'relative'
    
    // Ensure all text is visible and tables are properly formatted
    const pdfStyle = document.createElement('style')
    pdfStyle.textContent = `
      * {
        color: black !important;
      }
      table {
        border-collapse: collapse !important;
        width: 100% !important;
        margin: 10px 0 !important;
      }
      th, td {
        border: 1px solid #000 !important;
        padding: 6px 8px !important;
        text-align: left !important;
      }
      th {
        background-color: #f5f5f5 !important;
        font-weight: bold !important;
      }
      .print-only {
        display: block !important;
      }
      .print\\:hidden, .print\\:hidden\\! {
        display: none !important;
      }
      .bg-white {
        background-color: white !important;
      }
      .bg-gray-50 {
        background-color: #f9fafb !important;
      }
      .bg-blue-50 {
        background-color: #eff6ff !important;
      }
      .bg-green-50 {
        background-color: #f0fdf4 !important;
      }
      .text-center {
        text-align: center !important;
      }
      .text-right {
        text-align: right !important;
      }
      .font-bold {
        font-weight: bold !important;
      }
      .font-semibold {
        font-weight: 600 !important;
      }
      .tabular-nums {
        font-feature-settings: "tnum" !important;
      }
      .border {
        border: 1px solid #000 !important;
      }
      .border-t {
        border-top: 1px solid #000 !important;
      }
      .border-b {
        border-bottom: 1px solid #000 !important;
      }
      .shadow-sm, .shadow, .shadow-md {
        box-shadow: none !important;
      }
      /* Preserve blue color for header */
      .text-blue-800, .text-blue-600, .text-blue-700 {
        color: #1e40af !important;
      }
      .bg-blue-600, .bg-blue-700 {
        background-color: #1e40af !important;
      }
      /* Ensure tables don't break */
      table, tr, td, th {
        page-break-inside: avoid;
      }
      thead {
        display: table-header-group;
      }
    `
    clone.prepend(pdfStyle)

    // Create a temporary container for PDF generation
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '-9999px'
    container.style.width = '210mm'
    container.style.backgroundColor = 'white'
    container.appendChild(clone)
    document.body.appendChild(container)

    // Wait for styles to apply
    await new Promise(resolve => setTimeout(resolve, 200))

    // Get the total height of the content
    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
      backgroundColor: '#ffffff'
    } as any)

    // Create PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    // Calculate image dimensions
    const imgWidth = pdfWidth - (margin * 2)
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    // Calculate available space per page
    // First page uses margin at top, subsequent pages use pageTopMargin
    const firstPageAvailableHeight = pdfHeight - margin
    const subsequentPageAvailableHeight = pdfHeight - pageTopMargin
    
    let position = 0
    let pageNum = 1
    let isFirstPage = true
    
    while (position < imgHeight) {
      if (pageNum > 1) {
        pdf.addPage()
      }
      
      // Determine top margin for this page
      const currentTopMargin = isFirstPage ? margin : pageTopMargin
      const availableHeight = isFirstPage ? firstPageAvailableHeight : subsequentPageAvailableHeight
      
      // Calculate the portion to show
      const yOffset = position
      const remainingHeight = imgHeight - yOffset
      const heightToShow = Math.min(availableHeight, remainingHeight)
      
      // Add image with offset to show the correct portion
      // The image is positioned so that the portion starting at yOffset is visible
      pdf.addImage(
        canvas, 
        'JPEG', 
        margin, 
        currentTopMargin - yOffset, 
        imgWidth, 
        imgHeight,
        undefined,
        'FAST'
      )
      
      // Move position down by the amount shown
      position += availableHeight
      pageNum++
      isFirstPage = false
    }

    // Save PDF
    const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
    pdf.save(finalFilename)

    // Clean up
    document.body.removeChild(container)
    document.body.removeChild(loadingOverlay)
    
  } catch (error) {
    console.error('PDF generation failed:', error)
    // Remove loading overlay if it exists
    const loadingOverlay = document.querySelector('div[style*="position: fixed"][style*="z-index: 9999"]')
    if (loadingOverlay && loadingOverlay.parentNode) {
      loadingOverlay.parentNode.removeChild(loadingOverlay)
    }
    alert('Failed to generate PDF. Please try again.')
    throw error
  }
}