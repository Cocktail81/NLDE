import { createClient } from '@supabase/supabase-js'

// Safely get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

// Check if Supabase is properly configured
const isConfigured = Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://'))

// Log warning only in development and only if not configured
if (process.env.NODE_ENV === 'development' && !isConfigured) {
  console.warn('⚠️ Supabase environment variables are not properly configured')
  console.warn('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.warn('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing')
}

// Create storage handler only in browser environment
const getStorage = () => {
  if (!isBrowser) return undefined

  return {
    getItem: (key: string) => {
      try {
        // Try to get from localStorage
        const item = localStorage.getItem(key)
        
        // Also check cookies for auth token
        if (key === 'sb-auth-token') {
          const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('sb-auth-token='))
            ?.split('=')[1]
          
          return cookieValue || item
        }
        
        return item
      } catch (error) {
        console.error('Storage getItem error:', error)
        return null
      }
    },
    setItem: (key: string, value: string) => {
      try {
        // Store in localStorage
        localStorage.setItem(key, value)
        
        // Also store in cookies for server-side access
        if (key === 'sb-auth-token' || key.includes('auth')) {
          const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()
          document.cookie = `${key}=${value}; expires=${expires}; path=/; SameSite=Lax; Secure=${location.protocol === 'https:'}`
        }
      } catch (error) {
        console.error('Storage setItem error:', error)
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key)
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      } catch (error) {
        console.error('Storage removeItem error:', error)
      }
    },
  }
}

// Create the Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
      storage: getStorage(),
      flowType: 'pkce',
    },
  }
)

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = isConfigured

// Helper to get current session safely (client-side only)
export const getCurrentSession = async () => {
  if (!isBrowser || !isConfigured) return null
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// Helper to sign out safely
export const signOut = async () => {
  if (!isBrowser || !isConfigured) return
  
  try {
    await supabase.auth.signOut()
    // Clear any remaining cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim()
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })
  } catch (error) {
    console.error('Error signing out:', error)
  }
}