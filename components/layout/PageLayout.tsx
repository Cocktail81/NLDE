import { ReactNode } from 'react'
import AppHeader from './AppHeader'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
  showHomeButton?: boolean
  showSignOut?: boolean
  onBackClick?: () => void
  customBackPath?: string
  className?: string
}

export default function PageLayout({
  children,
  title = 'Nandlal Laundry',
  showBackButton = false,
  showHomeButton = true,
  showSignOut = true,
  onBackClick,
  customBackPath,
  className = ''
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        title={title}
        showBackButton={showBackButton}
        showHomeButton={showHomeButton}
        showSignOut={showSignOut}
        onBackClick={onBackClick}
        customBackPath={customBackPath}
      />
      <main className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
        {children}
      </main>
    </div>
  )
}