'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  backUrl?: string
  actions?: React.ReactNode
}

export default function PageHeader({ 
  title, 
  subtitle, 
  showBackButton = true, 
  backUrl = '/dashboard',
  actions 
}: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-8">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={() => router.push(backUrl)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Home"
          >
            <Home className="h-5 w-5" />
            <span className="hidden sm:inline">Home</span>
          </button>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}