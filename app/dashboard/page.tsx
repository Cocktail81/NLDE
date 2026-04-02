'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/layout/PageLayout'
import Navigation from '@/components/Navigation'

interface RecentEntry {
  id: string
  entry_date: string
  customer_name: string
  ironing: number
  saree_ironing: number
  dry_cleaning: number
  total: number
  is_correction: boolean
}

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  showHomeButton?: boolean
  backUrl?: string
}




export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    todayEntries: 0,
    totalCustomers: 0,
  })
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchStats()
    fetchRecentEntries()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }
    
    setUser(session.user)
    
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('id', session.user.id)
      .single()
    
    setProfile(profileData)
  }

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0]
    
    const { count: todayEntries } = await supabase
      .from('entries')
      .select('*', { count: 'exact', head: true })
      .eq('entry_date', today)
      .eq('is_current_version', true)

    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    setStats({
      todayEntries: todayEntries || 0,
      totalCustomers: totalCustomers || 0,
    })
  }

  const fetchRecentEntries = async () => {
    const { data, error } = await supabase
      .from('entries')
      .select(`
        id,
        entry_date,
        customer_id,
        ironing,
        saree_ironing,
        dry_cleaning,
        is_correction,
        customers (name)
      `)
      .eq('is_current_version', true)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      const formattedEntries: RecentEntry[] = data.map((entry: any) => ({
        id: entry.id,
        entry_date: entry.entry_date,
        customer_name: entry.customers?.name || 'Unknown',
        ironing: entry.ironing || 0,
        saree_ironing: entry.saree_ironing || 0,
        dry_cleaning: entry.dry_cleaning || 0,
        total: (entry.ironing || 0) + (entry.saree_ironing || 0) + (entry.dry_cleaning || 0),
        is_correction: entry.is_correction || false
      }))
      setRecentEntries(formattedEntries)
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <PageLayout title="Dashboard" showBackButton={false} showHomeButton={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Dashboard" showBackButton={false} showHomeButton={false}>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, <span className="font-semibold text-gray-800">{profile?.full_name || user?.email}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Today's Entries</h3>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-2xl text-blue-600">📊</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{stats.todayEntries}</div>
          <p className="text-sm text-gray-600">Entries recorded today</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Total Customers</h3>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl text-green-600">👥</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalCustomers}</div>
          <p className="text-sm text-gray-600">Active customers in system</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Your Role</h3>
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-2xl text-purple-600">👑</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2 capitalize">{profile?.role || 'operator'}</div>
          <p className="text-sm text-gray-600">
            {profile?.role === 'admin' ? 'Full system access' : 'Data entry access'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button 
          onClick={() => router.push('/entries/new')}
          className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600">New Entry</h3>
            <span className="text-2xl group-hover:scale-110 transition-transform">➕</span>
          </div>
          <p className="text-sm text-gray-600">Add laundry entry</p>
        </button>

        <button 
          onClick={() => router.push('/entries')}
          className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-green-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 group-hover:text-green-600">View Entries</h3>
            <span className="text-2xl group-hover:scale-110 transition-transform">📋</span>
          </div>
          <p className="text-sm text-gray-600">Browse all entries</p>
        </button>

        <button 
          onClick={() => router.push('/customers')}
          className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 group-hover:text-purple-600">Customers</h3>
            <span className="text-2xl group-hover:scale-110 transition-transform">👥</span>
          </div>
          <p className="text-sm text-gray-600">Manage customers</p>
        </button>

        <button 
          onClick={() => router.push('/reports')}
          className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 group-hover:text-orange-600">Reports</h3>
            <span className="text-2xl group-hover:scale-110 transition-transform">📈</span>
          </div>
          <p className="text-sm text-gray-600">Generate reports</p>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
          <button 
            onClick={() => router.push('/entries')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All →
          </button>
        </div>
        
        {recentEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-700 font-medium">No recent entries found</p>
            <p className="text-gray-500 text-sm mt-2">Start by adding your first entry</p>
            <button 
              onClick={() => router.push('/entries/new')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Entry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-gray-900">Date</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-900">Customer</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-900">Ironing</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-900">Saree</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-900">Dry Clean</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-900">Total</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-900">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentEntries.map((entry) => (
                  <tr 
                    key={entry.id} 
                    onClick={() => router.push('/entries')}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-700">
                      {formatDate(entry.entry_date)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {entry.customer_name}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700">
                      {entry.ironing}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700">
                      {entry.saree_ironing}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700">
                      {entry.dry_cleaning}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-900">
                      {entry.total}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {entry.is_correction ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Corrected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Original
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  )
}