'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface Entry {
  id: string
  entry_date: string
  customer_name: string
  ironing: number
  saree_ironing: number
  dry_cleaning: number
  total: number
  is_correction: boolean
  correction_reason: string | null
  created_at: string
}

interface Customer {
  id: string
  name: string
}

// Loading fallback component
function EntriesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading entries...</p>
        </div>
      </div>
    </div>
  )
}

// Main component that uses useSearchParams
function EntriesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerIdParam = searchParams.get('customer')
  
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<Entry[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showCorrectionsOnly, setShowCorrectionsOnly] = useState(false)
  const [selectedCustomerName, setSelectedCustomerName] = useState('')

  // Initial load - check auth and fetch data
  useEffect(() => {
    checkAuth()
    fetchCustomers()
  }, [])

  // Fetch entries when filters change
  useEffect(() => {
    // Skip on initial mount, let fetchEntries be called after auth check
    if (!loading) {
      fetchEntries()
    }
  }, [selectedCustomerId, startDate, endDate, showCorrectionsOnly])

  // Handle customer filter from URL after customers are loaded
  useEffect(() => {
    if (customerIdParam && customers.length > 0 && !selectedCustomerId) {
      const customerExists = customers.find(c => c.id === customerIdParam)
      if (customerExists) {
        setSelectedCustomerId(customerIdParam)
        setSelectedCustomerName(customerExists.name)
        // Force fetch after setting filter
        setTimeout(() => fetchEntries(), 100)
      }
    }
  }, [customerIdParam, customers])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    // After auth check, fetch entries
    await fetchEntries()
    setLoading(false)
  }

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    
    if (data) {
      setCustomers(data)
    }
  }

  const fetchEntries = async () => {
    console.log('Fetching entries with filters:', {
      selectedCustomerId,
      startDate,
      endDate,
      showCorrectionsOnly
    })
    
    let query = supabase
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
        created_at,
        customers!entries_customer_id_fkey (name, is_active)
      `)
      .eq('is_current_version', true)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply customer filter
    if (selectedCustomerId && selectedCustomerId !== '') {
      query = query.eq('customer_id', selectedCustomerId)
    }

    // Apply date range filter
    if (startDate && endDate) {
      query = query.gte('entry_date', startDate).lte('entry_date', endDate)
    } else if (startDate) {
      query = query.gte('entry_date', startDate)
    } else if (endDate) {
      query = query.lte('entry_date', endDate)
    }

    // Apply correction filter
    if (showCorrectionsOnly) {
      query = query.eq('is_correction', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching entries:', error)
      setEntries([])
    } else if (data) {
      console.log('Entries found:', data.length)
      const formattedEntries: Entry[] = data.map((entry: any) => ({
        id: entry.id,
        entry_date: entry.entry_date,
        customer_name: entry.customers?.name || 'Unknown',
        ironing: entry.ironing || 0,
        saree_ironing: entry.saree_ironing || 0,
        dry_cleaning: entry.dry_cleaning || 0,
        total: (entry.ironing || 0) + (entry.saree_ironing || 0) + (entry.dry_cleaning || 0),
        is_correction: entry.is_correction || false,
        correction_reason: entry.correction_reason,
        created_at: entry.created_at
      }))
      setEntries(formattedEntries)
    }
  }

  const exportToCSV = () => {
    if (entries.length === 0) return

    const headers = ['Date', 'Customer', 'Ironing', 'Saree Ironing', 'Dry Cleaning', 'Total', 'Type']
    const csvRows = [headers.join(',')]

    for (const entry of entries) {
      const row = [
        formatDate(entry.entry_date),
        `"${entry.customer_name}"`,
        entry.ironing,
        entry.saree_ironing,
        entry.dry_cleaning,
        entry.total,
        entry.is_correction ? 'Corrected' : 'Original'
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
  const totals = entries.reduce((acc, entry) => ({
    ironing: acc.ironing + entry.ironing,
    sareeIroning: acc.sareeIroning + entry.saree_ironing,
    dryCleaning: acc.dryCleaning + entry.dry_cleaning,
    total: acc.total + entry.total
  }), { ironing: 0, sareeIroning: 0, dryCleaning: 0, total: 0 })

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <Navigation showBack backUrl="/dashboard" title="All Entries" />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-gray-600 mt-1">
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
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  📥 Export CSV
                </button>
              )}
              <button
                onClick={() => router.push('/entries/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + New Entry
              </button>
              <button
                onClick={() => router.push('/customers')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{entries.length}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totals.ironing}</div>
              <div className="text-sm text-gray-600">Ironing</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{totals.sareeIroning}</div>
              <div className="text-sm text-gray-600">Saree Ironing</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{totals.dryCleaning}</div>
              <div className="text-sm text-gray-600">Dry Cleaning</div>
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
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">Ironing</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">Saree Ironing</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">Dry Cleaning</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">Total</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">Type</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">Actions</th>
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
                      <td className="py-3 px-4 text-gray-700">{entry.ironing}</td>
                      <td className="py-3 px-4 text-gray-700">{entry.saree_ironing}</td>
                      <td className="py-3 px-4 text-gray-700">{entry.dry_cleaning}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{entry.total}</td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
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
                    <td className="py-3 px-4 font-semibold text-blue-600">{totals.ironing}</td>
                    <td className="py-3 px-4 font-semibold text-green-600">{totals.sareeIroning}</td>
                    <td className="py-3 px-4 font-semibold text-purple-600">{totals.dryCleaning}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{totals.total}</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
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