import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are not set')
}

// IMPORTANT: Use localStorage for client-side, cookies for server-side
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: {
      // Custom storage that uses localStorage AND sets cookies
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null
        
        // Try to get from localStorage
        const item = localStorage.getItem(key)
        
        // Also check cookies for server-side access
        if (key === 'sb-auth-token') {
          const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('sb-auth-token='))
            ?.split('=')[1]
          
          return cookieValue || item
        }
        
        return item
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return
        
        // Store in localStorage
        localStorage.setItem(key, value)
        
        // ALSO store in cookies for server-side access
        if (key === 'sb-auth-token' || key.includes('auth')) {
          // Set cookie that lasts 7 days
          const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()
          document.cookie = `${key}=${value}; expires=${expires}; path=/; SameSite=Lax`
          console.log('Cookie set:', key)
        }
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return
        
        localStorage.removeItem(key)
        
        // Remove cookie
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
    },
    flowType: 'pkce',
  }
})