'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    allowedRoles: ['admin', 'operator'],
  },
  {
    name: 'Entries',
    href: '/entries',
    allowedRoles: ['admin', 'operator'],
  },
  {
    name: 'Customers',
    href: '/customers',
    allowedRoles: ['admin', 'operator'],
  },
  {
    name: 'Reports',
    href: '/reports',
    allowedRoles: ['admin', 'operator'],
  },
  // {
  //   name: 'Users',
  //   href: '/users',
  //   allowedRoles: ['admin'], // Admin only
  // },
]

interface DashboardNavProps {
  role: string
}

export default function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname()

  const filteredNavItems = navItems.filter(item => 
    item.allowedRoles.includes(role)
  )

  return (
    <nav className="ml-10 flex items-center space-x-4">
      {filteredNavItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/dashboard' && pathname?.startsWith(item.href))

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}