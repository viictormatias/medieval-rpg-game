import { NextResponse } from 'next/server'

import { ITEMS, ItemRarity, getItemById } from '@/lib/items'
import { MAX_LEVEL, xpForNextLevel } from '@/lib/progression'
import { requireUserIdFromRequest } from '@/lib/server/auth'
import { assertUuid, clampInt, createArenaTicket, consumeArenaTicket, enforceRateLimit, normalizeUsername } from '@/lib/server/gameGuards'
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin'

const MAX_ENERGY = 100
const ENERGY_REGEN_PER_TICK = 10
const ENERGY_REGEN_INTERVAL_SECONDS = 360
const HP_REGEN_INTERVAL_SECONDS = 30
const HP_REGEN_FULL_HEAL_SECONDS = 600

const ONBOARDING_STAT_POINTS = 5
const ONBOARDING_FREE_STAT_POINTS = 0
const ONBOARDING_MAX_PER_STAT = 8
const COMBAT_ENERGY_COST = 0
const ARENA_TICKET_TTL_MS = 3 * 60 * 1000

type ClassType = 'Pistoleiro' | 'Xerife' | 'Forasteiro' | 'Pregador' | 'Nativo' | 'Vendedor' | 'CacadorDeRecompensas'
type StatKey = 'strength' | 'defense' | 'agility' | 'accuracy' | 'vigor'

const STAT_KEYS: StatKey[] = ['strength', 'defense', 'agility', 'accuracy', 'vigor']
const STAT_CAPS: Record<StatKey, number> = {
  strength: 80,
  defense: 80,
  agility: 80,
  accuracy: 80,
  vigor: 80,
}

function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status })
}

function ok<T>(data?: T) {
  return NextResponse.json({ success: true, data })
}

function parseTimestampMs(value?: string | null): number | null {
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
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
  if (nextLevel >= MAX_LEVEL) {
    return {
      level: MAX_LEVEL,
      xp: 0,
      stat_points_available: nextPoints,
      hp_current: healedHp,
      energy: filledEnergy,
      leveledUp: false,
    }
  }

  while (nextLevel < MAX_LEVEL && nextXp >= xpForNextLevel(nextLevel)) {
    nextXp -= xpForNextLevel(nextLevel)
    nextLevel++
    nextPoints += 3
    healedHp = hpMax
    filledEnergy = MAX_ENERGY
    leveledUp = true
  }

  if (nextLevel >= MAX_LEVEL) {
    nextLevel = MAX_LEVEL
    nextXp = 0
  }

  return {
    level: nextLevel,
    xp: nextXp,
    stat_points_available: nextPoints,
    hp_current: healedHp,
    energy: filledEnergy,
    leveledUp,
  }
}

async function getProfile(admin: ReturnType<typeof getSupabaseAdminClient>, userId: string) {
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new Error('Perfil não encontrado.')
  }

  return data as any
}

async function syncVitals(admin: ReturnType<typeof getSupabaseAdminClient>, profile: any) {
  const nowMs = Date.now()
  let energyAnchorMs =
    parseTimestampMs(profile.energy_last_regen_at) ??
    parseTimestampMs(profile.created_at) ??
    nowMs
  let hpAnchorMs =
    parseTimestampMs(profile.last_regen_at) ??
    energyAnchorMs

  if (!Number.isFinite(energyAnchorMs)) energyAnchorMs = nowMs
  if (!Number.isFinite(hpAnchorMs)) hpAnchorMs = nowMs

  if (energyAnchorMs > nowMs) energyAnchorMs = nowMs
  if (hpAnchorMs > nowMs) hpAnchorMs = nowMs

  const energyDiffInSeconds = Math.floor((nowMs - energyAnchorMs) / 1000)
  const energyTicks = Math.floor(energyDiffInSeconds / ENERGY_REGEN_INTERVAL_SECONDS)
  const nextEnergy = Math.min(MAX_ENERGY, Number(profile.energy || 0) + energyTicks * ENERGY_REGEN_PER_TICK)
  const nextEnergyAnchorMs =
    energyTicks > 0
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

  const hasChanges =
    nextEnergy !== Number(profile.energy || 0) ||
    nextHp !== Number(profile.hp_current || 1) ||
    nextEnergyAnchorMs !== energyAnchorMs ||
    nextHpAnchorMs !== hpAnchorMs

  if (!hasChanges) return profile

  const updates: Record<string, unknown> = {
    energy_last_regen_at: new Date(nextEnergyAnchorMs).toISOString(),
    last_regen_at: new Date(nextHpAnchorMs).toISOString(),
  }

  if (nextEnergy !== Number(profile.energy || 0)) updates.energy = nextEnergy
  if (nextHp !== Number(profile.hp_current || 1)) updates.hp_current = nextHp

  const { data: updatedProfile, error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', profile.id)
    .select('*')
    .single()

  if (error || !updatedProfile) {
    return {
      ...profile,
      ...updates,
      energy: nextEnergy,
      hp_current: nextHp,
    }
  }

  return updatedProfile
}

function normalizeAllocation(raw: any) {
  const allocation: Record<StatKey, number> = {
    strength: 0,
    defense: 0,
    agility: 0,
    accuracy: 0,
    vigor: 0,
  }

  const source = raw && typeof raw === 'object' ? raw : {}

  for (const key of STAT_KEYS) {
    allocation[key] = clampInt(source[key] ?? 0, 0, ONBOARDING_MAX_PER_STAT)
  }

  const total = Object.values(allocation).reduce((sum, value) => sum + value, 0)
  if (total !== ONBOARDING_STAT_POINTS) {
    throw new Error(`Distribuição inicial inválida: use exatamente ${ONBOARDING_STAT_POINTS} pontos.`)
  }

  return allocation
}

function normalizeStatAllocations(raw: any) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Alocações inválidas.')
  }

  const normalized: Record<StatKey, number> = {
    strength: 0,
    defense: 0,
    agility: 0,
    accuracy: 0,
    vigor: 0,
  }

  for (const key of Object.keys(raw)) {
    if (!STAT_KEYS.includes(key as StatKey)) {
      throw new Error('Atributo inválido na distribuição.')
    }
  }

  for (const key of STAT_KEYS) {
    normalized[key] = clampInt(raw[key] ?? 0, 0, 999)
  }

  const totalPointsNeeded = Object.values(normalized).reduce((sum, val) => sum + val, 0)
  if (totalPointsNeeded <= 0) {
    throw new Error('Nenhum ponto para distribuir.')
  }

  return { normalized, totalPointsNeeded }
}

async function getEquippedRelicCombatBonuses(admin: ReturnType<typeof getSupabaseAdminClient>, profileId: string) {
  const { data: equippedInv } = await admin
    .from('inventory')
    .select('item_id')
    .eq('profile_id', profileId)
    .eq('is_equipped', true)

  if (!equippedInv || equippedInv.length === 0) {
    return { goldPct: 0, dropPct: 0 }
  }

  let goldPct = 0
  let dropPct = 0

  for (const entry of equippedInv) {
    const spec = getItemById(entry.item_id)
    if (!spec || spec.type !== 'relic' || !spec.relic_effect) continue
    goldPct += Number(spec.relic_effect.gold_per_duel_pct || 0)
    dropPct += Number(spec.relic_effect.item_drop_per_duel_pct || 0)
  }

  return { goldPct, dropPct }
}

function getArenaRewards(enemy: any) {
  const xpGain = Math.max(
    6,
    Math.floor(
      Number(enemy.level || 1) * 8 +
      Number(enemy.hp_max || 1) * 0.09 +
      Number(enemy.strength || 1) * 0.35 +
      Number(enemy.precision || 1) * 0.35
    )
  )
  const goldGain = Math.max(
    4,
    Math.floor(
      Number(enemy.level || 1) * 5 +
      Number(enemy.strength || 1) * 0.4 +
      Number(enemy.hp_max || 1) * 0.03
    )
  )
  return { xpGain, goldGain }
}

function getArenaDifficultyMultiplier(playerPower: number, enemyPower: number) {
  const ratio = enemyPower / Math.max(1, playerPower)
  return Math.max(0.72, Math.min(1.45, 0.75 + ratio * 0.45))
}

function calculateJobRewards(job: any, profileLevel: number) {
  const minLevel = Math.max(1, Number(job.min_level || 1))
  const durationMin = Math.max(1, Math.floor(Number(job.duration_seconds || 0) / 60))
  const dbXp = Math.max(0, Number(job.reward_xp || 0))
  const dbGold = Math.max(0, Number(job.reward_gold || 0))

  const baselineXp = Math.floor(24 + minLevel * 12 + durationMin * 2.4)
  const baselineGold = Math.floor(16 + minLevel * 9 + durationMin * 2.1)

  const blendedXp = Math.floor(dbXp * 0.55 + baselineXp * 0.45)
  const blendedGold = Math.floor(dbGold * 0.5 + baselineGold * 0.5)

  // Anti-farm: jobs muito abaixo do nível do jogador rendem menos.
  const levelGap = Math.max(0, Number(profileLevel || 1) - minLevel)
  const farmPenalty = levelGap <= 8 ? 1 : Math.max(0.45, 1 - (levelGap - 8) * 0.03)

  return {
    xpGain: Math.max(4, Math.floor(blendedXp * farmPenalty)),
    goldGain: Math.max(3, Math.floor(blendedGold * farmPenalty)),
  }
}

function pickRarityForEnemy(level: number, dropBonusPct = 0): ItemRarity {
  // Progressão por nível: sobe peso de raridades altas conforme inimigo fica mais forte.
  let weights: Record<ItemRarity, number>

  if (level >= 35) {
    weights = { common: 6, uncommon: 16, rare: 33, epic: 29, legendary: 16 }
  } else if (level >= 28) {
    weights = { common: 10, uncommon: 22, rare: 33, epic: 25, legendary: 10 }
  } else if (level >= 20) {
    weights = { common: 15, uncommon: 30, rare: 30, epic: 20, legendary: 5 }
  } else if (level >= 12) {
    weights = { common: 26, uncommon: 34, rare: 25, epic: 12, legendary: 3 }
  } else if (level >= 5) {
    weights = { common: 40, uncommon: 35, rare: 18, epic: 6, legendary: 1 }
  } else {
    weights = { common: 55, uncommon: 30, rare: 12, epic: 2.8, legendary: 0.2 }
  }

  // Relíquias de drop aumentam chance de raridades altas sem quebrar a distribuição.
  const bonusShift = Math.max(0, Math.min(14, dropBonusPct * 0.2))
  const commonDrain = Math.min(weights.common * 0.6, bonusShift * 0.55)
  const uncommonDrain = Math.min(weights.uncommon * 0.35, bonusShift * 0.45)
  const drained = commonDrain + uncommonDrain

  weights.common -= commonDrain
  weights.uncommon -= uncommonDrain
  weights.rare += drained * 0.45
  weights.epic += drained * 0.35
  weights.legendary += drained * 0.2

  const total = Object.values(weights).reduce((sum, v) => sum + v, 0)
  let roll = Math.random() * total
  const order: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
  for (const rarity of order) {
    if (roll < weights[rarity]) return rarity
    roll -= weights[rarity]
  }
  return 'common'
}

async function grantDrops(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  profileId: string,
  isDuel: boolean,
  enemyLevel = 1,
  dropBonusPct = 0
) {
  let consumableDrop: { name: string; icon: string } | undefined = undefined
  let equipmentDrop: { name: string; icon: string; rarity: ItemRarity } | undefined = undefined

  const consumableChance = Math.min(0.7, 0.20 + dropBonusPct / 100)
  const equipmentChance = Math.min(0.7, 0.20 + dropBonusPct / 100)

  if (Math.random() < consumableChance) {
    const consumables = ITEMS.filter(i => i.type === 'consumable')
    const roll = Math.floor(Math.random() * consumables.length)
    const itemSpec = consumables[roll]

    if (itemSpec) {
      const { error: insErr } = await admin.from('inventory').insert({
        profile_id: profileId,
        item_id: itemSpec.id,
      })
      if (!insErr) {
        consumableDrop = { name: itemSpec.name, icon: itemSpec.icon }
      }
    }
  }

  if (Math.random() < equipmentChance) {
    const targetRarity = pickRarityForEnemy(Number(enemyLevel || 1), dropBonusPct)

    const possibleItems = ITEMS.filter(i => {
      if (i.type === 'consumable') return false
      if (!isDuel && i.type === 'weapon') return false
      return i.rarity === targetRarity
    })

    if (possibleItems.length > 0) {
      const roll = Math.floor(Math.random() * possibleItems.length)
      const itemSpec = possibleItems[roll]

      const { error: insErr } = await admin.from('inventory').insert({
        profile_id: profileId,
        item_id: itemSpec.id,
      })
      if (!insErr) {
        equipmentDrop = { name: itemSpec.name, icon: itemSpec.icon, rarity: itemSpec.rarity }
      }
    }
  }

  return { consumableDrop, equipmentDrop }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserIdFromRequest(req)
    const body = await req.json().catch(() => null)
    const action = String(body?.action || '').trim()
    const payload = body?.payload ?? {}

    if (!action) return fail('Ação inválida.')

    const actionLimit =
      action === 'resolve_arena'
        ? enforceRateLimit(`${userId}:${action}`, 1, 8000)
        : action === 'begin_arena'
          ? enforceRateLimit(`${userId}:${action}`, 1, 8000)
          : enforceRateLimit(`${userId}:${action}`, 20, 10000)

    if (!actionLimit.allowed) {
      return fail('Muitas tentativas. Aguarde alguns segundos e tente novamente.', 429)
    }

    const admin = getSupabaseAdminClient()

    if (action === 'create_character') {
      const username = normalizeUsername(payload.username)
      const classType = String(payload.classType || '') as ClassType
      const allocation = normalizeAllocation(payload.allocation)

      const classStatsMap: Record<ClassType, { hp_max: number; strength: number; defense: number; agility: number; accuracy: number; vigor: number; gold: number }> = {
        Pistoleiro: { hp_max: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0, gold: 100 },
        Xerife: { hp_max: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0, gold: 100 },
        Forasteiro: { hp_max: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0, gold: 100 },
        Pregador: { hp_max: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0, gold: 100 },
        Nativo: { hp_max: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0, gold: 100 },
        Vendedor: { hp_max: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0, gold: 100 },
        CacadorDeRecompensas: { hp_max: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0, gold: 100 },
      }

      if (!classStatsMap[classType]) {
        return fail('Classe inválida.')
      }

      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id,class')
        .eq('id', userId)
        .maybeSingle()

      if (existingProfile?.class) {
        return fail('Seu personagem já foi criado e não pode ser recriado.')
      }

      const classStats = classStatsMap[classType]
      const finalStats = {
        strength: classStats.strength + allocation.strength,
        defense: classStats.defense + allocation.defense,
        agility: classStats.agility + allocation.agility,
        accuracy: classStats.accuracy + allocation.accuracy,
        vigor: classStats.vigor + allocation.vigor,
      }
      const finalHpMax = classStats.hp_max + allocation.vigor * 10

      const { data: profile, error } = await admin
        .from('profiles')
        .upsert([
          {
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
            stat_points_available: ONBOARDING_FREE_STAT_POINTS,
          },
        ])
        .select('*')
        .single()

      if (error || !profile) return fail('Erro ao criar personagem.', 500)

      if (classType === 'Pistoleiro' || classType === 'Forasteiro') {
        const { data: inv } = await admin
          .from('inventory')
          .select('id')
          .eq('profile_id', userId)
          .eq('item_id', 'rusty_dagger')
          .maybeSingle()

        if (!inv) {
          await admin.from('inventory').insert({ profile_id: userId, item_id: 'rusty_dagger' })
        }
      }

      return ok(profile)
    }

    if (action === 'sync_vitals') {
      const profile = await getProfile(admin, userId)
      const syncedProfile = await syncVitals(admin, profile)
      return ok(syncedProfile)
    }

    if (action === 'start_job') {
      const jobId = String(payload.jobId || '')
      assertUuid(jobId, 'jobId')

      const rawProfile = await getProfile(admin, userId)
      const profile = await syncVitals(admin, rawProfile)

      if (profile.current_job_id) {
        return fail('Você já está em um trabalho ativo.')
      }

      const { data: job, error: jobError } = await admin
        .from('jobs')
        .select('id,duration_seconds,reward_xp,reward_gold,energy_cost,min_level')
        .eq('id', jobId)
        .single()

      if (jobError || !job) return fail('Trabalho não encontrado.')

      if (Number(profile.level || 1) < Number(job.min_level || 1)) {
        return fail('Nível insuficiente para este trabalho.')
      }

      if (Number(profile.energy || 0) < Number(job.energy_cost || 0)) {
        return fail('Energia insuficiente.')
      }

      const finishAt = new Date(Date.now() + Number(job.duration_seconds || 0) * 1000)

      const { error: updateError } = await admin
        .from('profiles')
        .update({
          energy: Number(profile.energy || 0) - Number(job.energy_cost || 0),
          energy_last_regen_at: new Date().toISOString(),
          current_job_id: job.id,
          job_finish_at: finishAt.toISOString(),
        })
        .eq('id', userId)
        .is('current_job_id', null)

      if (updateError) return fail('Erro ao iniciar trabalho.', 500)

      return ok({ finishAt: finishAt.toISOString() })
    }

    if (action === 'claim_job') {
      const rawProfile = await getProfile(admin, userId)
      const profile = await syncVitals(admin, rawProfile)

      if (!profile.current_job_id || !profile.job_finish_at) {
        return fail('Você não tem trabalho para coletar.')
      }

      if (Date.now() + 2000 < new Date(profile.job_finish_at).getTime()) {
        return fail('Trabalho ainda não foi concluído.')
      }

      const { data: job, error: jobError } = await admin
        .from('jobs')
        .select('id,duration_seconds,reward_xp,reward_gold,min_level')
        .eq('id', profile.current_job_id)
        .single()

      if (jobError || !job) return fail('Trabalho inválido para coleta.')

      const jobRewards = calculateJobRewards(job, Number(profile.level || 1))
      const effectiveXpGain = Number(profile.level || 1) >= MAX_LEVEL ? 0 : jobRewards.xpGain
      const levelUpDataWithXp = calculateLevelUp(
        Number(profile.level || 1),
        Number(profile.xp || 0),
        effectiveXpGain,
        Number(profile.stat_points_available || 0),
        Number(profile.hp_max || 100),
        Number(profile.hp_current || 1),
        Number(profile.energy || 0)
      )
      const nextGold = Number(profile.gold || 0) + jobRewards.goldGain

      const { error: claimError } = await admin
        .from('profiles')
        .update({
          level: levelUpDataWithXp.level,
          xp: levelUpDataWithXp.xp,
          stat_points_available: levelUpDataWithXp.stat_points_available,
          hp_current: levelUpDataWithXp.hp_current,
          energy: levelUpDataWithXp.energy,
          gold: nextGold,
          current_job_id: null,
          job_finish_at: null,
        })
        .eq('id', userId)
        .eq('current_job_id', profile.current_job_id)

      if (claimError) return fail('Erro ao coletar recompensa.', 500)

      await grantDrops(admin, userId, false)

      return ok({
        xp: levelUpDataWithXp.xp,
        gold: nextGold,
        level: levelUpDataWithXp.level,
        stat_points_available: levelUpDataWithXp.stat_points_available,
        xpGain: effectiveXpGain,
        goldGain: jobRewards.goldGain,
      })
    }

    if (action === 'buy_item') {
      const itemId = String(payload.itemId || '')
      const itemSpec = getItemById(itemId)
      if (!itemSpec) return fail('Item inválido.')

      const rawProfile = await getProfile(admin, userId)
      const price = Math.max(0, Number(itemSpec.price || 0))

      if (Number(rawProfile.gold || 0) < price) {
        return fail('Gold insuficiente.')
      }

      if (itemSpec.type !== 'consumable') {
        const { data: existing } = await admin
          .from('inventory')
          .select('id')
          .eq('profile_id', userId)
          .eq('item_id', itemId)
          .limit(1)

        if (existing && existing.length > 0) {
          return fail('Você já possui este item.')
        }
      }

      const currentGold = Number(rawProfile.gold || 0)
      const { data: updatedProfile, error: goldError } = await admin
        .from('profiles')
        .update({ gold: currentGold - price })
        .eq('id', userId)
        .eq('gold', currentGold)
        .select('*')
        .single()

      if (goldError || !updatedProfile) return fail('Falha ao debitar ouro.', 500)

      const { error: invError } = await admin
        .from('inventory')
        .insert([{ profile_id: userId, item_id: itemId }])

      if (invError) {
        await admin
          .from('profiles')
          .update({ gold: currentGold })
          .eq('id', userId)
        return fail('Falha ao concluir compra.', 500)
      }

      const { data: inventory } = await admin.from('inventory').select('*').eq('profile_id', userId)
      return ok({ profile: updatedProfile, inventory })
    }

    if (action === 'sell_item') {
      const inventoryId = String(payload.inventoryId || '')
      assertUuid(inventoryId, 'inventoryId')

      const { data: item, error: itemError } = await admin
        .from('inventory')
        .select('id,item_id,is_equipped')
        .eq('id', inventoryId)
        .eq('profile_id', userId)
        .single()

      if (itemError || !item) return fail('Item não encontrado.')
      if (item.is_equipped) return fail('Desequipe o item antes de vender.')

      const spec = getItemById(item.item_id)
      if (!spec) return fail('Item inválido para venda.')

      const sellPrice = Math.floor(Number(spec.price || 0) * 0.5)

      const { data: deletedRows, error: deleteError } = await admin
        .from('inventory')
        .delete()
        .eq('id', inventoryId)
        .eq('profile_id', userId)
        .select('id')

      if (deleteError || !deletedRows || deletedRows.length === 0) {
        return fail('Falha ao vender item.', 500)
      }

      const profile = await getProfile(admin, userId)
      const { data: updatedProfile, error: goldError } = await admin
        .from('profiles')
        .update({ gold: Number(profile.gold || 0) + sellPrice })
        .eq('id', userId)
        .select('*')
        .single()

      if (goldError || !updatedProfile) return fail('Falha ao creditar ouro da venda.', 500)

      const { data: inventory } = await admin.from('inventory').select('*').eq('profile_id', userId)
      return ok({ profile: updatedProfile, inventory, sellPrice })
    }

    if (action === 'toggle_equip') {
      const inventoryId = String(payload.inventoryId || '')
      assertUuid(inventoryId, 'inventoryId')

      const { data: item, error: itemError } = await admin
        .from('inventory')
        .select('id,item_id,is_equipped,profile_id')
        .eq('id', inventoryId)
        .eq('profile_id', userId)
        .single()

      if (itemError || !item) return fail('Item não encontrado.')

      const spec = getItemById(item.item_id)
      if (!spec) return fail('Item inválido.')
      if (spec.type === 'consumable') return fail('Consumíveis não podem ser equipados.')

      const willEquip = !item.is_equipped

      if (willEquip && spec.requirements) {
        const profile = await getProfile(admin, userId)
        for (const [attr, needed] of Object.entries(spec.requirements)) {
          const value = Number((profile as any)[attr] || 0)
          if (value < Number(needed || 0)) {
            return fail(`Requisito insuficiente para equipar (${attr}).`)
          }
        }
      }

      if (willEquip) {
        const { data: equippedRows } = await admin
          .from('inventory')
          .select('id,item_id')
          .eq('profile_id', userId)
          .eq('is_equipped', true)

        const equippedSameType = (equippedRows || []).filter((entry: any) => {
          const entrySpec = getItemById(entry.item_id)
          return !!entrySpec && entrySpec.type === spec.type
        })

        const maxEquip = spec.type === 'relic' ? 2 : 1
        const toUnequipCount = Math.max(0, equippedSameType.length - maxEquip + 1)

        for (let i = 0; i < toUnequipCount; i++) {
          await admin
            .from('inventory')
            .update({ is_equipped: false })
            .eq('id', equippedSameType[i].id)
            .eq('profile_id', userId)
        }
      }

      const { error: toggleError } = await admin
        .from('inventory')
        .update({ is_equipped: willEquip })
        .eq('id', inventoryId)
        .eq('profile_id', userId)

      if (toggleError) return fail('Falha ao atualizar equipamento.', 500)

      const profile = await getProfile(admin, userId)
      const { data: inventory } = await admin.from('inventory').select('*').eq('profile_id', userId)
      return ok({ profile, inventory })
    }

    if (action === 'consume_item') {
      const inventoryId = String(payload.inventoryId || '')
      assertUuid(inventoryId, 'inventoryId')

      const { data: invItem, error: invError } = await admin
        .from('inventory')
        .select('id,item_id,is_equipped')
        .eq('id', inventoryId)
        .eq('profile_id', userId)
        .single()

      if (invError || !invItem) return fail('Item não encontrado.')
      if (invItem.is_equipped) return fail('Desequipe o item antes de consumir.')

      const itemSpec = getItemById(invItem.item_id)
      if (!itemSpec || itemSpec.type !== 'consumable') return fail('Apenas consumíveis podem ser usados.')

      const profile = await getProfile(admin, userId)

      const hpGain = Math.max(
        0,
        Math.min(
          Number(itemSpec.stats?.hp_current || 0),
          Number(profile.hp_max || 100) - Number(profile.hp_current || 0)
        )
      )

      const energyGain = Math.max(
        0,
        Math.min(
          Number(itemSpec.stats?.energy || 0),
          MAX_ENERGY - Number(profile.energy || 0)
        )
      )

      if (hpGain === 0 && energyGain === 0) {
        return fail('Você já está com os atributos no máximo.')
      }

      const { data: deletedRows, error: deleteError } = await admin
        .from('inventory')
        .delete()
        .eq('id', inventoryId)
        .eq('profile_id', userId)
        .select('id')

      if (deleteError || !deletedRows || deletedRows.length === 0) {
        return fail('Não foi possível consumir o item.', 500)
      }

      const { data: updatedProfile, error: updateError } = await admin
        .from('profiles')
        .update({
          hp_current: Number(profile.hp_current || 0) + hpGain,
          energy: Number(profile.energy || 0) + energyGain,
          last_regen_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('*')
        .single()

      if (updateError || !updatedProfile) return fail('Erro ao aplicar efeito do item.', 500)

      const msgParts: string[] = []
      if (hpGain > 0) msgParts.push(`${hpGain} PV`)
      if (energyGain > 0) msgParts.push(`${energyGain} Energia`)

      const { data: inventory } = await admin.from('inventory').select('*').eq('profile_id', userId)
      return ok({ profile: updatedProfile, inventory, message: `Você recuperou ${msgParts.join(' e ')}!` })
    }

    if (action === 'distribute_stats_batch') {
      const { normalized, totalPointsNeeded } = normalizeStatAllocations(payload.allocations)
      const profile = await getProfile(admin, userId)

      if (Number(profile.stat_points_available || 0) < totalPointsNeeded) {
        return fail('Pontos insuficientes para distribuir.')
      }

      const updates: Record<string, number> = {
        stat_points_available: Number(profile.stat_points_available || 0) - totalPointsNeeded,
      }

      let hpBonus = 0
      for (const key of STAT_KEYS) {
        const points = normalized[key]
        if (points > 0) {
          const currentStat = Number(profile[key] || 0)
          const cap = STAT_CAPS[key]
          if (currentStat + points > cap) {
            return fail(`Limite de ${key} atingido (${cap}).`)
          }
          updates[key] = currentStat + points
          if (key === 'vigor') hpBonus += points * 10
        }
      }

      if (hpBonus > 0) {
        updates.hp_max = Number(profile.hp_max || 100) + hpBonus
        updates.hp_current = Number(profile.hp_current || 100) + hpBonus
      }

      const { error: updateError } = await admin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .eq('stat_points_available', Number(profile.stat_points_available || 0))

      if (updateError) return fail('Erro ao distribuir pontos.', 500)

      return ok({ success: true })
    }

    if (action === 'begin_arena') {
      const enemyId = String(payload.enemyId || '')
      assertUuid(enemyId, 'enemyId')

      const rawProfile = await getProfile(admin, userId)
      const profile = await syncVitals(admin, rawProfile)

      if (Number(profile.energy || 0) < COMBAT_ENERGY_COST) {
        return fail('Energia insuficiente para iniciar duelo.')
      }

      const { data: enemy, error: enemyError } = await admin
        .from('npc_enemies')
        .select('id')
        .eq('id', enemyId)
        .single()

      if (enemyError || !enemy) return fail('Inimigo inválido.')

      const ticket = createArenaTicket(userId, enemyId, ARENA_TICKET_TTL_MS)
      return ok({ ticket })
    }

    if (action === 'resolve_arena') {
      const enemyId = String(payload.enemyId || '')
      const combatTicket = String(payload.combatTicket || '')
      const playerWon = payload.playerWon === true
      const hpAfterCombat = Number(payload.hpAfterCombat)
      assertUuid(enemyId, 'enemyId')

      if (!combatTicket || combatTicket.length < 20) {
        return fail('Ticket de duelo inválido.')
      }

      const validTicket = consumeArenaTicket(userId, enemyId, combatTicket)
      if (!validTicket) {
        return fail('Ticket de duelo expirado ou inválido.')
      }

      const rawProfile = await getProfile(admin, userId)
      const profile = await syncVitals(admin, rawProfile)

      if (Number(profile.energy || 0) < COMBAT_ENERGY_COST) {
        return fail('Energia insuficiente para resolver duelo.')
      }

      const { data: enemy, error: enemyError } = await admin
        .from('npc_enemies')
        .select('id,name,level,hp_max,strength,agility,precision')
        .eq('id', enemyId)
        .single()

      if (enemyError || !enemy) return fail('Inimigo inválido para duelo.')

      const playerPower =
        Number(profile.level || 1) * 8 +
        Number(profile.strength || 0) * 4 +
        Number(profile.defense || 0) * 4 +
        Number(profile.agility || 0) * 4 +
        Number(profile.accuracy || 0) * 4 +
        Number(profile.vigor || 0) * 4

      const enemyPower =
        Number(enemy.level || 1) * 10 +
        Number(enemy.strength || 0) * 5 +
        Number(enemy.agility || 0) * 5 +
        Number(enemy.precision || 0) * 5

      const rawWinChance = playerPower / Math.max(1, playerPower + enemyPower)
      const winChance = Math.max(0.1, Math.min(0.9, rawWinChance))
      const serverPredictedWon = Math.random() <= winChance
      // Mantemos a confiança no cliente por enquanto, mas usando a chave certa

      const rewards = playerWon
        ? getArenaRewards(enemy)
        : { xpGain: 2, goldGain: 0 }
      const difficultyMultiplier = getArenaDifficultyMultiplier(playerPower, enemyPower)
      const scaledRewards = playerWon
        ? {
          xpGain: Math.max(4, Math.floor(rewards.xpGain * difficultyMultiplier)),
          goldGain: Math.max(3, Math.floor(rewards.goldGain * difficultyMultiplier)),
        }
        : { xpGain: 0, goldGain: 0 }
      const effectiveXpGain = Number(profile.level || 1) >= MAX_LEVEL ? 0 : scaledRewards.xpGain

      const relicBonuses = playerWon
        ? await getEquippedRelicCombatBonuses(admin, userId)
        : { goldPct: 0, dropPct: 0 }

      const bonusGold = Math.floor(scaledRewards.goldGain * (relicBonuses.goldPct / 100))
      const totalGoldGain = scaledRewards.goldGain + bonusGold

      const randomHpDelta = playerWon
        ? Math.max(1, Math.floor(Math.random() * 12))
        : Math.max(8, Math.floor(Math.random() * 25))

      const safeHpAfter = Number.isFinite(hpAfterCombat)
        ? Math.max(1, Math.min(Number(profile.hp_max || 100), Math.floor(hpAfterCombat)))
        : Math.max(1, Number(profile.hp_current || 1) - randomHpDelta)
      const nextEnergy = Math.max(0, Number(profile.energy || 0) - COMBAT_ENERGY_COST)

      const levelUpData = calculateLevelUp(
        Number(profile.level || 1),
        Number(profile.xp || 0),
        effectiveXpGain,
        Number(profile.stat_points_available || 0),
        Number(profile.hp_max || 100),
        safeHpAfter,
        nextEnergy
      )

      let drops = { consumableDrop: undefined as any, equipmentDrop: undefined as any }
      if (playerWon) {
        drops = await grantDrops(admin, userId, true, Number(enemy.level || 1), relicBonuses.dropPct)
      }

      const { error: updateError } = await admin
        .from('profiles')
        .update({
          level: levelUpData.level,
          xp: levelUpData.xp,
          stat_points_available: levelUpData.stat_points_available,
          hp_current: levelUpData.hp_current,
          energy: levelUpData.energy,
          gold: Number(profile.gold || 0) + totalGoldGain,
          energy_last_regen_at: new Date().toISOString(),
          last_regen_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) return fail('Erro ao aplicar resultado do duelo.', 500)

      return ok({
        success: true,
        playerWon,
        serverPredictedWon,
        xpGain: effectiveXpGain,
        goldGain: totalGoldGain,
        energyCost: COMBAT_ENERGY_COST,
        hpAfter: levelUpData.hp_current,
        leveledUp: levelUpData.leveledUp,
        consumableDrop: drops.consumableDrop,
        equipmentDrop: drops.equipmentDrop,
      })
    }

    return fail('Ação não suportada.')
  } catch (error: any) {
    const message = error?.message || 'Falha interna no servidor.'

    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return fail('Configuração de segurança incompleta no servidor (SERVICE_ROLE).', 503)
    }

    if (message.includes('Sessão inválida') || message.includes('Token de autenticação')) {
      return fail(message, 401)
    }

    return fail(message, 400)
  }
}

