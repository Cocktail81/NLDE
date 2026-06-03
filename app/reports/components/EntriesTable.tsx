import { LAUNDRY_ITEMS } from '@/lib/laundry-items'
import { Entry } from '../types'

interface EntriesTableProps {
  entries: Entry[]
  showCustomer?: boolean
}

export default function EntriesTable({
  entries,
  showCustomer = true,
}: EntriesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm print:text-[8pt]">
        <thead className="bg-gray-50 print:bg-gray-100">
          <tr>
            {showCustomer && (
              <th className="py-2 px-3 text-left font-semibold">
                Customer
              </th>
            )}

            <th className="py-2 px-3 text-left font-semibold w-[100px]">
              Date
            </th>

            {LAUNDRY_ITEMS.map(item => (
              <th
                key={item.key}
                className="py-2 px-3 text-right font-semibold min-w-[70px]"
              >
                {item.shortLabel}
              </th>
            ))}

            <th className="py-2 px-3 text-right font-semibold w-[70px]">
              Total
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {entries.map(entry => (
            <tr key={entry.id} className="hover:bg-gray-50">
              {showCustomer && (
                <td className="py-2 px-3 font-medium truncate max-w-[150px]">
                  {entry.customer_name}
                </td>
              )}

              <td className="py-2 px-3 whitespace-nowrap">
                {new Date(entry.entry_date).toLocaleDateString()}
              </td>

              {LAUNDRY_ITEMS.map(item => (
                <td key={item.key} className="py-2 px-3 text-right">
                  {entry[item.key]}
                </td>
              ))}

              <td className="py-2 px-3 text-right font-semibold">
                {entry.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}