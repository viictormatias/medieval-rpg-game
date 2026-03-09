import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()



// Build-safe and Robust initialization:
export const isConfigValid = supabaseUrl.startsWith('http') && supabaseAnonKey.length > 0
export const hasUrl = supabaseUrl.startsWith('http')
export const hasKey = supabaseAnonKey.length > 0

export const supabase = isConfigValid
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null as any
