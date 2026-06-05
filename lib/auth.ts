// Client-side auth helpers only.
// Do not use this file for API route or server-side authorization.
// Server routes must validate sessions using '@/lib/supabase/server'
// and privileged operations must use '@/lib/supabase/admin' only after auth checks.

import { supabase } from './supabase/client'

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role, full_name')
    .eq('id', userId)
    .single()
    
  return { data, error }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  const { data: profile } = await getUserProfile(session.user.id)
  
  if (profile?.role !== 'admin') {
    throw new Error('Admin access required')
  }
  
  return { session, profile }
}