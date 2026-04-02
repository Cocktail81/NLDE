'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult('Logging in...')
    
    console.log('Debug Login - Starting with:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('Debug Login - Result:', { data, error })
    
    if (error) {
      setResult(`❌ Error: ${error.message}`)
    } else {
      setResult(`✅ Success! 
      User: ${data.user?.email}
      Session: ${!!data.session}
      User ID: ${data.user?.id}`)
      
      // Check current session
      const { data: sessionData } = await supabase.auth.getSession()
      console.log('Debug Login - Session check:', sessionData)
      
      // Force redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/test-cookie'
      }, 2000)
    }
    
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Login</h1>
      <div className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            placeholder="your-email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Test Login'}
        </button>
        
        {result && (
          <div className="p-4 bg-gray-100 rounded whitespace-pre-line">
            {result}
          </div>
        )}
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal ml-6 space-y-1 text-sm">
            <li>Enter your Supabase admin credentials</li>
            <li>Click "Test Login"</li>
            <li>Check result above</li>
            <li>You'll be redirected to /test-cookie automatically</li>
            <li>Check if auth cookies exist</li>
            <li>Then try to visit /dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  )
}