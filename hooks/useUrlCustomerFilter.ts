import { useEffect, useRef } from 'react'

export function useUrlCustomerFilter(
  customerIdParam: string | null,
  customers: { id: string; name: string }[],
  setSelectedCustomerId: (id: string) => void,
  setSelectedCustomerName: (name: string) => void
) {
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (hasInitialized.current) return
    if (customerIdParam && customers.length > 0) {
      const customerExists = customers.find(c => c.id === customerIdParam)
      if (customerExists) {
        setSelectedCustomerId(customerIdParam)
        setSelectedCustomerName(customerExists.name)
        hasInitialized.current = true
      }
    }
  }, [customerIdParam, customers, setSelectedCustomerId, setSelectedCustomerName])
}