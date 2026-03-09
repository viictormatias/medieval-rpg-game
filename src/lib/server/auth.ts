import 'server-only'

import { getSupabaseAuthClient } from './supabaseAdmin'

export async function requireUserIdFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Token de autenticação ausente.')
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    throw new Error('Token de autenticação inválido.')
  }

  const authClient = getSupabaseAuthClient()
  const { data, error } = await authClient.auth.getUser(token)

  if (error || !data.user) {
    throw new Error('Sessão inválida ou expirada.')
  }

  return data.user.id
}
