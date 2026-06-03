'use client'

import { useState, useEffect, Suspense, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import PageLayout from '@/components/layout/PageLayout'
import { useUrlCustomerFilter } from '@/hooks/useUrlCustomerFilter'
import {
  LAUNDRY_ITEMS,
  calculateLaundryTotal,
  type LaundryItemQuantities,
} from '@/lib/laundry-items'

interface Entry extends LaundryItemQuantities {
  id: string
  entry_date: string
  customer_name: string
  total: number
  is_correction: boolean
  correction_reason: string | null
  created_at: string
}

interface Customer {
  id: string
  name: string
}

const PAGE_SIZE_OPTIONS = [20, 50, 100]

// Loading fallback component
function EntriesLoading() {
  return (
    <PageLayout title="All Entries" showBackButton={true} customBackPath="/dashboard">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading entries...</p>
        </div>
      </div>
    </PageLayout>
  )
}

// Main component that uses useSearchParams
function EntriesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerIdParam = searchParams.get('customer')  
  const [loading] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showCorrectionsOnly, setShowCorrectionsOnly] = useState(false)
  const [selectedCustomerName, setSelectedCustomerName] = useState('')
  

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // ============================================
  // FUNCTION DECLARATIONS (declared BEFORE useEffect)
  // ============================================

  const checkAuth = useCallback(async () => {
  const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }    
  }, [router])


    const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    
    if (data) {
      setCustomers(data)
    }
  }, [])

  const [previousFilters, setPreviousFilters] = useState({ customerId: '', startDate: '', endDate: '', showCorrectionsOnly: false })

    const fetchEntries = useCallback(async () => {

    const filtersChanged = 
      selectedCustomerId !== previousFilters.customerId ||
      startDate !== previousFilters.startDate ||
      endDate !== previousFilters.endDate ||
      showCorrectionsOnly !== previousFilters.showCorrectionsOnly

    let effectivePage = currentPage
      if (filtersChanged) {
        effectivePage = 1
        setCurrentPage(1)
        setPreviousFilters({ customerId: selectedCustomerId, startDate, endDate, showCorrectionsOnly })
      }

    // First, get total count for pagination
    let countQuery = supabase
      .from('entries')
      .select('*', { count: 'exact', head: true })
      .eq('is_current_version', true)

    // Apply customer filter to count query
    if (selectedCustomerId && selectedCustomerId !== '') {
      countQuery = countQuery.eq('customer_id', selectedCustomerId)
    }
    if (startDate && endDate) {
      countQuery = countQuery.gte('entry_date', startDate).lte('entry_date', endDate)
    } else if (startDate) {
      countQuery = countQuery.gte('entry_date', startDate)
    } else if (endDate) {
      countQuery = countQuery.lte('entry_date', endDate)
    }
    if (showCorrectionsOnly) {
      countQuery = countQuery.eq('is_correction', true)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error fetching count:', countError)
    } else {
      setTotalCount(count || 0)
      setTotalPages(Math.ceil((count || 0) / pageSize))
    }

    // Fetch paginated data
    let dataQuery = supabase
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
        created_at,
        customers!entries_customer_id_fkey (name, is_active)
      `)
      .eq('is_current_version', true)
      .order('entry_date', { ascending: true })
      .order('created_at', { ascending: true })
      .range((effectivePage - 1) * pageSize, effectivePage * pageSize - 1)

    // Apply customer filter to data query
    if (selectedCustomerId && selectedCustomerId !== '') {
      dataQuery = dataQuery.eq('customer_id', selectedCustomerId)
    }
    if (startDate && endDate) {
      dataQuery = dataQuery.gte('entry_date', startDate).lte('entry_date', endDate)
    } else if (startDate) {
      dataQuery = dataQuery.gte('entry_date', startDate)
    } else if (endDate) {
      dataQuery = dataQuery.lte('entry_date', endDate)
    }
    if (showCorrectionsOnly) {
      dataQuery = dataQuery.eq('is_correction', true)
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error('Error fetching entries:', error)
      setEntries([])
    } else if (data) {
      const formattedEntries: Entry[] = data.map((entry: LaundryItemQuantities & {
        id: string
        entry_date: string
        is_correction: boolean
        correction_reason: string | null
        created_at: string
        customers: { name: string } | { name: string }[] | null
      }) => {
        let customerName = 'Unknown'
        if (entry.customers) {
          if (Array.isArray(entry.customers) && entry.customers.length > 0) {
            customerName = entry.customers[0].name
          } else if (!Array.isArray(entry.customers) && entry.customers.name) {
            customerName = entry.customers.name
          }
        }
        const itemQuantities = LAUNDRY_ITEMS.reduce((acc, item) => {
          acc[item.key] = entry[item.key] || 0
          return acc
        }, {} as LaundryItemQuantities)
        
        return {
          id: entry.id,
          entry_date: entry.entry_date,
          customer_name: customerName,
          ...itemQuantities,
          total: calculateLaundryTotal(itemQuantities),
          is_correction: entry.is_correction || false,
          correction_reason: entry.correction_reason,
          created_at: entry.created_at,
        }
      })
      setEntries(formattedEntries)
    }
  }, [selectedCustomerId, startDate, endDate, showCorrectionsOnly, currentPage, pageSize, previousFilters])

  // ============================================
  // EFFECTS (after all functions are declared)
  // ============================================

    // Initial load - check auth and fetch data
  useEffect(() => {
    const init = async () => {
      await checkAuth()
      await fetchCustomers()
    }
    init()
  }, [checkAuth, fetchCustomers])  // Now includes dependencies    

    // Add a ref to track if this is the first render
    const isFirstRender = useRef(true)

    // Fetch entries when filters or pagination changes
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }
      fetchEntries()
}, [selectedCustomerId, startDate, endDate, showCorrectionsOnly, currentPage, pageSize, fetchEntries])

  // Handle customer filter from URL after customers are loaded
useUrlCustomerFilter(customerIdParam, customers, setSelectedCustomerId, setSelectedCustomerName)

const exportToCSV = () => {
  if (entries.length === 0) return

  const headers = [
    'Date',
    'Customer',
    ...LAUNDRY_ITEMS.map(item => item.shortLabel),
    'Total',
    'Type',
  ]

  const csvRows = [headers.join(',')]

  for (const entry of entries) {
    const row = [
      formatDate(entry.entry_date),
      `"${entry.customer_name.replace(/"/g, '""')}"`,
      ...LAUNDRY_ITEMS.map(item => entry[item.key]),
      entry.total,
      entry.is_correction ? 'Corrected' : 'Original',
    ]

    csvRows.push(row.join(','))
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.download = `entries_export_${new Date().toISOString().split('T')[0]}.csv`

  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}

  const clearFilters = () => {
    setSelectedCustomerId('')
    setSelectedCustomerName('')
    setStartDate('')
    setEndDate('')
    setShowCorrectionsOnly(false)
    router.push('/entries')
    // Fetch entries after clearing filters
    setTimeout(() => fetchEntries(), 100)
  }

  const removeCustomerFilter = () => {
    setSelectedCustomerId('')
    setSelectedCustomerName('')
    router.push('/entries')
    // Fetch entries after removing filter
    setTimeout(() => fetchEntries(), 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Calculate totals
  const itemTotals = LAUNDRY_ITEMS.reduce((acc, item) => {
    acc[item.key] = entries.reduce((sum, entry) => sum + entry[item.key], 0)
    return acc
  }, {} as LaundryItemQuantities)
  
  const grandTotal = entries.reduce((sum, entry) => sum + entry.total, 0)

  return (
    <PageLayout title="All Entries" showBackButton={true} customBackPath="/dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-gray-600 text-sm">
                {selectedCustomerName 
                  ? `Showing ALL entries for ${selectedCustomerName} (no date restriction)`
                  : 'View and manage all laundry entries'
                }
              </p>
            </div>
            <div className="flex space-x-3">
              {entries.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  📥 Export CSV
                </button>
              )}
              <button
                onClick={() => router.push('/entries/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                + New Entry
              </button>
              <button
                onClick={() => router.push('/customers')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors text-sm"
              >
                Manage Customers
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            {selectedCustomerId && (
              <button
                onClick={removeCustomerFilter}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ✕ Remove Customer Filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Customer Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  const newCustomerId = e.target.value
                  setSelectedCustomerId(newCustomerId)
                  const customer = customers.find(c => c.id === newCustomerId)
                  setSelectedCustomerName(customer?.name || '')
                  if (newCustomerId) {
                    router.push(`/entries?customer=${newCustomerId}`)
                  } else {
                    router.push('/entries')
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
              >
                <option value="">All Customers</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {selectedCustomerId && (
                <p className="text-xs text-blue-600 mt-1">Showing all entries for this customer</p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                From Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                To Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
              />
            </div>

            {/* Correction Filter */}
            <div className="flex items-end">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCorrectionsOnly}
                  onChange={(e) => setShowCorrectionsOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show corrections only</span>
              </label>
            </div>
          </div>

          {/* Filter Actions */}
          {(selectedCustomerId || startDate || endDate || showCorrectionsOnly) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:underline"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {entries.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{entries.length}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>

            {LAUNDRY_ITEMS.map(item => (
              <div
                key={item.key}
                className="bg-white rounded-xl border border-gray-200 p-4 text-center"
              >
                <div className="text-2xl font-bold text-blue-600">
                  {itemTotals[item.key]}
                </div>
                <div className="text-sm text-gray-600">{item.shortLabel}</div>
              </div>
            ))}

            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{grandTotal}</div>
              <div className="text-sm text-blue-700">Total Items</div>
            </div>
          </div>
        )}

        {/* Entries Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-700 font-medium">No entries found</p>
              <p className="text-gray-500 text-sm mt-2">
                {selectedCustomerName 
                  ? `No entries found for ${selectedCustomerName}`
                  : 'Try adjusting your filters or add a new entry'
                }
              </p>
              <button
                onClick={() => router.push('/entries/new')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Entry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">Date</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">Customer</th>
                    {LAUNDRY_ITEMS.map(item => (
                      <th
                        key={item.key}
                        className="py-3 px-4 text-right font-semibold text-gray-900"
                      >
                        {item.shortLabel}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right font-semibold text-gray-900">Total</th>
                    <th className="py-3 px-4 text-center font-semibold text-gray-900">Type</th>
                    <th className="py-3 px-4 text-center font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">
                        {formatDate(entry.entry_date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {entry.customer_name}
                      </td>
                      {LAUNDRY_ITEMS.map(item => (
                        <td key={item.key} className="py-3 px-4 text-right text-gray-700">
                          {entry[item.key]}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{entry.total}</td>
                      <td className="py-3 px-4 text-center">
                        {entry.is_correction ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Corrected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Original
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => router.push(`/entries/${entry.id}/correct`)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Correct
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-gray-900">Totals</td>
                    <td className="py-3 px-4"></td>
                    {LAUNDRY_ITEMS.map(item => (
                      <td
                        key={item.key}
                        className="py-3 px-4 text-right font-semibold text-blue-600"
                      >
                        {itemTotals[item.key]}
                      </td>
                    ))}

                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {grandTotal}
                    </td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
        {/* Pagination */}
        {totalCount > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
            </div>
            
            <div className="flex items-center gap-4">
              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1) // Reset to first page when changing page size
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white text-sm"
                >
                  {PAGE_SIZE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Pagination Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  « First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ‹ Previous
                </button>
                
                <span className="px-4 py-1 text-sm text-gray-700">
                  Page {currentPage} of {totalPages || 1}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next ›
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Last »
                </button>
              </div>
            </div>
          </div>
        )}
    </PageLayout>
  )
}

// Main page component with Suspense boundary
export default function EntriesPage() {
  return (
    <Suspense fallback={<EntriesLoading />}>
      <EntriesContent />
    </Suspense>
  )
}