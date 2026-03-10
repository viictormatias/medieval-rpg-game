import fs from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

const BASE_CLASS_STAT_SUM = 10
const ONBOARDING_STAT_POINTS = 5

const ENEMY_BUILD_BY_NAME = {
  'Larápio de Saloon': { strength: 9, defense: 6, agility: 12, accuracy: 10, vigor: 7 },
  'Saqueador Ardil': { strength: 10, defense: 7, agility: 14, accuracy: 13, vigor: 8 },
  'Bandido de Estrada': { strength: 9, defense: 6, agility: 9, accuracy: 9, vigor: 7 },
  'Desperado Solitário': { strength: 10, defense: 8, agility: 11, accuracy: 14, vigor: 8 },
  'Xerife Renegado': { strength: 11, defense: 11, agility: 8, accuracy: 10, vigor: 10 },
  'Billy the Kid, O Relampago': { strength: 12, defense: 9, agility: 18, accuracy: 17, vigor: 8 },
  'Jesse James, Sombra do Trem': { strength: 13, defense: 9, agility: 15, accuracy: 14, vigor: 9 },
  'Doc Holliday, As de Sangue': { strength: 11, defense: 9, agility: 16, accuracy: 19, vigor: 9 },
  'Annie Oakley, Mira Implacavel': { strength: 9, defense: 8, agility: 14, accuracy: 22, vigor: 8 },
  'Butch Cassidy, Rei do Assalto': { strength: 14, defense: 10, agility: 14, accuracy: 13, vigor: 10 },
  'Sundance Kid, Passo Fantasma': { strength: 11, defense: 9, agility: 20, accuracy: 15, vigor: 9 },
  'Calamity Jane, Tempestade Escarlate': { strength: 13, defense: 9, agility: 13, accuracy: 15, vigor: 10 },
  'Wyatt Earp, Lei de Ferro': { strength: 15, defense: 16, agility: 12, accuracy: 17, vigor: 14 },
}

function getEnemyStatBudget(level) {
  return BASE_CLASS_STAT_SUM + ONBOARDING_STAT_POINTS + (level - 1) * 3
}

function distributeByWeights(total, weights) {
  const keys = ['strength', 'defense', 'agility', 'accuracy', 'vigor']
  const sum = keys.reduce((acc, k) => acc + weights[k], 0)
  const out = {}
  for (const k of keys) out[k] = Math.max(1, Math.round((total * weights[k]) / sum))
  let diff = total - keys.reduce((acc, k) => acc + out[k], 0)
  while (diff !== 0) {
    for (const k of keys) {
      if (diff === 0) break
      if (diff > 0) {
        out[k] += 1
        diff -= 1
      } else if (out[k] > 1) {
        out[k] -= 1
        diff += 1
      }
    }
  }
  return out
}

function getEnemyBaseStats(enemy) {
  const total = getEnemyStatBudget(enemy.level)
  const build = ENEMY_BUILD_BY_NAME[enemy.name]

  const weights = build
    ? {
        strength: Math.max(1, build.strength + Math.round((enemy.strength || 1) * 0.2)),
        defense: Math.max(1, build.defense + Math.round(enemy.level * 0.15)),
        agility: Math.max(1, build.agility + Math.round((enemy.agility || 1) * 0.2)),
        accuracy: Math.max(1, build.accuracy + Math.round((enemy.precision || 1) * 0.2)),
        vigor: Math.max(1, build.vigor + Math.round(enemy.level * 0.15)),
      }
    : {
        strength: Math.max(1, enemy.strength || 1),
        defense: Math.max(1, Math.round(enemy.level * 0.8)),
        agility: Math.max(1, enemy.agility || 1),
        accuracy: Math.max(1, enemy.precision || 1),
        vigor: Math.max(1, Math.round(enemy.level * 0.8)),
      }

  const stats = distributeByWeights(total, weights)
  return { ...stats, hp_max: 100 + stats.vigor * 10 }
}

function buildPlayerForLevel(level) {
  const total = getEnemyStatBudget(level)
  const stats = distributeByWeights(total, {
    strength: 0.21,
    defense: 0.2,
    agility: 0.2,
    accuracy: 0.24,
    vigor: 0.15,
  })
  const hp = 100 + stats.vigor * 10

  // Benchmark neutro: dano de arma na mesma ordem do inimigo (baseado em força).
  const minDamage = Math.max(3, Math.floor(stats.strength * 0.8))
  const maxDamage = Math.max(minDamage + 2, Math.floor(stats.strength * 1.2))

  return {
    name: 'Player Benchmark',
    hp,
    strength: stats.strength,
    defense: stats.defense,
    agility: stats.agility,
    accuracy: stats.accuracy,
    minDamage,
    maxDamage,
  }
}

function getRandomTarget(accuracy, agility) {
  const advantage = Math.max(0, accuracy - agility)
  const bonusWeight = Math.floor(advantage / 8)
  const targets = [
    { key: 'head', multiplier: 1.75, weight: 6 + bonusWeight },
    { key: 'chest', multiplier: 1.15, weight: 20 + bonusWeight },
    { key: 'arm', multiplier: 0.9, weight: 24 },
    { key: 'leg', multiplier: 0.9, weight: 24 },
    { key: 'hand', multiplier: 0.65, weight: 13 },
    { key: 'foot', multiplier: 0.65, weight: 13 },
  ]
  const total = targets.reduce((s, t) => s + t.weight, 0)
  let r = Math.random() * total
  for (const t of targets) {
    if (r < t.weight) return t
    r -= t.weight
  }
  return targets[0]
}

function simulateCombatFast(f1, f2, maxTurns = 60) {
  const a = { ...f1 }
  const b = { ...f2 }
  let attacker = a.agility >= b.agility ? a : b
  let defender = attacker === a ? b : a

  for (let turn = 1; turn <= maxTurns; turn += 1) {
    const narrativeSkip = Math.random() < 0.12
    if (!narrativeSkip) {
      const accuracyGap = attacker.accuracy - defender.agility
      const hitChance = clamp(62 + accuracyGap * 0.7, 12, 96)
      if (Math.random() * 100 <= hitChance) {
        const rawBase = attacker.minDamage + Math.random() * (attacker.maxDamage - attacker.minDamage)
        const defensePenetration = Math.max(0, attacker.strength * 0.35)
        const effectiveDefense = Math.max(0, defender.defense - defensePenetration)
        const mitigation = 100 / (100 + effectiveDefense * 0.9)
        const finalDamage = Math.max(2, rawBase * mitigation)
        const isGraze = Math.random() < 0.18
        let damage = 0

        if (isGraze) {
          damage = Math.max(1, Math.floor(finalDamage * 0.55))
        } else {
          const target = getRandomTarget(attacker.accuracy, defender.agility)
          const critChance = clamp(5 + Math.max(0, accuracyGap) * 0.18, 5, 28)
          const canCrit = target.key === 'head' || target.key === 'chest'
          const isCritical = canCrit && Math.random() * 100 < critChance
          let rolledDamage = finalDamage * target.multiplier
          if (isCritical) rolledDamage *= target.key === 'head' ? 1.4 : 1.2
          damage = Math.max(1, Math.floor(rolledDamage))
        }

        defender.hp = Math.max(0, defender.hp - damage)
        if (defender.hp <= 0) return attacker.name
      }
    }

    ;[attacker, defender] = [defender, attacker]
  }

  return a.hp >= b.hp ? a.name : b.name
}

async function loadEnv() {
  const raw = await fs.readFile('.env.local', 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    const v = t.slice(i + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

async function main() {
  await loadEnv()
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: enemies, error } = await sb
    .from('npc_enemies')
    .select('id,name,level,hp_max,strength,agility,precision')
    .order('level', { ascending: true })
  if (error) throw error

  const runs = 1200
  const results = []
  for (const enemy of enemies || []) {
    let playerWins = 0
    for (let i = 0; i < runs; i += 1) {
      const p = buildPlayerForLevel(enemy.level)
      const eBase = getEnemyBaseStats(enemy)
      const e = {
        name: enemy.name,
        hp: eBase.hp_max,
        strength: eBase.strength,
        defense: eBase.defense,
        agility: eBase.agility,
        accuracy: eBase.accuracy,
        minDamage: Math.floor(eBase.strength * 0.8),
        maxDamage: Math.floor(eBase.strength * 1.2),
      }
      const winner = simulateCombatFast(p, e)
      if (winner === p.name) playerWins += 1
    }
    const winRate = (playerWins / runs) * 100
    results.push({
      enemy: enemy.name,
      level: enemy.level,
      tier: enemy.level >= 20 ? 'tier2' : 'tier1',
      playerWinRatePct: Number(winRate.toFixed(1)),
    })
  }

  const tier1 = results.filter((r) => r.tier === 'tier1')
  const tier2 = results.filter((r) => r.tier === 'tier2')
  const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x.playerWinRatePct, 0) / arr.length : 0)

  const summary = {
    runsPerEnemy: runs,
    tier1AvgWinRate: Number(avg(tier1).toFixed(1)),
    tier2AvgWinRate: Number(avg(tier2).toFixed(1)),
    results,
  }

  await fs.mkdir('artifacts', { recursive: true })
  await fs.writeFile('artifacts/enemy-balance-sim.json', JSON.stringify(summary, null, 2), 'utf8')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
