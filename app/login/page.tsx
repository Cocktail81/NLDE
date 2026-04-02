'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('=== LOGIN DEBUG ===')
    console.log('Email:', email)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Login response:', { data, error })

      if (error) {
        setError(`Login failed: ${error.message}`)
        console.error('Error details:', error)
      } else if (data.user && data.session) {
        console.log('✅ Login successful!')
        console.log('User:', data.user.email)
        console.log('Session access token exists:', !!data.session.access_token)
        console.log('Session expires at:', new Date(data.session.expires_at! * 1000).toLocaleString())
        
        // Check cookies after login
        console.log('Cookies after login:', document.cookie)
        
        // Force a small delay to ensure cookies are set
        setTimeout(() => {
          console.log('Redirecting to /dashboard...')
          window.location.href = '/dashboard'
        }, 100)
      } else {
        setError('Login succeeded but no session received')
      }
    } catch (err: any) {
      console.error('Login exception:', err)
      setError(`Unexpected error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Nandlal Laundry</h1>
          <p className="text-gray-600 mt-2">
            Enter your credentials to access the system
          </p>
        </div>
        
        <form onSubmit={handleLogin}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 text-gray-800 placeholder-gray-500 bg-white"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 text-gray-800 placeholder-gray-500 bg-white"
              />
            </div>
          </div>
          
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
            
            <div className="mt-6 text-center">
              <div className="text-gray-700 text-sm">
                <p>Contact administrator for account creation</p>
                <p className="mt-1 text-gray-500 text-xs">Only admin-created accounts allowed</p>
              </div>
            </div>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <a 
            href="/debug-login" 
            className="text-blue-600 hover:text-blue-800 hover:underline block text-center text-sm font-medium"
          >
            Having issues? Try debug login →
          </a>
        </div>
      </div>
    </div>
  )
}