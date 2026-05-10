'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/layout/PageLayout'
import { printReport } from '@/lib/printUtils'

// Components
import ReportTabs from './components/ReportTabs'
import DailyReport from './components/DailyReport'
import ChangeHistory from './components/ChangeHistory'
import CustomerReport from './components/CustomerReport'
import DateRangeReport from './components/DateRangeReport'

// Types
import { Entry, DailySummary, Customer, CorrectionEntry } from './types'

// ============================================
// TYPES FOR RAW DATA FROM SUPABASE
// ============================================

interface RawEntry {
  id: string
  entry_date: string
  customer_id: string
  ironing: number
  saree_ironing: number
  dry_cleaning: number
  is_correction: boolean
  correction_reason: string | null
  customers?: { name: string } | { name: string }[] | null
}

interface CorrectionRawData {
  id: string
  entry_date: string
  ironing: number
  saree_ironing: number
  dry_cleaning: number
  correction_reason: string | null
  created_at: string
  previous_version_id: string
  created_by: string
  customers: { name: string }[]  // customers is always an array
  user_profiles: { full_name: string }[] | null  // user_profiles is an array or null
}

interface DateRangeRawEntry {
  id: string
  entry_date: string
  customer_id: string
  ironing: number
  saree_ironing: number
  dry_cleaning: number
  customers: { name: string } | { name: string }[] | null
}

interface CustomerReportRawEntry {
  id: string
  entry_date: string
  ironing: number
  saree_ironing: number
  dry_cleaning: number
  is_correction: boolean
  customers: { name: string } | { name: string }[] | null
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/** Formats a single entry from database to frontend structure */
const formatEntry = (entry: RawEntry, customerName?: string): Entry => {
  let extractedName = 'Unknown'
  if (entry.customers) {
    if (Array.isArray(entry.customers) && entry.customers.length > 0) {
      extractedName = entry.customers[0].name
    } else if (!Array.isArray(entry.customers) && entry.customers.name) {
      extractedName = entry.customers.name
    }
  }
  
  return {
    id: entry.id,
    entry_date: entry.entry_date,
    customer_id: entry.customer_id,
    customer_name: customerName || extractedName,
    ironing: entry.ironing || 0,
    saree_ironing: entry.saree_ironing || 0,
    dry_cleaning: entry.dry_cleaning || 0,
    total: (entry.ironing || 0) + (entry.saree_ironing || 0) + (entry.dry_cleaning || 0),
    is_correction: entry.is_correction || false,
    correction_reason: entry.correction_reason
  }
}

/** Calculates summary statistics from a list of entries */
const calculateSummary = (entries: Entry[], dateLabel: string): DailySummary => ({
  date: dateLabel,
  total_entries: entries.length,
  total_ironing: entries.reduce((sum, e) => sum + e.ironing, 0),
  total_saree_ironing: entries.reduce((sum, e) => sum + e.saree_ironing, 0),
  total_dry_cleaning: entries.reduce((sum, e) => sum + e.dry_cleaning, 0),
  grand_total: entries.reduce((sum, e) => sum + e.total, 0)
})

/** Core CSV export function - creates and downloads CSV file */
const exportToCSV = <T extends Record<string, unknown>>(data: T[], filename: string, headers: string[]) => {
  const csvRows = [headers.join(',')]
  
  for (const row of data) {
    const values = headers.map(header => {
      const key = Object.keys(row).find(k => k.toLowerCase() === header.toLowerCase()) || header
      const value = row[key] !== undefined ? row[key] : ''
      const escaped = String(value).replace(/"/g, '""')
      
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
        return `"${escaped}"`
      }
      return escaped
    })
    csvRows.push(values.join(','))
  }
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ReportsPage() {
  const router = useRouter()
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'customer' | 'daterange'>('daily')
  
  // Daily Report State
  const [selectedDate, setSelectedDate] = useState('')
  const [dailyEntries, setDailyEntries] = useState<Entry[]>([])
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null)
  
  // Date Range Report State
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rangeEntries, setRangeEntries] = useState<Entry[]>([])
  const [rangeSummary, setRangeSummary] = useState<DailySummary | null>(null)
  
  // Customer Report State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [customerEntries, setCustomerEntries] = useState<Entry[]>([])
  
  // Change History State
  const [corrections, setCorrections] = useState<CorrectionEntry[]>([])

  // Date Range 
  const [dateRangeCustomer, setDateRangeCustomer] = useState('all')

  // Customer Wire Report Data Range
  const [customerStartDate, setCustomerStartDate] = useState('')
  const [customerEndDate, setCustomerEndDate] = useState('')

  
  // ============================================
  // FUNCTION DECLARATIONS (BEFORE useEffect)
  // ============================================

  const fetchCustomersList = async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    
    if (data) setCustomers(data)
  }

  const setDefaultDates = () => {
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
    
    const lastMonth = new Date()
    lastMonth.setDate(lastMonth.getDate() - 30)
    setStartDate(lastMonth.toISOString().split('T')[0])
    setEndDate(today)
    
    setCustomerStartDate(lastMonth.toISOString().split('T')[0])
    setCustomerEndDate(today)
  }

  useEffect(() => {
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    await fetchCustomersList()
    setDefaultDates()

    setLoading(false)
  }

  void init()
}, [router])

  /** Generates daily report for selected date */
  const generateDailyReport = async () => {
    if (!selectedDate) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('entries')
        .select(`
          id,
          entry_date,
          customer_id,
          ironing,
          saree_ironing,
          dry_cleaning,
          is_correction,
          correction_reason,
          customers!inner (name)
        `)
        .eq('entry_date', selectedDate)
        .eq('is_current_version', true)

      if (error) {
        console.error('Daily report error:', error)
        setDailyEntries([])
        setDailySummary(null)
        return
      }

      if (data && data.length > 0) {
        const formattedEntries = data.map((entry: RawEntry) => formatEntry(entry))
        setDailyEntries(formattedEntries)
        setDailySummary(calculateSummary(formattedEntries, selectedDate))
      } else {
        setDailyEntries([])
        setDailySummary(null)
      }
    } catch (err) {
      console.error('Error generating daily report:', err)
    } finally {
      setLoading(false)
    }
  }

  /** Generates change history report with original vs corrected values */
  const generateChangeHistory = useCallback(async () => {
  if (!startDate || !endDate) return

  setLoading(true)

  try {
    const { data: correctionsData, error } = await supabase
      .from('entries')
      .select(`
        id,
        entry_date,
        ironing,
        saree_ironing,
        dry_cleaning,
        correction_reason,
        created_at,
        previous_version_id,
        created_by,
        customers!inner (name),
        user_profiles!created_by (full_name)
      `)
      .eq('is_correction', true)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: false })

    if (error) {
      console.error('Change history error:', error)
      setCorrections([])
      return
    }

    if (!correctionsData || correctionsData.length === 0) {
      setCorrections([])
      return
    }

    const originalIds = correctionsData
      .filter((c: CorrectionRawData) => c.previous_version_id)
      .map((c: CorrectionRawData) => c.previous_version_id)

    const { data: originals } = await supabase
      .from('entries')
      .select(`
        id,
        entry_date,
        ironing,
        saree_ironing,
        dry_cleaning
      `)
      .in('id', originalIds)

    const originalMap = new Map()

    originals?.forEach(original => {
      originalMap.set(original.id, {
        ironing: original.ironing || 0,
        saree_ironing: original.saree_ironing || 0,
        dry_cleaning: original.dry_cleaning || 0
      })
    })

    const formattedCorrections: CorrectionEntry[] =
      correctionsData.map((item: CorrectionRawData) => {
        const original = originalMap.get(item.previous_version_id) || {
          ironing: 0,
          saree_ironing: 0,
          dry_cleaning: 0
        }

        let correctedBy = 'Unknown User'

        if (item.user_profiles?.length) {
          correctedBy = item.user_profiles[0].full_name
        }

        return {
          id: item.id,
          entry_date: item.entry_date,
          original_ironing: original.ironing,
          original_saree_ironing: original.saree_ironing,
          original_dry_cleaning: original.dry_cleaning,
          ironing: item.ironing || 0,
          saree_ironing: item.saree_ironing || 0,
          dry_cleaning: item.dry_cleaning || 0,
          correction_reason: item.correction_reason,
          created_at: item.created_at,
          corrected_by: correctedBy,
          customers: {
            name: item.customers?.[0]?.name || 'Unknown'
          },
          previous_version_id: item.previous_version_id
        }
      })

    setCorrections(formattedCorrections)
  } catch (err) {
    console.error('Error generating change history:', err)
    } finally {
    setLoading(false)
  }
}, [startDate, endDate])

  /** Generates customer-wise report for selected customer with date range */
  const generateCustomerReport = useCallback(async () => {
    if (!selectedCustomer) return
    
    setLoading(true)
    try {
      let query = supabase
        .from('entries')
        .select(`
          id,
          entry_date,
          ironing,
          saree_ironing,
          dry_cleaning,
          is_correction,
          customers (
            name
          )
        `)
        .eq('customer_id', selectedCustomer)
        .eq('is_current_version', true)
        .gte('entry_date', customerStartDate)
        .lte('entry_date', customerEndDate)
        .order('entry_date', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Customer report error:', error)
        setCustomerEntries([])
      } else if (data) {
        const formattedEntries = data.map((entry: CustomerReportRawEntry) => {
          let customerName = 'Unknown'
          if (entry.customers) {
            if (Array.isArray(entry.customers) && entry.customers.length > 0) {
              customerName = entry.customers[0].name
            } else if (!Array.isArray(entry.customers) && entry.customers.name) {
              customerName = entry.customers.name
            }
          }
          
          return {
            id: entry.id,
            entry_date: entry.entry_date,
            customer_id: selectedCustomer,
            customer_name: customerName,
            ironing: entry.ironing || 0,
            saree_ironing: entry.saree_ironing || 0,
            dry_cleaning: entry.dry_cleaning || 0,
            total: (entry.ironing || 0) + (entry.saree_ironing || 0) + (entry.dry_cleaning || 0),
            is_correction: entry.is_correction || false,
            correction_reason: null
          }
        })
        setCustomerEntries(formattedEntries)
      }
    } catch (err) {
      console.error('Error generating customer report:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedCustomer, customerStartDate, customerEndDate])

  /** Generates date range report between start and end dates with optional customer filter */
  const generateDateRangeReport = async () => {
    if (!startDate || !endDate) return
    
    setLoading(true)
    try {
      let query = supabase
        .from('entries')
        .select(`
          id,
          entry_date,
          customer_id,
          ironing,
          saree_ironing,
          dry_cleaning,
          customers (
            name
          )
        `)
        .eq('is_current_version', true)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true })

      if (dateRangeCustomer !== 'all') {
        query = query.eq('customer_id', dateRangeCustomer)
      }

      const { data, error } = await query

      if (error) {
        console.error('Date range error DETAILS:', error)
        setRangeEntries([])
        setRangeSummary(null)
        return
      }

      if (data && data.length > 0) {
        const formattedEntries = data.map((entry: DateRangeRawEntry) => {
          let customerName = 'Unknown'
          if (entry.customers) {
            if (Array.isArray(entry.customers) && entry.customers.length > 0) {
              customerName = entry.customers[0].name
            } else if (!Array.isArray(entry.customers) && entry.customers.name) {
              customerName = entry.customers.name
            }
          }
          
          return {
            id: entry.id,
            entry_date: entry.entry_date,
            customer_id: entry.customer_id,
            customer_name: customerName,
            ironing: entry.ironing || 0,
            saree_ironing: entry.saree_ironing || 0,
            dry_cleaning: entry.dry_cleaning || 0,
            total: (entry.ironing || 0) + (entry.saree_ironing || 0) + (entry.dry_cleaning || 0),
            is_correction: false,
            correction_reason: null
          }
        })
        setRangeEntries(formattedEntries)
        setRangeSummary(calculateSummary(formattedEntries, `${startDate} to ${endDate}`))
      } else {
        setRangeEntries([])
        setRangeSummary(null)
      }
    } catch (err) {
      console.error('Error generating date range report:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportDailyToCSV = () => {
    if (dailyEntries.length === 0) return
    
    const headers = ['Customer Name', 'Ironing', 'Saree Ironing', 'Dry Cleaning', 'Total Items']
    const data = dailyEntries.map(entry => ({
      'Customer Name': entry.customer_name,
      'Ironing': entry.ironing,
      'Saree Ironing': entry.saree_ironing,
      'Dry Cleaning': entry.dry_cleaning,
      'Total Items': entry.total
    }))
    
    exportToCSV(data, `daily_report_${selectedDate}`, headers)
  }

  const exportHistoryToCSV = () => {
    if (corrections.length === 0) return
    
    const headers = [
      'Original Date', 
      'Customer', 
      'Original Ironing', 
      'Original Saree', 
      'Original Dry Clean',
      'Corrected Ironing', 
      'Corrected Saree', 
      'Corrected Dry Clean',
      'Ironing Change', 
      'Saree Change', 
      'Dry Clean Change',
      'Reason', 
      'Corrected By',
      'Corrected At'
    ]
    
    const data = corrections.map((correction: CorrectionEntry) => ({
      'Original Date': new Date(correction.entry_date).toLocaleDateString(),
      'Customer': correction.customers?.name || 'Unknown',
      'Original Ironing': correction.original_ironing,
      'Original Saree': correction.original_saree_ironing,
      'Original Dry Clean': correction.original_dry_cleaning,
      'Corrected Ironing': correction.ironing,
      'Corrected Saree': correction.saree_ironing,
      'Corrected Dry Clean': correction.dry_cleaning,
      'Ironing Change': correction.ironing - correction.original_ironing,
      'Saree Change': correction.saree_ironing - correction.original_saree_ironing,
      'Dry Clean Change': correction.dry_cleaning - correction.original_dry_cleaning,
      'Reason': correction.correction_reason || 'N/A',
      'Corrected By': correction.corrected_by,
      'Corrected At': new Date(correction.created_at).toLocaleString()
    }))
    
    exportToCSV(data, `change_history_original_${startDate}_to_${endDate}`, headers)
  }

  const exportCustomerToCSV = () => {
    if (customerEntries.length === 0) return
    
    const headers = ['Date', 'Ironing', 'Saree Ironing', 'Dry Cleaning', 'Total Items']
    const data = customerEntries.map(entry => ({
      'Date': new Date(entry.entry_date).toLocaleDateString(),
      'Ironing': entry.ironing,
      'Saree Ironing': entry.saree_ironing,
      'Dry Cleaning': entry.dry_cleaning,
      'Total Items': entry.total
    }))
    
    const customerName = customerEntries[0]?.customer_name?.replace(/\s/g, '_') || 'customer'
    exportToCSV(data, `${customerName}_report_${customerStartDate}_to_${customerEndDate}`, headers)
  }

  const exportRangeToCSV = () => {
    if (rangeEntries.length === 0) return
    
    const headers = ['Date', 'Customer', 'Ironing', 'Saree Ironing', 'Dry Cleaning', 'Total Items']
    const data = rangeEntries.map(entry => ({
      'Date': new Date(entry.entry_date).toLocaleDateString(),
      'Customer': entry.customer_name,
      'Ironing': entry.ironing,
      'Saree Ironing': entry.saree_ironing,
      'Dry Cleaning': entry.dry_cleaning,
      'Total Items': entry.total
    }))
    
    const customerSuffix = dateRangeCustomer !== 'all' 
      ? `_${rangeEntries[0]?.customer_name?.replace(/\s/g, '_') || 'customer'}` 
      : ''
    
    exportToCSV(data, `date_range_report_${startDate}_to_${endDate}${customerSuffix}`, headers)
  }

  const handlePrint = () => {
    let title = ''
    let subtitle = ''
    let dateRange = ''
    let customerName = ''
    let additionalInfo: Array<{ label: string; value: string | number }> = []

    if (activeTab === 'daily' && dailySummary) {
      title = 'Daily Summary Report'
      subtitle = new Date(selectedDate).toLocaleDateString()
      additionalInfo = [
        { label: 'Total Entries', value: dailySummary.total_entries },
        { label: 'Total Items', value: dailySummary.grand_total },
        { label: 'Ironing', value: dailySummary.total_ironing },
        { label: 'Saree Ironing', value: dailySummary.total_saree_ironing },
        { label: 'Dry Cleaning', value: dailySummary.total_dry_cleaning }
      ]
    } else if (activeTab === 'history' && corrections.length > 0) {
      title = 'Change History Report'
      dateRange = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
      additionalInfo = [
        { label: 'Total Corrections', value: corrections.length }
      ]
    } else if (activeTab === 'customer' && customerEntries.length > 0) {
      const customer = customers.find(c => c.id === selectedCustomer)
      title = 'Customer Report'
      subtitle = customer?.name || ''
      dateRange = `${new Date(customerStartDate).toLocaleDateString()} - ${new Date(customerEndDate).toLocaleDateString()}`
      const totalItems = customerEntries.reduce((sum, e) => sum + e.total, 0)
      additionalInfo = [
        { label: 'Total Visits', value: customerEntries.length },
        { label: 'Total Items', value: totalItems },
        { label: 'Ironing', value: customerEntries.reduce((sum, e) => sum + e.ironing, 0) },
        { label: 'Saree', value: customerEntries.reduce((sum, e) => sum + e.saree_ironing, 0) },
        { label: 'Dry Clean', value: customerEntries.reduce((sum, e) => sum + e.dry_cleaning, 0) }
      ]
    } else if (activeTab === 'daterange' && rangeSummary) {
      title = 'Date Range Report'
      dateRange = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
      if (dateRangeCustomer !== 'all') {
        const customer = customers.find(c => c.id === dateRangeCustomer)
        customerName = customer?.name || ''
      }
      additionalInfo = [
        { label: 'Total Entries', value: rangeSummary.total_entries },
        { label: 'Total Items', value: rangeSummary.grand_total },
        { label: 'Ironing', value: rangeSummary.total_ironing },
        { label: 'Saree', value: rangeSummary.total_saree_ironing },
        { label: 'Dry Clean', value: rangeSummary.total_dry_cleaning }
      ]
    }

    printReport({
      title,
      subtitle,
      dateRange,
      customerName,
      companyName: 'Nandlal Laundry',
      additionalInfo
    })
  }

  const handleTabChange = async (
  tab: 'daily' | 'history' | 'customer' | 'daterange'
) => {
  setActiveTab(tab)

  if (tab !== 'daterange') {
    setDateRangeCustomer('all')
  }

  if (tab === 'history' && startDate && endDate) {
    await generateChangeHistory()
  }
}

  // ============================================
  // EFFECTS (after all functions are declared)
  // ============================================

  // State to trigger history fetch without calling setState in effect
//   useEffect(() => {
//   if (activeTab === 'history' && startDate && endDate) {
//     void generateChangeHistory()
//   }
// }, [activeTab, startDate, endDate, generateChangeHistory])

  // Initial page load - runs once
  useEffect(() => {
    const initializePage = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      const { data } = await supabase
        .from('customers')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      
      if (data) setCustomers(data)
      
      const today = new Date().toISOString().split('T')[0]
      setSelectedDate(today)
      
      const lastMonth = new Date()
      lastMonth.setDate(lastMonth.getDate() - 30)
      setStartDate(lastMonth.toISOString().split('T')[0])
      setEndDate(today)
      setCustomerStartDate(lastMonth.toISOString().split('T')[0])
      setCustomerEndDate(today)
      
      setLoading(false)
    }
    
    initializePage()
  }, [router])
  
  // ============================================
  // RENDER
  // ============================================

  if (loading && !dailyEntries.length && !corrections.length) {
    return (
      <PageLayout 
        title="Reports" 
        showBackButton={true} 
        showHomeButton={true}
        customBackPath="/dashboard"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout 
      title="Reports" 
      showBackButton={true} 
      showHomeButton={true}
      customBackPath="/dashboard"
    >
      <ReportTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === 'daily' && (
        <DailyReport
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          dailyEntries={dailyEntries}
          dailySummary={dailySummary}
          loading={loading}
          onGenerate={generateDailyReport}
          onExport={exportDailyToCSV}
          onPrint={handlePrint}
        />
      )}

      {activeTab === 'history' && (
        <ChangeHistory
          corrections={corrections}
          loading={loading}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onLoad={generateChangeHistory}
          onExport={exportHistoryToCSV}
          onPrint={handlePrint}
        />
      )}

      {activeTab === 'customer' && (
        <CustomerReport
          customers={customers}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          customerEntries={customerEntries}
          loading={loading}
          startDate={customerStartDate}
          endDate={customerEndDate}
          onStartDateChange={setCustomerStartDate}
          onEndDateChange={setCustomerEndDate}
          onGenerate={generateCustomerReport}
          onExport={exportCustomerToCSV}
          onPrint={handlePrint}
        />
      )}

      {activeTab === 'daterange' && (
        <DateRangeReport
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          rangeEntries={rangeEntries}
          rangeSummary={rangeSummary}
          loading={loading}
          customers={customers}
          selectedCustomer={dateRangeCustomer}
          setSelectedCustomer={setDateRangeCustomer}
          onGenerate={generateDateRangeReport}
          onExport={exportRangeToCSV}
          onPrint={handlePrint}
        />
      )}
    </PageLayout>
  )
}