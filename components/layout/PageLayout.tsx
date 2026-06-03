'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import AppHeader from './AppHeader'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
  showHomeButton?: boolean
  showSignOut?: boolean
  showNavLinks?: boolean
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
  showNavLinks = true,
  onBackClick,
  customBackPath,
  className = ''
}: PageLayoutProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('operator')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single()
      
      setUserRole(profile?.role || 'operator')
      setUserName(profile?.full_name || session.user.email?.split('@')[0] || 'User')
      setLoading(false)
    }

    fetchUserInfo()
  }, [router])  // router is stable, won't cause re-runs

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        title={title}
        showBackButton={showBackButton}
        showHomeButton={showHomeButton}
        showSignOut={showSignOut}
        showNavLinks={showNavLinks}
        userRole={userRole}
        userName={userName}
        onBackClick={onBackClick}
        customBackPath={customBackPath}
      />
      <main className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
        {children}
      </main>
    </div>
  )
}