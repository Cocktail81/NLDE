'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Customer {
  id: string
  name: string
}

interface CustomerAutocompleteProps {
  value: string
  onChange: (customer: Customer | null) => void
  disabled?: boolean
}

export default function CustomerAutocomplete({ value, onChange, disabled = false }: CustomerAutocompleteProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (!error && data) {
      setCustomers(data)
    }
    setLoading(false)
  }, [])

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
      setShowDropdown(false)
    }
  }, [])

  // Initial load - fetch customers
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers()
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [fetchCustomers, handleClickOutside])

  // Filter customers based on search input
  useEffect(() => {
    if (search) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(search.toLowerCase())
      )
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilteredCustomers(filtered)
      setShowDropdown(true)
    } else {
      setFilteredCustomers([])
      setShowDropdown(false)
    }
  }, [search, customers])

  // Sync with parent value
  useEffect(() => {
    if (value && !selectedCustomer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch(value)
    }
  }, [value, selectedCustomer])

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSearch(customer.name)
    onChange(customer)
    setShowDropdown(false)
  }

  const handleClear = () => {
    setSelectedCustomer(null)
    setSearch('')
    onChange(null)
    setShowDropdown(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    if (e.target.value === '') {
      handleClear()
    }
  }

  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Type to search customers..."
          disabled={disabled}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50 text-gray-800 placeholder-gray-500"
        />
        
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            disabled={disabled}
          >
            ✕
          </button>
        )}
        
        {!search && !disabled && (
          <div className="absolute right-3 top-3 text-gray-400">
            ▼
          </div>
        )}
      </div>

      {showDropdown && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 && search ? (
            <div className="p-4">
              <div className="text-gray-500 mb-2">No customer found for "{search}"</div>
              <div className="text-sm text-gray-400">
                Customer will need to be added separately first
              </div>
            </div>
          ) : (
            <div>
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center"
                >
                  <span className="font-medium text-gray-900 flex-1">{customer.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Select
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}