import { supabase } from './supabase'

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
}

export type ClassType = 'Cavaleiro' | 'Nobre' | 'Errante'
export interface Job {
    id: string
    title: string
    description: string
    duration_seconds: number
    reward_xp: number
    reward_gold: number
    energy_cost: number
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
        .single()

    if (profileError || !profile) {
        return null // Precisamos de seleção de classe
    }

    if (!profile.class) {
        return null // Perfil existe mas sem classe selecionada
    }

    return profile
}

export async function createCharacter(userId: string, username: string, classType: ClassType): Promise<Profile | null> {
    const classStats = {
        'Cavaleiro': { hp_max: 120, strength: 10, defense: 10, agility: 5, accuracy: 5, vigor: 10, gold: 50 },
        'Nobre': { hp_max: 100, strength: 5, defense: 5, agility: 10, accuracy: 10, vigor: 5, gold: 200 },
        'Errante': { hp_max: 100, strength: 7, defense: 7, agility: 7, accuracy: 7, vigor: 7, gold: 100 }
    }[classType]

    const { data: profile, error } = await supabase
        .from('profiles')
        .insert([{
            id: userId,
            username,
            class: classType,
            ...classStats,
            hp_current: classStats.hp_max,
            energy: 100,
            level: 1,
            xp: 0,
            stat_points_available: 0
        }])
        .select('*')
        .single()

    if (error) {
        console.error('Erro ao criar personagem:', error)
        return null
    }

    // Errante começa com uma adaga
    if (classType === 'Errante') {
        await buyItem(userId, 'rusty_dagger', 0)
        // Equipar automaticamente
        const { data: inv } = await supabase.from('inventory').select('id').eq('profile_id', userId).eq('item_id', 'rusty_dagger').single()
        if (inv) await toggleEquip(userId, inv.id)
    }

    return profile
}

export async function getUserInventory(profileId: string) {
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('profile_id', profileId)

    return error ? [] : data
}

export async function buyItem(profileId: string, itemId: string, price: number): Promise<boolean> {
    // 1. Verificar Gold
    const { data: profile } = await supabase.from('profiles').select('gold').eq('id', profileId).single()
    if (!profile || profile.gold < price) return false

    // 2. Deduzir Gold
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ gold: profile.gold - price })
        .eq('id', profileId)

    if (updateError) return false

    // 3. Adicionar ao inventário
    const { error: invError } = await supabase
        .from('inventory')
        .insert([{ profile_id: profileId, item_id: itemId }])

    return !invError
}

export async function toggleEquip(profileId: string, inventoryId: string): Promise<boolean> {
    // 1. Pegar o item atual
    const { data: item } = await supabase.from('inventory').select('*').eq('id', inventoryId).single()
    if (!item) return false

    const isCurrentlyEquipped = item.is_equipped

    if (!isCurrentlyEquipped) {
        // Se for equipar, precisamos desequipar o outro do mesmo tipo primeiro
        // (Aqui precisaríamos saber o tipo, mas como passamos o CATALOG_ITEMS para o front, o front gerencia isso?)
        // De forma segura, pegamos o catálogo
        const { ITEMS } = await import('./items')
        const itemSpec = ITEMS.find(it => it.id === item.item_id)
        if (!itemSpec) return false

        // Buscar todos os itens do inventário para desequipar o mesmo tipo
        const { data: fullInv } = await supabase.from('inventory').select('*').eq('profile_id', profileId).eq('is_equipped', true)

        if (fullInv) {
            for (const invEntry of fullInv) {
                const spec = ITEMS.find(it => it.id === invEntry.item_id)
                if (spec && spec.type === itemSpec.type) {
                    await supabase.from('inventory').update({ is_equipped: false }).eq('id', invEntry.id)
                }
            }
        }
    }

    const { error } = await supabase
        .from('inventory')
        .update({ is_equipped: !isCurrentlyEquipped })
        .eq('id', inventoryId)

    return !error
}

export async function loginWithEmail(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string) {
    return await supabase.auth.signUp({ email, password })
}

export async function getJobs(): Promise<Job[]> {
    const { data, error } = await supabase.from('jobs').select('*').order('energy_cost', { ascending: true })
    return error ? [] : data
}

export async function getEnemies(): Promise<Enemy[]> {
    const { data, error } = await supabase.from('npc_enemies').select('*').order('level', { ascending: true })
    return error ? [] : data
}

export async function startJobAction(profileId: string, job: Job) {
    const finishAt = new Date()
    finishAt.setSeconds(finishAt.getSeconds() + job.duration_seconds)

    const { error } = await supabase
        .from('profiles')
        .update({
            current_job_id: job.id,
            job_finish_at: finishAt.toISOString()
        })
        .eq('id', profileId)

    return !error
}

export async function claimJobAction(profile: Profile, job: Job) {
    const { error } = await supabase
        .from('profiles')
        .update({
            xp: profile.xp + job.reward_xp,
            gold: profile.gold + job.reward_gold,
            energy: Math.max(0, profile.energy - job.energy_cost),
            current_job_id: null,
            job_finish_at: null
        })
        .eq('id', profile.id)

    return !error
}

export async function distributeStats(profileId: string, attr: 'strength' | 'agility' | 'accuracy' | 'vigor', points: number = 1): Promise<boolean> {
    const { data: profile, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

    if (getError || !profile) return false
    if (profile.stat_points_available < points) return false

    const updates: any = {
        stat_points_available: profile.stat_points_available - points,
        [attr]: (profile[attr] || 0) + points
    }

    // Vigor aumenta HP Máximo (+10 por ponto)
    if (attr === 'vigor') {
        updates.hp_max = (profile.hp_max || 100) + (points * 10);
        updates.hp_current = (profile.hp_current || 100) + (points * 10); // Cura o jogador ao aumentar o vigor? Geralmente sim em RPGs.
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId)

    return !updateError
}

export async function awardCombatRewards(profileId: string, xpGain: number, goldGain: number): Promise<boolean> {
    const { data: profile, error: getError } = await supabase
        .from('profiles')
        .select('xp, gold')
        .eq('id', profileId)
        .single()

    if (getError || !profile) return false

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            xp: (profile.xp || 0) + xpGain,
            gold: (profile.gold || 0) + goldGain
        })
        .eq('id', profileId)

    return !updateError
}
