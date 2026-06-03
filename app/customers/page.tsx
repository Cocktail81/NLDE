'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import PageLayout from '@/components/layout/PageLayout'

interface Customer {
  id: string
  name: string
  created_at: string
  created_by: string | null
  is_active: boolean
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userRole, setUserRole] = useState<'admin' | 'operator'>('operator')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [addingCustomer, setAddingCustomer] = useState(false)
   const [previousSearchTerm, setPreviousSearchTerm] = useState('')
  
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const PAGE_SIZE_OPTIONS = [20, 50, 100]
  
  const checkAuth = useCallback(async () => {
  const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return null
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    setUserRole(profile?.role || 'operator')
    return session
  }, [router])

    // Fetch customers with current filters
    const fetchCustomers = useCallback(async () => {
    setLoading(true)
    
    // Determine if we need to reset page due to search change
    let effectivePage = currentPage
    if (searchTerm !== previousSearchTerm) {
      effectivePage = 1
    }
    
    // Build count query with search filter
    let countQuery = supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (searchTerm) {
      countQuery = countQuery.ilike('name', `%${searchTerm}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error fetching count:', countError)
    } else {
      setTotalCount(count || 0)
    }

    // Build data query with search filter
    let dataQuery = supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range((effectivePage - 1) * pageSize, effectivePage * pageSize - 1)

    if (searchTerm) {
      dataQuery = dataQuery.ilike('name', `%${searchTerm}%`)
    }

    const { data, error } = await dataQuery

    if (!error && data) {
      setCustomers(data)
    }
    
    // Update previous search term after fetch
    if (searchTerm !== previousSearchTerm) {
      setPreviousSearchTerm(searchTerm)
      if (effectivePage !== currentPage) {
        setCurrentPage(1)
      }
    }
    
    setLoading(false)
  }, [currentPage, pageSize, searchTerm, previousSearchTerm])

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomerName.trim()) return

    setAddingCustomer(true)
    const { data: { session } } = await supabase.auth.getSession()
    
    const { error } = await supabase
      .from('customers')
      .insert([
        {
          name: newCustomerName.trim(),
          created_by: session?.user?.id
        }
      ])

    if (!error) {
      setNewCustomerName('')
      setShowAddModal(false)
      setCurrentPage(1) // Reset to first page after adding
      await fetchCustomers()
    } else {
      alert(`Error adding customer: ${error.message}`)
    }
    setAddingCustomer(false)
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (userRole !== 'admin') {
      alert('Only admin can delete customers')
      return
    }

    if (!confirm('Are you sure you want to delete this customer? This will hide them from dropdowns.')) {
      return
    }

    const { error } = await supabase
      .from('customers')
      .update({ is_active: false })
      .eq('id', customerId)

    if (!error) {
      await fetchCustomers()
    } else {
      alert(`Error deleting customer: ${error.message}`)
    }
  } 

    // Initial load and filter changes
  useEffect(() => {
    const loadCustomers = async () => {
      const session = await checkAuth()
      if (session) {
        await fetchCustomers()
      }
    }
    loadCustomers()
  }, [checkAuth, fetchCustomers])

  return (
    <PageLayout title="Customers" showBackButton={true} customBackPath="/dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-gray-600 text-sm mt-1">Manage your customer list</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              + Add New Customer
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="mb-6">
          <div className="bg-white rounded-xl border p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Customer Overview</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Total active customers: <span className="font-bold text-gray-900">{totalCount}</span>
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
              </div>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-gray-700 font-medium">No customers found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm ? 'Try a different search term' : 'Add your first customer to get started'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Customer
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Customer Name</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Created Date</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{customer.name}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(customer.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              // console.log('Navigating to entries for customer:', customer.id, customer.name)
                              router.push(`/entries?customer=${customer.id}`)
                            }}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            View Entries
                          </button>
                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} customers
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
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
                  Page {currentPage} of {Math.ceil(totalCount / pageSize) || 1}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCount / pageSize)))}
                  disabled={currentPage === Math.ceil(totalCount / pageSize) || totalCount === 0}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next ›
                </button>
                <button
                  onClick={() => setCurrentPage(Math.ceil(totalCount / pageSize))}
                  disabled={currentPage === Math.ceil(totalCount / pageSize) || totalCount === 0}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Last »
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Customer</h2>
              <form onSubmit={handleAddCustomer}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                    required
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Customer names must be unique
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={addingCustomer}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingCustomer || !newCustomerName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingCustomer ? 'Adding...' : 'Add Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}