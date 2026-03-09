"use server"

interface ActionResponse {
  success?: boolean
  error?: string
  message?: string
  data?: any
}

// Insecure legacy Server Actions foram desativadas.
// Use o endpoint seguro: POST /api/game/action.
export async function startJob(_jobId: string): Promise<ActionResponse> {
  return {
    success: false,
    error: 'Ação legada desativada por segurança. Use o endpoint seguro do servidor.'
  }
}

export async function claimJob(): Promise<ActionResponse> {
  return {
    success: false,
    error: 'Ação legada desativada por segurança. Use o endpoint seguro do servidor.'
  }
}
