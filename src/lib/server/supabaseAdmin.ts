import 'server-only'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  (process.env.SUPABASE_URL || '').trim() ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()

const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

function assertUrl() {
  if (!supabaseUrl.startsWith('http')) {
    throw new Error('SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL ausente ou inválida no servidor.')
  }
}

export function getSupabaseAdminClient() {
  assertUrl()
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente. Configure para habilitar mutações seguras.')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

export function getSupabaseAuthClient() {
  assertUrl()
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY ausente no servidor.')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
