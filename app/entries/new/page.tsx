'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CustomerAutocomplete from '@/components/CustomerAutocomplete'
import PageLayout from '@/components/layout/PageLayout'

interface Customer {
  id: string
  name: string
}

export default function NewEntryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [ironing, setIroning] = useState('0')
  const [sareeIroning, setSareeIroning] = useState('0')
  const [dryCleaning, setDryCleaning] = useState('0')
  
  // For adding new customer on the fly
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [addingCustomer, setAddingCustomer] = useState(false)

  useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }
  }

  checkAuth()
}, [router])

  const handleAddCustomer = async (e: FormEvent) => {
    e.preventDefault()
    if (!newCustomerName.trim()) return

    setAddingCustomer(true)
    const { data: { session } } = await supabase.auth.getSession()
    
    const { data, error: insertError } = await supabase
      .from('customers')
      .insert([
        {
          name: newCustomerName.trim(),
          created_by: session?.user?.id
        }
      ])
      .select()
      .single()

    if (!insertError && data) {
      setSelectedCustomer({ id: data.id, name: data.name })
      setNewCustomerName('')
      setShowAddCustomerModal(false)
    } else {
      window.alert(`Error adding customer: ${insertError?.message || 'Unknown error'}`)
    }
    setAddingCustomer(false)
  }

  const checkDuplicate = async (): Promise<boolean> => {
    if (!selectedCustomer || !date) return false

    const { data, error: dupError } = await supabase
      .from('entries')
      .select('id')
      .eq('customer_id', selectedCustomer.id)
      .eq('entry_date', date)
      .eq('is_current_version', true)
      .limit(1)

    if (dupError) {
      console.error('Error checking duplicate:', dupError)
      return false
    }

    return data && data.length > 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validate form
    if (!selectedCustomer) {
      setError('Please select a customer')
      return
    }

    if (!date) {
      setError('Please select a date')
      return
    }

    // Check for duplicate
    const hasDuplicate = await checkDuplicate()
    if (hasDuplicate) {
      const proceed = window.confirm(
        `An entry already exists for ${selectedCustomer.name} on ${date}.\n\n` +
        `Do you want to create this as a correction? (Will create new version)`
      )
      if (!proceed) return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const entryData = {
        entry_date: date,
        customer_id: selectedCustomer.id,
        ironing: parseInt(ironing) || 0,
        saree_ironing: parseInt(sareeIroning) || 0,
        dry_cleaning: parseInt(dryCleaning) || 0,
        created_by: session?.user?.id,
        is_current_version: true,
        is_correction: hasDuplicate,
        correction_reason: hasDuplicate ? 'New entry created for same date' : null
      }

      const { error: submitError } = await supabase
        .from('entries')
        .insert([entryData])

      if (submitError) {
        throw submitError
      }

      // Reset all form fields
      setDate(new Date().toISOString().split('T')[0])  // Reset to today's date
      setSelectedCustomer(null)                        // Clear customer selection
      setIroning('0')                                  // Reset to 0
      setSareeIroning('0')                             // Reset to 0
      setDryCleaning('0')                              // Reset to 0
      
      // Show success message
      setSuccess(true)
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save entry'
      setError(errorMessage)
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setError(null)
      }, 5000)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    const iron = parseInt(ironing) || 0
    const saree = parseInt(sareeIroning) || 0
    const dry = parseInt(dryCleaning) || 0
    return iron + saree + dry
  }

  return (
    <PageLayout 
      title="New Entry" 
      showBackButton={true} 
      customBackPath="/entries"
    >
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <p className="font-medium text-green-800">Entry saved successfully!</p>
                <p className="text-green-600 text-sm mt-1">Ready for next entry</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <span className="text-2xl mr-3">❌</span>
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl border p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Date Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full sm:w-64 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Default: Today&apos;s date. Can select any past or future date.
                </p>
              </div>

              {/* Customer Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Customer *
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <CustomerAutocomplete
                      value={selectedCustomer?.name || ''}
                      onChange={setSelectedCustomer}
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    + Add New Customer
                  </button>
                </div>
                {selectedCustomer && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: <span className="font-semibold">{selectedCustomer.name}</span>
                  </p>
                )}
              </div>

              {/* Service Fields */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-4">
                  Service Quantities
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Ironing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ironing
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={ironing}
                        onChange={(e) => setIroning(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                        placeholder="0"
                      />
                      <div className="absolute right-3 top-3 text-gray-500">
                        items
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Regular clothes ironing</p>
                  </div>

                  {/* Saree Ironing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saree Ironing
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={sareeIroning}
                        onChange={(e) => setSareeIroning(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                        placeholder="0"
                      />
                      <div className="absolute right-3 top-3 text-gray-500">
                        items
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Saree-specific ironing</p>
                  </div>

                  {/* Dry Cleaning */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dry Cleaning
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={dryCleaning}
                        onChange={(e) => setDryCleaning(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                        placeholder="0"
                      />
                      <div className="absolute right-3 top-3 text-gray-500">
                        items
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Dry cleaning service</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-4">Entry Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-gray-900">{parseInt(ironing) || 0}</div>
                    <div className="text-sm text-gray-600">Ironing</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-gray-900">{parseInt(sareeIroning) || 0}</div>
                    <div className="text-sm text-gray-600">Saree Ironing</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-gray-900">{parseInt(dryCleaning) || 0}</div>
                    <div className="text-sm text-gray-600">Dry Cleaning</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-blue-300 bg-blue-100">
                    <div className="text-2xl font-bold text-blue-700">{calculateTotal()}</div>
                    <div className="text-sm text-blue-600">Total Items</div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200 gap-4">
                <div className="text-sm text-gray-600">
                  {selectedCustomer && date && (
                    <p>
                      Creating entry for <span className="font-semibold">{selectedCustomer.name}</span> on{' '}
                      <span className="font-semibold">{new Date(date).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedCustomer || !date}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Saving...
                      </span>
                    ) : (
                      'Save Entry'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-50 p-6 rounded-xl border">
          <h3 className="font-semibold text-gray-800 mb-3">📝 How to use this form:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>1. <span className="font-medium">Select date</span> - Defaults to today, can change to any date</li>
            <li>2. <span className="font-medium">Choose customer</span> - Search existing or add new on the fly</li>
            <li>3. <span className="font-medium">Enter quantities</span> - For each service type (default 0)</li>
            <li>4. <span className="font-medium">Review summary</span> - Check total items before saving</li>
            <li>5. <span className="font-medium">Save</span> - Entry will be saved and appear in entries list</li>
          </ul>
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Note:</span> If an entry already exists for the same customer and date, 
              you&apos;ll be asked if you want to create a correction (new version).
            </p>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
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
                  Customer will be available immediately for selection
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
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
    </PageLayout>
  )
}