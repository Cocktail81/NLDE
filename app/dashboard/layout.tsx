import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import DashboardNav from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('=== Dashboard Layout Debug ===')
  
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('Session exists in layout:', !!session)
  console.log('Session user:', session?.user?.email)
  
  if (!session) {
    console.log('No session, redirecting to login')
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()
  
  console.log('Profile found:', !!profile)
  console.log('Profile role:', profile?.role)

  const signOut = async () => {
    'use server'
    console.log('Signing out...')
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Nandlal Laundry</h1>
              </div>
              <DashboardNav role={profile?.role || 'operator'} />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{profile?.full_name || session.user.email}</span>
                <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded-full capitalize">
                  {profile?.role || 'operator'}
                </span>
              </div>
              
              <form action={signOut}>
                <button
                  type="submit"
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}