import { createClient } from '@supabase/supabase-js'

function getSupabaseAdminConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseSecretKey) {
    throw new Error('Missing SUPABASE_SECRET_KEY')
  }

  return {
    supabaseUrl,
    supabaseSecretKey,
  }
}

export function createAdminClient() {
  const { supabaseUrl, supabaseSecretKey } = getSupabaseAdminConfig()

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}