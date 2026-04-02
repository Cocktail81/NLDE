'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'

interface NavigationProps {
  showBack?: boolean
  backUrl?: string
  title?: string
}

export default function Navigation({ showBack = false, backUrl = '/dashboard', title }: NavigationProps) {
  const router = useRouter()

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Home Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go to Dashboard"
          >
            <Home className="h-5 w-5" />
            <span className="hidden sm:inline text-sm font-medium">Home</span>
          </button>

          {/* Back Button */}
          {showBack && (
            <button
              onClick={() => router.push(backUrl)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Back</span>
            </button>
          )}
        </div>

        {/* Page Title (optional) */}
        {title && (
          <div className="text-sm text-gray-500 hidden sm:block">
            {title}
          </div>
        )}
      </div>
    </div>
  )
}