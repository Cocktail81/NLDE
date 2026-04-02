import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase-server'

export default async function TestCookiePage() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  // Check for Supabase auth cookies
  const supabaseCookies = allCookies.filter(cookie => 
    cookie.name.startsWith('sb-') || 
    cookie.name.includes('auth') ||
    cookie.name.includes('token')
  )
  
  // Try to get session using server client
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Cookie Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded border">
          <h2 className="font-semibold mb-2">All Cookies ({allCookies.length}):</h2>
          {allCookies.length === 0 ? (
            <p className="text-red-500">No cookies found!</p>
          ) : (
            <ul className="space-y-2">
              {allCookies.map((cookie) => (
                <li key={cookie.name} className="text-sm font-mono p-2 bg-white rounded border">
                  <strong>{cookie.name}:</strong> 
                  <div className="truncate text-xs">{cookie.value.substring(0, 100)}...</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="bg-blue-50 p-4 rounded border">
          <h2 className="font-semibold mb-2">Supabase Auth Cookies ({supabaseCookies.length}):</h2>
          {supabaseCookies.length === 0 ? (
            <div>
              <p className="text-red-500">❌ No Supabase auth cookies found!</p>
              <p className="text-sm mt-2">This means authentication won't work server-side.</p>
            </div>
          ) : (
            <div className="text-green-600">
              <p>✅ Found Supabase auth cookies!</p>
              <ul className="mt-2 space-y-1">
                {supabaseCookies.map((cookie) => (
                  <li key={cookie.name} className="text-sm font-mono">
                    {cookie.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 rounded border">
        <h2 className="font-semibold mb-2">Session Status:</h2>
        {session ? (
          <div className="text-green-600">
            <p>✅ Session found!</p>
            <p className="text-sm mt-2">User: {session.user.email}</p>
            <p className="text-sm">User ID: {session.user.id}</p>
          </div>
        ) : (
          <p className="text-red-500">❌ No session found</p>
        )}
      </div>
      
      <div className="mt-6 space-x-4">
        <a href="/login" className="px-4 py-2 bg-blue-500 text-white rounded inline-block">Go to Login</a>
        <a href="/dashboard" className="px-4 py-2 bg-green-500 text-white rounded inline-block">Go to Dashboard</a>
        <a href="/check-role" className="px-4 py-2 bg-purple-500 text-white rounded inline-block">Check Role</a>
      </div>
    </div>
  )
}