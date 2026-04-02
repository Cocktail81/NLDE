'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// import { supabase } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'


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

  useEffect(() => {
    checkAuth()
    fetchCustomers()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    // Get user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    setUserRole(profile?.role || 'operator')
  }

  const fetchCustomers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (!error && data) {
      setCustomers(data)
    }
    setLoading(false)
  }

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
      fetchCustomers() // Refresh list
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
      fetchCustomers() // Refresh list
    } else {
      alert(`Error deleting customer: ${error.message}`)
    }
  }

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <Navigation showBack backUrl="/dashboard" title="Customers" />
        {/* Header */}        
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600 mt-1">Manage your customer list</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
                  Total active customers: <span className="font-bold text-gray-900">{customers.length}</span>
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
        <div className="bg-white rounded-xl border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
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
                  {filteredCustomers.map((customer) => (
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
                            onClick={() => router.push(`/entries?customer=${customer.id}`)}
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

        {/* Pagination/Info */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
          <div>
            Showing {filteredCustomers.length} of {customers.length} customers
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
          <div className="mt-2 sm:mt-0">
            {userRole === 'admin' && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                Admin: Can delete customers
              </span>
            )}
          </div>
        </div>

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
    </div>
  )
}