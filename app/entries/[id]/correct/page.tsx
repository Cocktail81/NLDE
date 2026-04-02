'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import CustomerAutocomplete from '@/components/CustomerAutocomplete'

interface Customer {
  id: string
  name: string
}

interface OriginalEntry {
  id: string
  entry_date: string
  customer_id: string
  customer_name: string
  ironing: number
  saree_ironing: number
  dry_cleaning: number
  total_items: number
}

export default function CorrectEntryPage() {
  const router = useRouter()
  const params = useParams()
  const entryId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [originalEntry, setOriginalEntry] = useState<OriginalEntry | null>(null)
  
  // Form state
  const [date, setDate] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [ironing, setIroning] = useState('')
  const [sareeIroning, setSareeIroning] = useState('')
  const [dryCleaning, setDryCleaning] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')
  
  // For adding new customer
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [addingCustomer, setAddingCustomer] = useState(false)

  useEffect(() => {
    fetchOriginalEntry()
  }, [entryId])

  const fetchOriginalEntry = async () => {
    setFetching(true)
    
    // Fetch the entry
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', entryId)
      .single()

    if (entryError || !entry) {
      setError('Entry not found')
      setFetching(false)
      return
    }

    // Fetch customer name
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', entry.customer_id)
      .single()

    setOriginalEntry({
      id: entry.id,
      entry_date: entry.entry_date,
      customer_id: entry.customer_id,
      customer_name: customer?.name || 'Unknown',
      ironing: entry.ironing || 0,
      saree_ironing: entry.saree_ironing || 0,
      dry_cleaning: entry.dry_cleaning || 0,
      total_items: (entry.ironing || 0) + (entry.saree_ironing || 0) + (entry.dry_cleaning || 0)
    })

    // Pre-fill form with original values
    setDate(entry.entry_date)
    setSelectedCustomer({ id: entry.customer_id, name: customer?.name || 'Unknown' })
    setIroning(String(entry.ironing || 0))
    setSareeIroning(String(entry.saree_ironing || 0))
    setDryCleaning(String(entry.dry_cleaning || 0))
    
    setFetching(false)
  }

  const handleAddCustomer = async (e: FormEvent) => {
    e.preventDefault()
    if (!newCustomerName.trim()) return

    setAddingCustomer(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('customers')
      .insert([
        {
          name: newCustomerName.trim(),
          created_by: user?.id
        }
      ])
      .select()
      .single()

    if (!error && data) {
      setSelectedCustomer({ id: data.id, name: data.name })
      setNewCustomerName('')
      setShowAddCustomerModal(false)
    } else {
      alert(`Error adding customer: ${error?.message || 'Unknown error'}`)
    }
    setAddingCustomer(false)
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

    if (!correctionReason.trim()) {
      setError('Please provide a reason for correction')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Create new correction entry
      const correctionData = {
        entry_date: date,
        customer_id: selectedCustomer.id,
        ironing: parseInt(ironing) || 0,
        saree_ironing: parseInt(sareeIroning) || 0,
        dry_cleaning: parseInt(dryCleaning) || 0,
        created_by: user?.id,
        is_current_version: true,
        is_correction: true,
        previous_version_id: entryId,
        correction_reason: correctionReason.trim()
      }

      const { error: insertError } = await supabase
        .from('entries')
        .insert([correctionData])

      if (insertError) {
        throw insertError
      }

      // Mark original entry as not current (handled by database trigger)
      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/entries')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to save correction')
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

  const hasChanges = () => {
    if (!originalEntry) return false
    return (
      date !== originalEntry.entry_date ||
      selectedCustomer?.id !== originalEntry.customer_id ||
      parseInt(ironing) !== originalEntry.ironing ||
      parseInt(sareeIroning) !== originalEntry.saree_ironing ||
      parseInt(dryCleaning) !== originalEntry.dry_cleaning
    )
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading entry...</p>
        </div>
      </div>
    )
  }

  if (error && !originalEntry) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <Navigation showBack backUrl="/entries" title="Error" />
          <div className="bg-white rounded-xl border p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => router.push('/entries')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Entries
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <Navigation showBack backUrl="/entries" title="Correct Entry" />
        
        {/* Original Entry Summary */}
        {originalEntry && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h3 className="font-semibold text-yellow-800 mb-2">Original Entry</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-yellow-600">Date</p>
                <p className="font-medium text-gray-800">{new Date(originalEntry.entry_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-yellow-600">Customer</p>
                <p className="font-medium text-gray-800">{originalEntry.customer_name}</p>
              </div>
              <div>
                <p className="text-yellow-600">Ironing</p>
                <p className="font-medium text-gray-800">{originalEntry.ironing}</p>
              </div>
              <div>
                <p className="text-yellow-600">Saree</p>
                <p className="font-medium text-gray-800">{originalEntry.saree_ironing}</p>
              </div>
              <div>
                <p className="text-yellow-600">Dry Clean</p>
                <p className="font-medium text-gray-800">{originalEntry.dry_cleaning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <p className="font-medium text-green-800">Correction saved successfully!</p>
                <p className="text-green-600 text-sm mt-1">Redirecting to entries list...</p>
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

        {/* Correction Form */}
        <div className="bg-white rounded-xl border p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Correction Reason - Required */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Reason for Correction *
                </label>
                <textarea
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Describe why you're correcting this entry..."
                  required
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                />
                <p className="text-sm text-gray-500 mt-2">
                  This reason will be recorded in the change history report
                </p>
              </div>

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
              </div>

              {/* Service Fields */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-4">
                  Service Quantities
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ironing
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={ironing}
                      onChange={(e) => setIroning(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saree Ironing
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={sareeIroning}
                      onChange={(e) => setSareeIroning(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dry Cleaning
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={dryCleaning}
                      onChange={(e) => setDryCleaning(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-4">Corrected Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-gray-900">{parseInt(ironing) || 0}</div>
                    <div className="text-sm text-gray-600">Ironing</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-gray-900">{parseInt(sareeIroning) || 0}</div>
                    <div className="text-sm text-gray-600">Saree</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-gray-900">{parseInt(dryCleaning) || 0}</div>
                    <div className="text-sm text-gray-600">Dry Clean</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-blue-300 bg-blue-100 col-span-2">
                    <div className="text-2xl font-bold text-blue-700">{calculateTotal()}</div>
                    <div className="text-sm text-blue-600">Total Items</div>
                  </div>
                </div>
              </div>

              {/* Warning if no changes */}
              {!hasChanges() && correctionReason && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No changes detected. You're creating a correction with the same values.
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200 gap-4">
                <div className="text-sm text-gray-600">
                  {selectedCustomer && date && (
                    <p>
                      Creating correction for <span className="font-semibold">{selectedCustomer.name}</span> on{' '}
                      <span className="font-semibold">{new Date(date).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push('/entries')}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedCustomer || !date || !correctionReason.trim()}
                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Saving Correction...
                      </span>
                    ) : (
                      'Save Correction'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gray-50 p-6 rounded-xl border">
          <h3 className="font-semibold text-gray-800 mb-3">ℹ️ About Corrections</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• A new version of the entry will be created with your changes</li>
            <li>• The original entry will be marked as superseded</li>
            <li>• Only the latest version appears in reports and totals</li>
            <li>• All corrections are tracked in the Change History report</li>
            <li>• You can correct an entry multiple times if needed</li>
          </ul>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {addingCustomer ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}