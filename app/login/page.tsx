'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

const CURRENT_YEAR = new Date().getFullYear()
const COPYRIGHT_START_YEAR = 2026

function getCopyrightYears() {
  return CURRENT_YEAR > COPYRIGHT_START_YEAR
    ? `${COPYRIGHT_START_YEAR}–${CURRENT_YEAR}`
    : `${COPYRIGHT_START_YEAR}`
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()

    // Soft client-side rate limiting
    if (failedAttempts >= 5) {
      setError('Too many failed attempts. Please wait a moment before trying again.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        // Show a generic message to the user; avoid leaking internal details
        setError('Invalid email or password. Please try again.')
        setFailedAttempts((prev) => prev + 1)

        // Log specifics only in non-production environments
        if (process.env.NODE_ENV !== 'production') {
          console.error('[Login error]', error.message)
        }
      } else if (data.user && data.session) {
        // Use Next.js router — avoids full page reload and respects middleware
        router.push('/dashboard')
        router.refresh() // ensures server components re-fetch with the new session
      } else {
        setError('Login succeeded but no session was received. Please try again.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError('Something went wrong. Please try again.')

      if (process.env.NODE_ENV !== 'production') {
        console.error('[Login exception]', message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mb-8 flex justify-center">
            <Image
              src="/logo/Nandlal-logo.jpg"
              alt="Nandlal Laundry Logo"
              width={150}
              height={150}
              priority
              className="h-20 w-20 object-contain sm:h-24 sm:w-24 md:h-28 md:w-28"
            />
          </div>
          <h1 className="text-3xl font-bold text-blue-800">Nandlal Laundry</h1>
          <p className="text-gray-600 mt-2">
            Enter your credentials to access the system
          </p>
        </div>

        <form onSubmit={handleLogin} noValidate>
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-red-700 font-medium text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
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
                autoComplete="email"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 text-gray-800 placeholder-gray-500 bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
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
                autoComplete="current-password"
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
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="mt-6 text-center">
              <div className="text-gray-700 text-sm">
                <p>Contact administrator for account creation</p>
                <p className="mt-1 text-gray-500 text-xs">
                  Only admin-created accounts allowed
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Copyright footer */}
      <p className="mt-6 text-center text-sm text-gray-400">
        &copy; {getCopyrightYears()} Made with{' '}
        <span className="text-red-500" aria-label="love">&#10084;</span>
        {' '}by{' '}
        <a
          href="https://chlabs.online"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600 transition-colors"
        >
          Vaseem Mansur
        </a>
        {' '}for Nandlal Laundry. All rights reserved.
      </p>
      <p className="text-center text-xs text-gray-500">
        Version 2.0.0
      </p>
    </div>
  )
}