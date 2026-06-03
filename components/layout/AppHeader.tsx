'use client'

import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

interface AppHeaderProps {
  title?: string
  showBackButton?: boolean
  showHomeButton?: boolean
  showSignOut?: boolean
  showNavLinks?: boolean
  userRole?: string
  userName?: string
  onBackClick?: () => void
  customBackPath?: string
}

export default function AppHeader({
  title = 'Nandlal Laundry',
  showBackButton = false,
  showHomeButton = true,
  showSignOut = true,
  showNavLinks = true,
  userRole = 'operator',
  userName = '',  // Directly from parent (PageLayout)
  onBackClick,
  customBackPath
}: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const displayName = userName

  // Navigation links configuration
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', allowedRoles: ['admin', 'operator'] },
    { href: '/entries', label: 'Entries', allowedRoles: ['admin', 'operator'] },
    { href: '/customers', label: 'Customers', allowedRoles: ['admin', 'operator'] },
    { href: '/reports', label: 'Reports', allowedRoles: ['admin', 'operator'] },
  ]

  const filteredNavLinks = navLinks.filter(link => 
    link.allowedRoles.includes(userRole)
  )

  const handleBack = () => {
    if (onBackClick) {
      onBackClick()
    } else if (customBackPath) {
      router.push(customBackPath)
    } else {
      router.back()
    }
  }

  const handleHome = () => {
    router.push('/dashboard')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Determine if we should show back button based on path
  const shouldShowBack = showBackButton || pathname !== '/dashboard'
  const shouldShowHome = showHomeButton && pathname !== '/dashboard'
  const shouldShowSignOutButton = showSignOut && pathname !== '/login'

  return (   
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-3">
            {/* Logo and title */}
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <span className="text-lg font-bold">NL</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h1>
            </div>

            {/* Back Button */}
            {shouldShowBack && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            {/* Home Button */}
            {shouldShowHome && (
              <button
                onClick={handleHome}
                className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go to dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:inline">Home</span>
              </button>
            )}
            
            {/* Desktop Navigation Links */}
            {showNavLinks && (
              <div className="hidden md:flex items-center space-x-1 ml-4">
                {filteredNavLinks.map((link) => {
                  const isActive = pathname === link.href || 
                    (link.href !== '/dashboard' && pathname?.startsWith(link.href))
                  return (
                    <button
                      key={link.href}
                      onClick={() => router.push(link.href)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {link.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {/* User info */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-800">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>

            {/* User Avatar (mobile) */}
            <div className="sm:hidden">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Sign Out Button */}
            {shouldShowSignOutButton && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Sign out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && showNavLinks && (
          <div className="md:hidden py-3 border-t border-gray-200">
            {filteredNavLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <button
                  key={link.href}
                  onClick={() => {
                    router.push(link.href)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </header>
  )
}