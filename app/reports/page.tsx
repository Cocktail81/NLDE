'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
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
import type {
  CorrectionRawData,
  CustomerReportRawEntry,
  DateRangeRawEntry,
  RawEntry,
} from './types/raw'
import {
  calculateSummary,
  exportToCSV,
  formatEntry,
  getCustomerName,
  getDefaultReportDates,
  getLaundryItemQuantities,
  getOriginalLaundryItemQuantities,
  getProfileFullName,
  sortByEntryDateAsc,
  toFileSafeName,
} from './utils/report-utils'
import {
  LAUNDRY_ITEMS,
  calculateLaundryTotal,
} from '@/lib/laundry-items'


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
    const { today, lastMonth } = getDefaultReportDates()
  
    setSelectedDate(today)
    setStartDate(lastMonth)
    setEndDate(today)
    setCustomerStartDate(lastMonth)
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
          gown,
          dhoti,
          coat_blazer,
          dry_cleaning,
          dress_dc,
          gown_dc,
          coat_blazer_dc,
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
        const formattedEntries = sortByEntryDateAsc(
          data.map((entry: RawEntry) => formatEntry(entry))
        )
        
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
        gown,
        dhoti,
        coat_blazer,
        dry_cleaning,
        dress_dc,
        gown_dc,
        coat_blazer_dc,
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
      .order('entry_date', { ascending: true })

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
        gown,
        dhoti,
        coat_blazer,
        dry_cleaning,
        dress_dc,
        gown_dc,
        coat_blazer_dc
      `)
      .in('id', originalIds)

      const originalMap = new Map<string, ReturnType<typeof getOriginalLaundryItemQuantities>>()

      originals?.forEach(original => {
        originalMap.set(original.id, getOriginalLaundryItemQuantities(original))
      })

    const formattedCorrections: CorrectionEntry[] =
      correctionsData.map((item: CorrectionRawData) => {
        const original =
          originalMap.get(item.previous_version_id) ||
          getOriginalLaundryItemQuantities({})

  // Extract customer name - handle multiple possible structures
  const customerName = getCustomerName(item.customers)
  const correctedBy = getProfileFullName(item.user_profiles)

  const correctedItems = getLaundryItemQuantities(item)
  return {
    id: item.id,
    entry_date: item.entry_date,
    ...original,
    ...correctedItems,
    correction_reason: item.correction_reason,
    created_at: item.created_at,
    corrected_by: correctedBy,
    customers: { name: customerName },
    previous_version_id: item.previous_version_id,
  }
    })

    setCorrections(sortByEntryDateAsc(formattedCorrections))
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
          gown,
          dhoti,
          coat_blazer,
          dry_cleaning,
          dress_dc,
          gown_dc,
          coat_blazer_dc,
          is_correction,
          customers (
            name
          )
        `)
        .eq('customer_id', selectedCustomer)
        .eq('is_current_version', true)
        .gte('entry_date', customerStartDate)
        .lte('entry_date', customerEndDate)
        .order('entry_date', { ascending: true })

      const { data, error } = await query

      if (error) {
        console.error('Customer report error:', error)
        setCustomerEntries([])
      } else if (data) {
        const formattedEntries = data.map((entry: CustomerReportRawEntry) => {
          const customerName = getCustomerName(entry.customers)
          
          const itemQuantities = getLaundryItemQuantities(entry)

          return {
            id: entry.id,
            entry_date: entry.entry_date,
            customer_id: selectedCustomer,
            customer_name: customerName,
            ...itemQuantities,
            total: calculateLaundryTotal(itemQuantities),
            is_correction: entry.is_correction || false,
            correction_reason: null,
          }
        })
        setCustomerEntries(sortByEntryDateAsc(formattedEntries))
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
          gown,
          dhoti,
          coat_blazer,
          dry_cleaning,
          dress_dc,
          gown_dc,
          coat_blazer_dc,
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
          const customerName = getCustomerName(entry.customers)          

          const itemQuantities = getLaundryItemQuantities(entry)

          return {
            id: entry.id,
            entry_date: entry.entry_date,
            customer_id: entry.customer_id,
            customer_name: customerName,
            ...itemQuantities,
            total: calculateLaundryTotal(itemQuantities),
            is_correction: false,
            correction_reason: null,
          }
        })
        const sortedEntries = sortByEntryDateAsc(formattedEntries)
        setRangeEntries(sortedEntries)
        setRangeSummary(calculateSummary(sortedEntries, `${startDate} to ${endDate}`))
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
  
    const headers = [
      'Customer Name',
      ...LAUNDRY_ITEMS.map(item => item.shortLabel),
      'Total Items',
    ]
  
    const data = sortByEntryDateAsc(dailyEntries).map(entry => ({
      'Customer Name': entry.customer_name,
      ...LAUNDRY_ITEMS.reduce((acc, item) => {
        acc[item.shortLabel] = entry[item.key]
        return acc
      }, {} as Record<string, number>),
      'Total Items': entry.total,
    }))
  
    exportToCSV(data, `daily_report_${selectedDate}`, headers)
  }

  const exportHistoryToCSV = () => {
    if (corrections.length === 0) return
  
    const headers = [
      'Original Date',
      'Customer',
      ...LAUNDRY_ITEMS.map(item => `Original ${item.shortLabel}`),
      ...LAUNDRY_ITEMS.map(item => `Corrected ${item.shortLabel}`),
      ...LAUNDRY_ITEMS.map(item => `${item.shortLabel} Change`),
      'Reason',
      'Corrected By',
      'Corrected At',
    ]
  
    const data = sortByEntryDateAsc(corrections).map((correction: CorrectionEntry) => {
      const originalValues = LAUNDRY_ITEMS.reduce((acc, item) => {
        const originalKey = `original_${item.key}` as keyof CorrectionEntry
        acc[`Original ${item.shortLabel}`] = Number(correction[originalKey] || 0)
        return acc
      }, {} as Record<string, number>)
  
      const correctedValues = LAUNDRY_ITEMS.reduce((acc, item) => {
        acc[`Corrected ${item.shortLabel}`] = correction[item.key]
        return acc
      }, {} as Record<string, number>)
  
      const changedValues = LAUNDRY_ITEMS.reduce((acc, item) => {
        const originalKey = `original_${item.key}` as keyof CorrectionEntry
        const originalValue = Number(correction[originalKey] || 0)
  
        acc[`${item.shortLabel} Change`] = correction[item.key] - originalValue
        return acc
      }, {} as Record<string, number>)
  
      return {
        'Original Date': formatReportDate(correction.entry_date),
        Customer: correction.customers?.name || 'Unknown',
        ...originalValues,
        ...correctedValues,
        ...changedValues,
        Reason: correction.correction_reason || 'N/A',
        'Corrected By': correction.corrected_by,
        'Corrected At': formatReportDateTime(correction.created_at),
      }
    })
  
    exportToCSV(data, `change_history_original_${startDate}_to_${endDate}`, headers)
  }

  const exportCustomerToCSV = () => {
    if (customerEntries.length === 0) return
  
    const headers = [
      'Date',
      ...LAUNDRY_ITEMS.map(item => item.shortLabel),
      'Total Items',
    ]
  
    const data = sortByEntryDateAsc(customerEntries).map(entry => ({
      Date: formatReportDate(entry.entry_date),
      ...LAUNDRY_ITEMS.reduce((acc, item) => {
        acc[item.shortLabel] = entry[item.key]
        return acc
      }, {} as Record<string, number>),
      'Total Items': entry.total,
    }))
  
    const customerName = toFileSafeName(
      customerEntries[0]?.customer_name || '',
      'customer'
    )
  
    exportToCSV(
      data,
      `${customerName}_report_${customerStartDate}_to_${customerEndDate}`,
      headers
    )
  }

  const exportRangeToCSV = () => {
    if (rangeEntries.length === 0) return
  
    const headers = [
      'Date',
      'Customer',
      ...LAUNDRY_ITEMS.map(item => item.shortLabel),
      'Total Items',
    ]
  
    const data = sortByEntryDateAsc(rangeEntries).map(entry => ({
      Date: formatReportDate(entry.entry_date),
      Customer: entry.customer_name,
      ...LAUNDRY_ITEMS.reduce((acc, item) => {
        acc[item.shortLabel] = entry[item.key]
        return acc
      }, {} as Record<string, number>),
      'Total Items': entry.total,
    }))
  
    const customerSuffix =
      dateRangeCustomer !== 'all'
        ? `_${toFileSafeName(rangeEntries[0]?.customer_name || '', 'customer')}`
        : ''
  
    exportToCSV(
      data,
      `date_range_report_${startDate}_to_${endDate}${customerSuffix}`,
      headers
    )
  }

  const formatReportDate = (value: string) => {
    return new Date(value).toLocaleDateString('en-GB')
  }

  const formatReportDateTime = (value: string) => {
    const date = new Date(value)
  
    const dateText = date.toLocaleDateString('en-GB')
    const timeText = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  
    return `${dateText}, ${timeText}`
  }

  const handlePrint = () => {
    let title = ''
    let subtitle = ''
    let dateRange = ''
    let customerName = ''
    let additionalInfo: Array<{ label: string; value: string | number }> = []

    if (activeTab === 'daily' && dailySummary) {
      title = 'Daily Summary Report'
      subtitle = formatReportDate(selectedDate)
      additionalInfo = [
        { label: 'Total Entries', value: dailySummary.total_entries },
        { label: 'Total Items', value: dailySummary.grand_total },
        ...LAUNDRY_ITEMS.map(item => ({
          label: item.shortLabel,
          value: dailySummary.item_totals[item.key],
        })),
      ]
    } else if (activeTab === 'history' && corrections.length > 0) {
      title = 'Change History Report'
      dateRange = `${formatReportDate(startDate)} - ${formatReportDate(endDate)}`
      additionalInfo = [
        { label: 'Total Corrections', value: corrections.length }
      ]
    } else if (activeTab === 'customer' && customerEntries.length > 0) {
      const customer = customers.find(c => c.id === selectedCustomer)
      title = 'Customer Report'
      subtitle = customer?.name || ''
      dateRange = `${formatReportDate(customerStartDate)} - ${formatReportDate(customerEndDate)}`
      const totalItems = customerEntries.reduce((sum, e) => sum + e.total, 0)
      additionalInfo = [
        { label: 'Total Visits', value: customerEntries.length },
        { label: 'Total Items', value: totalItems },
        ...LAUNDRY_ITEMS.map(item => ({
          label: item.shortLabel,
          value: customerEntries.reduce((sum, entry) => sum + entry[item.key], 0),
        })),
      ]
    } else if (activeTab === 'daterange' && rangeSummary) {
      title = 'Date Range Report'
      dateRange = `${formatReportDate(startDate)} - ${formatReportDate(endDate)}`
      if (dateRangeCustomer !== 'all') {
        const customer = customers.find(c => c.id === dateRangeCustomer)
        customerName = customer?.name || ''
      }
      additionalInfo = [
        { label: 'Total Entries', value: rangeSummary.total_entries },
        { label: 'Total Items', value: rangeSummary.grand_total },
        ...LAUNDRY_ITEMS.map(item => ({
          label: item.shortLabel,
          value: rangeSummary.item_totals[item.key],
        })),
      ]
    }

    if (!title) return

    printReport({
      title,
      subtitle,
      dateRange,
      customerName,
      companyName: 'Nandlal Laundry',
      additionalInfo,
      orientation: 'landscape',
      compact: activeTab === 'history',
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