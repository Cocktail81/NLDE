// lib/csv.ts

/**
 * Convert data to CSV string with proper escaping
 */
export function convertToCSV(data: any[][]): string {
  return data.map(row => 
    row.map(cell => {
      // Handle null/undefined
      if (cell === null || cell === undefined) return ''
      
      // Convert to string
      const stringCell = String(cell)
      
      // Escape quotes and wrap in quotes if contains comma, newline, or quote
      if (stringCell.includes(',') || stringCell.includes('\n') || stringCell.includes('"')) {
        return `"${stringCell.replace(/"/g, '""')}"`
      }
      return stringCell
    }).join(',')
  ).join('\n')
}

/**
 * Trigger download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format date for CSV display
 */
export function formatDateForCSV(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(reportName: string, includeDate: boolean = true): string {
  const base = `nlde_${reportName.replace(/\s+/g, '_')}`
  if (!includeDate) return `${base}.csv`
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  return `${base}_${timestamp}.csv`
}