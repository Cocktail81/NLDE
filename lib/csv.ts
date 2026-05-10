// lib/csv.ts

interface CSVOptions {
  /** Delimiter between columns (default: ',') */
  delimiter?: string
  /** Whether to include BOM for UTF-8 (default: true) */
  includeBOM?: boolean
  /** How to handle complex values (objects/arrays) */
  complexValueHandler?: (value: unknown) => string
}

/**
 * Convert 2D array data to CSV string with proper escaping
 * @param data - 2D array of data to convert
 * @param options - CSV formatting options
 * @returns CSV formatted string
 * 
 * @example
 * convertToCSV([['Name', 'Age'], ['John', 30], ['Jane', 25]])
 * // Returns: "Name,Age\nJohn,30\nJane,25"
 */
export function convertToCSV<T>(
  data: T[][], 
  options: CSVOptions = {}
): string {
  // Handle empty data
  if (!data || data.length === 0) {
    return ''
  }
  
  const {
    delimiter = ',',
    complexValueHandler
  } = options

  return data.map(row => 
    row.map(cell => formatCellValue(cell, delimiter, complexValueHandler)).join(delimiter)
  ).join('\n')
}

/**
 * Format a single cell value for CSV
 */
function formatCellValue(
  cell: unknown, 
  delimiter: string,
  complexValueHandler?: (value: unknown) => string
): string {
  // Handle null/undefined
  if (cell === null || cell === undefined) {
    return ''
  }
  
  // Handle complex values (objects/arrays)
  if (typeof cell === 'object') {
    if (complexValueHandler) {
      return escapeCSVValue(complexValueHandler(cell), delimiter)
    }
    // Default: convert to JSON string for objects/arrays
    return escapeCSVValue(JSON.stringify(cell), delimiter)
  }
  
  // Convert to string for primitive types
  const stringCell = String(cell)
  return escapeCSVValue(stringCell, delimiter)
}

/**
 * Escape a value for CSV (wrap in quotes if contains delimiter, newline, or quotes)
 */
function escapeCSVValue(value: string, delimiter: string): string {
  // Check if escaping is needed
  const needsEscaping = value.includes(delimiter) || 
                        value.includes('\n') || 
                        value.includes('"')
  
  if (!needsEscaping) {
    return value
  }
  
  // Escape double quotes by doubling them
  return `"${value.replace(/"/g, '""')}"`
}

/**
 * Trigger download of CSV file
 * @param csvContent - CSV content string
 * @param filename - Name of the file to download (should end with .csv)
 * @param options - Download options
 */
export function downloadCSV(
  csvContent: string, 
  filename: string,
  options: { includeBOM?: boolean } = {}
): void {
  const { includeBOM = true } = options
  
  // Add BOM for UTF-8 to handle special characters (e.g., Indian rupee symbol)
  const content = includeBOM ? '\uFEFF' + csvContent : csvContent
  
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  // Ensure filename has .csv extension
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`
  
  link.setAttribute('href', url)
  link.setAttribute('download', finalFilename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format date for CSV display
 * @param date - Date string or Date object
 * @param format - Optional date format (default: 'DD/MM/YYYY')
 * @returns Formatted date string
 * 
 * @example
 * formatDateForCSV('2024-01-15') // Returns: "15/01/2024"
 */
export function formatDateForCSV(
  date: string | Date, 
  format: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY' = 'DD/MM/YYYY'
): string {
  const d = new Date(date)
  
  // Check if date is valid
  if (isNaN(d.getTime())) {
    return ''
  }
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`
  }
}

/**
 * Generate filename with timestamp
 * @param reportName - Base name for the report
 * @param includeDate - Whether to include timestamp (default: true)
 * @param extension - File extension (default: 'csv')
 * @returns Generated filename
 * 
 * @example
 * generateFilename('daily_report') // Returns: "nlde_daily_report_15-01-2025.csv"
 */
export function generateFilename(
  reportName: string, 
  includeDate: boolean = true,
  extension: string = 'csv'
): string {
  // Sanitize report name (remove special characters)
  const sanitizedName = reportName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  
  const base = `nlde_${sanitizedName}`
  
  if (!includeDate) {
    return `${base}.${extension}`
  }
  
  // Format: DD-MM-YYYY
  const today = new Date()
  const day = today.getDate().toString().padStart(2, '0')
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const year = today.getFullYear()
  const timestamp = `${day}-${month}-${year}`
  
  return `${base}_${timestamp}.${extension}`
}