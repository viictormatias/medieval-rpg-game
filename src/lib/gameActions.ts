import { supabase } from './supabase'
import { Item, ItemRarity } from './items'

export interface Profile {
    id: string
    username: string
    level: number
    xp: number
    gold: number
    hp_current: number
    hp_max: number
    energy: number
    job_finish_at: string | null
    current_job_id: string | null
    strength: number
    defense: number
    agility: number
    accuracy: number
    vigor: number
    stat_points_available: number
    class: string
    image_url: string | null
    energy_last_regen_at?: string | null
    last_regen_at?: string | null
    created_at?: string | null
}

export type ClassType = 'Pistoleiro' | 'Xerife' | 'Forasteiro' | 'Pregador' | 'Nativo' | 'Vendedor' | 'CacadorDeRecompensas'
export interface Job {
    id: string
    title: string
    description: string
    duration_seconds: number
    reward_xp: number
    reward_gold: number
    energy_cost: number
    min_level: number
}

export interface Enemy {
    id: string
    name: string
    level: number
    hp_max: number
    strength: number
    agility: number
    precision: number
}

export interface CombatResolution {
    success: boolean
    playerWon: boolean
    xpGain: number
    goldGain: number
    energyCost: number
    hpAfter: number
    leveledUp?: boolean
    consumableDrop?: { name: string; icon: string }
    equipmentDrop?: { name: string; icon: string; rarity: ItemRarity }
}

export type InitialStatKey = 'strength' | 'defense' | 'agility' | 'accuracy' | 'vigor'
export type InitialStatAllocation = Partial<Record<InitialStatKey, number>>
export const ONBOARDING_STAT_POINTS = 5
export const ONBOARDING_MAX_PER_STAT = 8
export const COMBAT_ENERGY_COST = 0
const MAX_ENERGY = 100
const ENERGY_REGEN_PER_TICK = 10
const ENERGY_REGEN_INTERVAL_SECONDS = 360
const HP_REGEN_INTERVAL_SECONDS = 30
const HP_REGEN_FULL_HEAL_SECONDS = 600

type SecureActionResponse<T = any> = {
    success: boolean
    data?: T
    error?: string
}

async function callSecureAction<T = any>(action: string, payload: Record<string, any> = {}): Promise<SecureActionResponse<T>> {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) {
            console.error('[SECURE-ACTION] Sem token de sessão');
            return { success: false, error: 'Sessão expirada. Faça login novamente.' }
        }

        const res = await fetch('/api/game/action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ action, payload })
        })

        const json = await res.json().catch(() => null)
        console.log(`[SECURE-ACTION] Response for ${action}:`, { status: res.status, json });

        if (!res.ok) {
            return { success: false, error: json?.error || `Falha na ação segura (${res.status}).` }
        }

        if (!json || json.success !== true) {
            return { success: false, error: json?.error || 'Ação rejeitada pelo servidor.' }
        }

        return { success: true, data: json.data as T }
    } catch (error: any) {
        console.error(`[SECURE-ACTION] Erro crítico em ${action}:`, error);
        return { success: false, error: error?.message || 'Erro de conexão com o servidor.' }
    }
}

function parseTimestampMs(value?: string | null): number | null {
    if (!value) return null
    const parsed = new Date(value).getTime()
    return Number.isFinite(parsed) ? parsed : null
}

function previewSyncedVitals(profile: Profile): Profile {
    try {
        const nowMs = Date.now()
        let energyAnchorMs = parseTimestampMs(profile.energy_last_regen_at) ?? parseTimestampMs(profile.created_at) ?? nowMs
        let hpAnchorMs = parseTimestampMs(profile.last_regen_at) ?? energyAnchorMs

        if (!Number.isFinite(energyAnchorMs)) energyAnchorMs = nowMs
        if (!Number.isFinite(hpAnchorMs)) hpAnchorMs = nowMs

        if (energyAnchorMs > nowMs) energyAnchorMs = nowMs
        if (hpAnchorMs > nowMs) hpAnchorMs = nowMs

        const energyDiffInSeconds = Math.floor((nowMs - energyAnchorMs) / 1000)
        const energyTicks = Math.floor(energyDiffInSeconds / ENERGY_REGEN_INTERVAL_SECONDS)
        const nextEnergy = Math.min(MAX_ENERGY, Number(profile.energy || 0) + energyTicks * ENERGY_REGEN_PER_TICK)
        const nextEnergyAnchorMs = energyTicks > 0
            ? energyAnchorMs + energyTicks * ENERGY_REGEN_INTERVAL_SECONDS * 1000
            : energyAnchorMs

        const hpDiffInSeconds = Math.floor((nowMs - hpAnchorMs) / 1000)
        const hpTicks = Math.floor(hpDiffInSeconds / HP_REGEN_INTERVAL_SECONDS)
        const hpElapsedSeconds = hpTicks * HP_REGEN_INTERVAL_SECONDS
        const hpPerSecond = Number(profile.hp_max || 100) / HP_REGEN_FULL_HEAL_SECONDS

        let nextHp = Number(profile.hp_current || 1)
        let nextHpAnchorMs = hpAnchorMs

        if (hpTicks > 0) {
            if (Number(profile.hp_current || 0) >= Number(profile.hp_max || 1)) {
                nextHpAnchorMs = nowMs
            } else {
                const hpGain = Math.max(0, Math.floor(hpPerSecond * hpElapsedSeconds))
                nextHp = Math.min(Number(profile.hp_max || 1), Number(profile.hp_current || 1) + hpGain)
                nextHpAnchorMs = hpAnchorMs + hpElapsedSeconds * 1000
            }
        }

        return {
            ...profile,
            energy: nextEnergy,
            hp_current: nextHp,
            energy_last_regen_at: new Date(nextEnergyAnchorMs).toISOString(),
            last_regen_at: new Date(nextHpAnchorMs).toISOString(),
        }
    } catch {
        return profile
    }
}

/**
 * Tenta buscar o perfil do usuário logado (anônimo ou credencial).
 */
export async function ensureProfile(): Promise<Profile | null> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null

    const currentUser = session.user

    // Tenta buscar o perfil
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

    if (profileError || !profile) {
        console.log('[DEBUG-PROFILE] No profile found for user:', currentUser.id, 'Error:', profileError);
        return null // Precisamos de seleção de classe
    }

    // Validação estrita: Nome deve ter pelo menos 3 caracteres, não ser um padrão de sistema, e ter classe/HP válidos
    const isSystemName = profile.username && (
        profile.username.startsWith('Jogador_') ||
        profile.username.startsWith('Novo Jogador')
    )
    const hasValidName = profile.username && profile.username.trim().length >= 3 && !isSystemName
    const hasValidStats = profile.class && profile.hp_max > 0

    if (!hasValidName || !hasValidStats) {
        console.warn(`[AUTH] Perfil incompleto ou padrão detectado para o usuário ${currentUser.id} (${profile.username}). Redirecionando para criação.`)
        return null
    }

    console.log('[DEBUG-PROFILE] Perfil carregado com sucesso:', {
        username: profile.username,
        class: profile.class,
        level: profile.level,
        id: profile.id
    });
    const secureSync = await callSecureAction<Profile>('sync_vitals')
    if (secureSync.success && secureSync.data) {
        return secureSync.data
    }

    // Fallback local sem escrita no banco: mantém regen visual mesmo sem SERVICE_ROLE no servidor.
    return previewSyncedVitals(profile)
}

export async function createCharacter(
    userId: string,
    username: string,
    classType: ClassType,
    allocation: InitialStatAllocation = {}
): Promise<Profile | null> {
    if (!userId) return null

    const result = await callSecureAction<Profile>('create_character', {
        username,
        classType,
        allocation
    })

    if (!result.success || !result.data) {
        console.error('Erro ao criar personagem (seguro):', result.error)
        return null
    }

    return result.data
}

export async function getUserInventory(profileId: string) {
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('profile_id', profileId)

    return error ? [] : data
}

export async function buyItem(profileId: string, itemId: string, price: number): Promise<boolean> {
    if (!profileId) return false
    const result = await callSecureAction('buy_item', { itemId })
    if (!result.success) console.error('[SECURE-BUY] Falha na compra:', result.error, { itemId, price })
    return result.success
}

export async function sellItem(profileId: string, inventoryId: string, sellPrice: number): Promise<boolean> {
    if (!profileId) return false
    const result = await callSecureAction('sell_item', { inventoryId })
    if (!result.success) console.error('[SECURE-SELL] Falha na venda:', result.error, { inventoryId, sellPrice })
    return result.success
}

export async function toggleEquip(profileId: string, inventoryId: string): Promise<boolean> {
    if (!profileId) return false
    const result = await callSecureAction('toggle_equip', { inventoryId })
    if (!result.success) console.error('[SECURE-EQUIP] Falha ao alternar equipamento:', result.error, { inventoryId })
    return result.success
}

export async function loginWithEmail(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string) {
    return await supabase.auth.signUp({ email, password })
}

export async function logout() {
    return await supabase.auth.signOut()
}

export async function getJobs(): Promise<Job[]> {
    const { data, error } = await supabase.from('jobs').select('*').order('reward_gold', { ascending: true })
    return error ? [] : data
}

export async function getEnemies(): Promise<Enemy[]> {
    const { data, error } = await supabase.from('npc_enemies').select('*').order('level', { ascending: true })
    return error ? [] : data
}

export async function startJobAction(profileId: string, job: Job) {
    if (!profileId || !job?.id) return false
    const result = await callSecureAction('start_job', { jobId: job.id })
    if (!result.success) console.error('[SECURE-JOB] Falha ao iniciar missão:', result.error, { jobId: job.id })
    return result.success
}

export async function claimJobAction(profile: Profile, job: Job) {
    if (!profile?.id) return false
    const result = await callSecureAction('claim_job')
    if (!result.success) {
        console.error('[SECURE-JOB] Falha ao coletar missão:', result.error, { profileId: profile.id, jobId: job?.id })
    }
    return result.success
}

export async function distributeStats(profileId: string, attr: 'strength' | 'agility' | 'accuracy' | 'vigor', points: number = 1): Promise<boolean> {
    if (!profileId || points <= 0) return false
    const allocations: InitialStatAllocation = { [attr]: points } as InitialStatAllocation
    const result = await callSecureAction('distribute_stats_batch', { allocations })
    if (!result.success) console.error('[SECURE-STATS] Falha ao distribuir pontos:', result.error, { attr, points })
    return result.success
}

export async function distributeStatsBatch(profileId: string, allocations: InitialStatAllocation): Promise<boolean> {
    if (!profileId) return false
    const result = await callSecureAction('distribute_stats_batch', { allocations })
    if (!result.success) console.error('[SECURE-STATS] Falha no lote de atributos:', result.error, allocations)
    return result.success
}

export async function awardCombatRewards(profileId: string, xpGain: number, goldGain: number): Promise<boolean> {
    console.warn('[SECURE] awardCombatRewards está desativado no cliente. Use resolveArenaCombat via servidor.', { profileId, xpGain, goldGain })
    return false
}

export async function beginArenaCombat(profileId: string, enemyId: string): Promise<{ success: boolean; ticket?: string; error?: string }> {
    if (!profileId || !enemyId) {
        return { success: false, error: 'Parâmetros inválidos para iniciar duelo.' }
    }

    const result = await callSecureAction<{ ticket: string }>('begin_arena', { enemyId })
    if (!result.success || !result.data?.ticket) {
        return { success: false, error: result.error || 'Falha ao iniciar duelo seguro.' }
    }

    return { success: true, ticket: result.data.ticket }
}

export async function resolveArenaCombat(
    profileId: string,
    enemy: Enemy,
    playerWon: boolean,
    hpAfterCombat: number,
    combatTicket?: string
): Promise<CombatResolution> {
    if (!profileId || !enemy?.id || !combatTicket) {
        return {
            success: false,
            playerWon: false,
            xpGain: 0,
            goldGain: 0,
            energyCost: COMBAT_ENERGY_COST,
            hpAfter: Math.max(1, Math.floor(hpAfterCombat || 1))
        }
    }

    const result = await callSecureAction<CombatResolution>('resolve_arena', {
        enemyId: enemy.id,
        combatTicket,
        // Mantidos apenas para auditoria de divergência entre cliente e servidor.
        clientPlayerWon: playerWon,
        clientHpAfterCombat: hpAfterCombat
    })

    if (!result.success || !result.data) {
        console.error('[SECURE-ARENA] Falha ao resolver duelo:', result.error, { enemyId: enemy.id })
        return {
            success: false,
            playerWon: false,
            xpGain: 0,
            goldGain: 0,
            energyCost: COMBAT_ENERGY_COST,
            hpAfter: Math.max(1, Math.floor(hpAfterCombat || 1))
        }
    }

    return result.data
}
export async function consumeItem(profileId: string, inventoryId: string, _item: Item): Promise<{ success: boolean; message: string }> {
    if (!profileId) return { success: false, message: 'Perfil inválido.' }
    const result = await callSecureAction<{ success: boolean; message: string }>('consume_item', { inventoryId })

    if (!result.success) {
        return { success: false, message: result.error || 'Falha ao consumir item.' }
    }

    return result.data || { success: false, message: 'Falha ao consumir item.' }
}

