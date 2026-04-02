'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugProfilePage() {
  const [sessionUser, setSessionUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkProfile()
  }, [])

  const checkProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      setLoading(false)
      return
    }
    
    setSessionUser(session.user)
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    console.log('Profile query result:', { profile, error })
    setProfile(profile)
    setLoading(false)
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Profile Debug</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Session User:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(sessionUser, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Profile Data:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 bg-green-100 rounded">
          <h2 className="font-semibold mb-2">Status:</h2>
          <p>Session User ID: {sessionUser?.id}</p>
          <p>Profile ID: {profile?.id}</p>
          <p>Role: {profile?.role}</p>
          <p>Match: {sessionUser?.id === profile?.id ? '✅' : '❌'}</p>
        </div>
      </div>
    </div>
  )
}