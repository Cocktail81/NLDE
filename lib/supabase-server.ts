import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  console.log('Server Client - All cookies:', cookieStore.getAll().map(c => c.name))

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll()
          console.log('Server Client - Getting all cookies:', allCookies.map(c => c.name))
          return allCookies
        },
        setAll(cookiesToSet) {
          console.log('Server Client - Setting cookies:', cookiesToSet.map(c => c.name))
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            console.error('Error setting cookies:', error)
          }
        },
      },
    }
  )
}