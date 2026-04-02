'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginTestPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult('Logging in...')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setResult(`❌ Error: ${error.message}`)
      } else if (data.user) {
        setResult(`✅ Success! Logged in as: ${data.user.email}`)
        
        // Get profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        
        setResult(prev => `${prev}\nRole: ${profile?.role || 'No role found'}`)
      }
    } catch (err: any) {
      setResult(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Login Test</h1>
        
        <form onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        
        {result && (
          <div className="mt-4 p-3 bg-gray-100 rounded whitespace-pre-line">
            {result}
          </div>
        )}
      </div>
    </div>
  )
}