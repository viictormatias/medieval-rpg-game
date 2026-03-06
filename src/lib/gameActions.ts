import { supabase } from './supabase'
import { Item, ITEMS, ItemRarity } from './items'

const MAX_ENERGY = 100
const ENERGY_REGEN_PER_TICK = 10
const ENERGY_REGEN_INTERVAL_SECONDS = 60

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

function parseTimestampMs(value?: string | null): number | null {
    if (!value) return null
    const parsed = new Date(value).getTime()
    return Number.isFinite(parsed) ? parsed : null
}

async function syncVitals(
    profile: Profile
): Promise<Profile> {
    try {
        const nowMs = Date.now()
        let lastRegenAt = profile.energy_last_regen_at
            ? new Date(profile.energy_last_regen_at).getTime()
            : new Date(profile.created_at || nowMs).getTime()

        // Fallback para datas inválidas (NaN)
        if (isNaN(lastRegenAt)) {
            lastRegenAt = nowMs
        }

        const diffInSeconds = Math.floor((nowMs - lastRegenAt) / 1000)

        // Intervalo de tick para cálculo base (30 segundos para energia, e vamos usar continuo real para HP)
        if (diffInSeconds < ENERGY_REGEN_INTERVAL_SECONDS) return profile

        const ticks = Math.floor(diffInSeconds / ENERGY_REGEN_INTERVAL_SECONDS)

        // Calcula Energia
        const nextEnergy = Math.min(MAX_ENERGY, profile.energy + (ticks * ENERGY_REGEN_PER_TICK))

        // Calcula HP (Total heal in 10 minutes = 600 segundos)
        const passedSeconds = diffInSeconds
        const maxHp = profile.hp_max
        const hpPerSecond = maxHp / 600
        const nextHp = Math.min(maxHp, Math.floor(profile.hp_current + (hpPerSecond * passedSeconds)))

        const nextRegenAtIso = new Date(
            lastRegenAt + (ticks * ENERGY_REGEN_INTERVAL_SECONDS * 1000)
        ).toISOString()

        const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update({
                energy: nextEnergy,
                hp_current: nextHp,
                energy_last_regen_at: nextRegenAtIso
            })
            .eq('id', profile.id)
            .select('*')
            .single()

        if (error || !updatedProfile) {
            console.error('Erro ao regenerar vitais:', error)
            return { ...profile, energy: nextEnergy, hp_current: nextHp }
        }

        return updatedProfile
    } catch (err) {
        console.error('Falha crítica em syncVitals:', err)
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
        .single()

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
    return await syncVitals(profile)
}

export async function createCharacter(
    userId: string,
    username: string,
    classType: ClassType,
    allocation: InitialStatAllocation = {}
): Promise<Profile | null> {
    const classStats = {
        Pistoleiro: { hp_max: 100, strength: 1, defense: 1, agility: 4, accuracy: 3, vigor: 1, gold: 100 },
        Xerife: { hp_max: 100, strength: 2, defense: 3, agility: 1, accuracy: 1, vigor: 3, gold: 100 },
        Forasteiro: { hp_max: 100, strength: 2, defense: 2, agility: 2, accuracy: 2, vigor: 2, gold: 100 },
        Pregador: { hp_max: 100, strength: 1, defense: 3, agility: 1, accuracy: 2, vigor: 3, gold: 100 },
        Nativo: { hp_max: 100, strength: 3, defense: 1, agility: 3, accuracy: 2, vigor: 1, gold: 100 },
        Vendedor: { hp_max: 100, strength: 1, defense: 1, agility: 3, accuracy: 3, vigor: 2, gold: 100 },
        CacadorDeRecompensas: { hp_max: 100, strength: 3, defense: 1, agility: 2, accuracy: 3, vigor: 1, gold: 100 }
    }[classType]

    const keys: InitialStatKey[] = ['strength', 'defense', 'agility', 'accuracy', 'vigor']
    const normalizedAllocation: Record<InitialStatKey, number> = {
        strength: 0,
        defense: 0,
        agility: 0,
        accuracy: 0,
        vigor: 0
    }

    for (const key of keys) {
        const raw = Number(allocation[key] || 0)
        if (!Number.isInteger(raw) || raw < 0 || raw > ONBOARDING_MAX_PER_STAT) {
            console.error('Distribuicao inicial invalida:', key, raw)
            return null
        }
        normalizedAllocation[key] = raw
    }

    const totalAllocated = Object.values(normalizedAllocation).reduce((sum, value) => sum + value, 0)
    if (totalAllocated !== ONBOARDING_STAT_POINTS) {
        console.error('Distribuicao inicial invalida: total deve ser', ONBOARDING_STAT_POINTS, 'recebido', totalAllocated)
        return null
    }

    const finalStats = {
        strength: classStats.strength + normalizedAllocation.strength,
        defense: classStats.defense + normalizedAllocation.defense,
        agility: classStats.agility + normalizedAllocation.agility,
        accuracy: classStats.accuracy + normalizedAllocation.accuracy,
        vigor: classStats.vigor + normalizedAllocation.vigor,
    }
    const finalHpMax = classStats.hp_max + (normalizedAllocation.vigor * 10)

    const { data: profile, error } = await supabase
        .from('profiles')
        .upsert([{
            id: userId,
            username,
            class: classType,
            gold: classStats.gold,
            ...finalStats,
            hp_max: finalHpMax,
            hp_current: finalHpMax,
            energy: 100,
            energy_last_regen_at: new Date().toISOString(),
            last_regen_at: new Date().toISOString(),
            level: 1,
            xp: 0,
            stat_points_available: 0,
            unspent_points: 0
        }])
        .select('*')
        .single()

    if (error) {
        console.error('Erro ao criar personagem:', error)
        return null
    }

    // Classes mais leves começam com faca velha
    if (classType === 'Pistoleiro' || classType === 'Forasteiro') {
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

function calculateLevelUp(
    currentLevel: number,
    currentXp: number,
    xpGain: number,
    currentPoints: number,
    hpMax: number,
    currentHp: number,
    currentEnergy: number
) {
    let nextLevel = currentLevel
    let nextXp = currentXp + xpGain
    let nextPoints = currentPoints
    let healedHp = currentHp
    let filledEnergy = currentEnergy

    let leveledUp = false

    while (nextXp >= nextLevel * 100) {
        nextXp -= nextLevel * 100
        nextLevel++
        nextPoints += 3 // 3 pontos ao upar
        healedHp = hpMax
        filledEnergy = MAX_ENERGY
        leveledUp = true
    }

    return {
        level: nextLevel,
        xp: nextXp,
        stat_points_available: nextPoints,
        hp_current: healedHp,
        energy: filledEnergy,
        leveledUp
    }
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

export async function logout() {
    return await supabase.auth.signOut()
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
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

    if (profileError || !profile) return false

    const normalizedProfile = await syncVitals(profile)
    if (normalizedProfile.current_job_id) return false
    if (normalizedProfile.energy < job.energy_cost) return false

    const finishAt = new Date()
    finishAt.setSeconds(finishAt.getSeconds() + job.duration_seconds)

    const { error } = await supabase
        .from('profiles')
        .update({
            energy: normalizedProfile.energy - job.energy_cost,
            energy_last_regen_at: new Date().toISOString(),
            current_job_id: job.id,
            job_finish_at: finishAt.toISOString()
        })
        .eq('id', profileId)

    if (error) {
        console.error('[DEBUG-JOB] Error starting job:', error.message, 'Code:', error.code, 'Details:', error.details);
    } else {
        console.log('[DEBUG-JOB] Job started successfully:', job.title);
    }

    return !error
}

export async function claimJobAction(profile: Profile, job: Job) {
    const { data: latestProfile, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single()

    if (getError || !latestProfile) return false

    // Segurança: Verificar se o tempo de conclusão realmente passou
    if (!latestProfile.job_finish_at) return false
    const finishTime = new Date(latestProfile.job_finish_at).getTime()
    const now = Date.now()

    if (now < finishTime) {
        console.error('[DEBUG-JOB] Tentativa de coleta prematura detectada:', {
            now: new Date(now).toISOString(),
            finish: latestProfile.job_finish_at
        });
        return false
    }

    const normalizedProfile = await syncVitals(latestProfile)

    const levelUpData = calculateLevelUp(
        normalizedProfile.level,
        normalizedProfile.xp,
        job.reward_xp,
        normalizedProfile.stat_points_available,
        normalizedProfile.hp_max,
        normalizedProfile.hp_current,
        normalizedProfile.energy
    )

    const { error } = await supabase
        .from('profiles')
        .update({
            level: levelUpData.level,
            xp: levelUpData.xp,
            stat_points_available: levelUpData.stat_points_available,
            hp_current: levelUpData.hp_current,
            energy: levelUpData.energy,
            gold: normalizedProfile.gold + job.reward_gold,
            current_job_id: null,
            job_finish_at: null
        })
        .eq('id', normalizedProfile.id)

    if (error) {
        console.error('[DEBUG-JOB] Error claiming job rewards:', error.message, 'Code:', error.code, 'Details:', error.details);
    } else {
        console.log('[DEBUG-JOB] Job rewards claimed successfully:', job.title);
        await grantDrops(normalizedProfile.id, false);
    }

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

export async function distributeStatsBatch(profileId: string, allocations: InitialStatAllocation): Promise<boolean> {
    const { data: profile, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

    if (getError || !profile) return false

    const totalPointsNeeded = Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0)
    if (profile.stat_points_available < totalPointsNeeded) return false

    const updates: any = {
        stat_points_available: profile.stat_points_available - totalPointsNeeded
    }

    let hpBonus = 0
    for (const [key, points] of Object.entries(allocations)) {
        if (points && points > 0) {
            updates[key] = (profile[key] || 0) + points
            if (key === 'vigor') {
                hpBonus += points * 10
            }
        }
    }

    if (hpBonus > 0) {
        updates.hp_max = (profile.hp_max || 100) + hpBonus
        updates.hp_current = (profile.hp_current || 100) + hpBonus
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
        .select('*')
        .eq('id', profileId)
        .single()

    if (getError || !profile) return false

    const levelUpData = calculateLevelUp(
        profile.level,
        profile.xp,
        xpGain,
        profile.stat_points_available,
        profile.hp_max,
        profile.hp_current,
        profile.energy
    )

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            level: levelUpData.level,
            xp: levelUpData.xp,
            stat_points_available: levelUpData.stat_points_available,
            hp_current: levelUpData.hp_current,
            energy: levelUpData.energy,
            gold: (profile.gold || 0) + goldGain
        })
        .eq('id', profileId)

    return !updateError
}

async function grantDrops(profileId: string, isDuel: boolean) {
    let consumableDrop = undefined
    let equipmentDrop = undefined

    // Roll 1: Consumível (20% chance)
    if (Math.random() < 0.20) {
        const consumables = ITEMS.filter(i => i.type === 'consumable')
        const roll = Math.floor(Math.random() * consumables.length)
        const itemSpec = consumables[roll]

        if (itemSpec) {
            const { error: insErr } = await supabase.from('inventory').insert({
                profile_id: profileId,
                item_id: itemSpec.id
            })
            if (!insErr) {
                consumableDrop = { name: itemSpec.name, icon: itemSpec.icon }
            }
        }
    }

    // Roll 2: Equipamento (20% chance de ocorrência)
    if (Math.random() < 0.20) {
        const rarityRoll = Math.random() * 100
        let targetRarity: ItemRarity = 'common'

        if (rarityRoll < 0.5) targetRarity = 'legendary'
        else if (rarityRoll < 4) targetRarity = 'epic'
        else if (rarityRoll < 12) targetRarity = 'rare'
        else if (rarityRoll < 35) targetRarity = 'uncommon'
        else targetRarity = 'common'

        const possibleItems = ITEMS.filter(i => {
            if (i.type === 'consumable') return false;
            // Armas só podem ser dropadas durante Duelos, em trabalhos não.
            if (!isDuel && i.type === 'weapon') return false;
            return i.rarity === targetRarity;
        })

        if (possibleItems.length > 0) {
            const roll = Math.floor(Math.random() * possibleItems.length)
            const itemSpec = possibleItems[roll]

            const { error: insErr } = await supabase.from('inventory').insert({
                profile_id: profileId,
                item_id: itemSpec.id
            })
            if (!insErr) {
                equipmentDrop = { name: itemSpec.name, icon: itemSpec.icon, rarity: itemSpec.rarity }
            }
        }
    }

    return { consumableDrop, equipmentDrop }
}

function getArenaRewards(enemy: Enemy) {
    const xpGain = Math.max(8, Math.floor(enemy.level * 12 + enemy.hp_max * 0.18))
    const goldGain = Math.max(5, Math.floor(enemy.level * 7 + enemy.strength * 0.6))
    return { xpGain, goldGain }
}

export async function resolveArenaCombat(
    profileId: string,
    enemy: Enemy,
    playerWon: boolean,
    hpAfterCombat: number
): Promise<CombatResolution> {
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

    if (profileError || !profile) {
        return {
            success: false,
            playerWon,
            xpGain: 0,
            goldGain: 0,
            energyCost: COMBAT_ENERGY_COST,
            hpAfter: Math.max(1, hpAfterCombat)
        }
    }

    const normalizedProfile = await syncVitals(profile)

    if (normalizedProfile.job_finish_at && new Date(normalizedProfile.job_finish_at) > new Date()) {
        return {
            success: false,
            playerWon,
            xpGain: 0,
            goldGain: 0,
            energyCost: 0,
            hpAfter: normalizedProfile.hp_current
        }
    }

    if (normalizedProfile.energy < COMBAT_ENERGY_COST) {
        return {
            success: false,
            playerWon,
            xpGain: 0,
            goldGain: 0,
            energyCost: COMBAT_ENERGY_COST,
            hpAfter: normalizedProfile.hp_current
        }
    }

    const rewards = playerWon ? getArenaRewards(enemy) : { xpGain: 2, goldGain: 0 }
    const safeHpAfter = Math.max(1, Math.min(normalizedProfile.hp_current, Math.floor(hpAfterCombat)))
    const nextEnergy = Math.max(0, normalizedProfile.energy - COMBAT_ENERGY_COST)

    const levelUpData = calculateLevelUp(
        normalizedProfile.level,
        normalizedProfile.xp,
        rewards.xpGain,
        normalizedProfile.stat_points_available,
        normalizedProfile.hp_max,
        safeHpAfter,
        nextEnergy
    )

    let consumableDrop = undefined
    let equipmentDrop = undefined

    if (playerWon) {
        const drops = await grantDrops(normalizedProfile.id, true)
        consumableDrop = drops.consumableDrop
        equipmentDrop = drops.equipmentDrop
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            level: levelUpData.level,
            xp: levelUpData.xp,
            stat_points_available: levelUpData.stat_points_available,
            hp_current: levelUpData.hp_current,
            energy: levelUpData.energy,
            gold: normalizedProfile.gold + rewards.goldGain,
            energy_last_regen_at: new Date().toISOString()
        })
        .eq('id', normalizedProfile.id)

    if (updateError) {
        return {
            success: false,
            playerWon,
            xpGain: 0,
            goldGain: 0,
            energyCost: COMBAT_ENERGY_COST,
            hpAfter: normalizedProfile.hp_current
        }
    }

    return {
        success: true,
        playerWon,
        xpGain: rewards.xpGain,
        goldGain: rewards.goldGain,
        energyCost: COMBAT_ENERGY_COST,
        hpAfter: levelUpData.hp_current,
        leveledUp: levelUpData.leveledUp,
        consumableDrop,
        equipmentDrop
    }
}
export async function consumeItem(profileId: string, inventoryId: string, item: Item): Promise<{ success: boolean; message: string }> {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', profileId).single()
    if (!profile) return { success: false, message: 'Perfil não encontrado' }

    // Recover HP
    let hp_gain = 0
    if (item.stats?.hp_current) {
        const potentialHp = profile.hp_current + item.stats.hp_current
        const maxHp = profile.hp_max
        hp_gain = Math.min(item.stats.hp_current, maxHp - profile.hp_current)
        if (hp_gain < 0) hp_gain = 0
    }

    // Recover Energy
    let energy_gain = 0
    if (item.stats?.energy) {
        const potentialEnergy = profile.energy + item.stats.energy
        energy_gain = Math.min(item.stats.energy, MAX_ENERGY - profile.energy)
        if (energy_gain < 0) energy_gain = 0
    }

    if (hp_gain === 0 && energy_gain === 0) {
        return { success: false, message: 'Você já está com os stats no máximo!' }
    }

    // Delete item (explicitly requesting returned rows to verify deletion over RLS)
    const { data: delData, error: delErr } = await supabase.from('inventory').delete().eq('id', inventoryId).select()
    if (delErr) return { success: false, message: 'Erro ao remover item' }
    if (!delData || delData.length === 0) {
        console.error('[CONSUME] Falha ao deletar item. Provavelmente RLS Policy de DELETE ausente na tabela inventory:', inventoryId);
        return { success: false, message: 'ERRO NO BANCO: Item não pôde ser consumido. Verifique se a tabela "inventory" possui a política (RLS) que permite DELETE para usuarios logados.' }
    }

    // Update profile
    const { error: updErr } = await supabase.from('profiles').update({
        hp_current: profile.hp_current + hp_gain,
        energy: profile.energy + energy_gain
    }).eq('id', profileId)

    if (updErr) return { success: false, message: 'Erro ao aplicar atributos' }

    let msgParts = []
    if (hp_gain > 0) msgParts.push(`${hp_gain} PV`)
    if (energy_gain > 0) msgParts.push(`${energy_gain} Energia`)

    return { success: true, message: `Você recuperou ${msgParts.join(' e ')}!` }
}
