"use server"

// Insecure legacy Server Action desativada.
// A sincronização de vitais agora é feita via POST /api/game/action (action=sync_vitals).
export async function syncEnergyAction(): Promise<{ success: boolean; energy?: number; error?: string }> {
  return {
    success: false,
    error: 'Ação legada desativada por segurança. Use sync_vitals no endpoint seguro.'
  }
}
