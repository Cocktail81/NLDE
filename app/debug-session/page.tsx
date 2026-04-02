'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugSessionPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cookieInfo, setCookieInfo] = useState('')

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
    setCookieInfo(document.cookie || 'No cookies found')
    setLoading(false)
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Current Session:</h2>
        <pre className="bg-white p-4 rounded overflow-auto text-sm">
          {session ? JSON.stringify(session, null, 2) : '❌ No session found'}
        </pre>
      </div>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Cookies:</h2>
        <pre className="bg-white p-4 rounded overflow-auto text-sm">
          {cookieInfo}
        </pre>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.reload()
          }}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Sign Out
        </button>
        
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Try Dashboard
        </button>
      </div>
    </div>
  )
}