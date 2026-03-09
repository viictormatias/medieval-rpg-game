import { simulateCombat, Fighter } from './combat'
import { deriveSoulsStats } from './lib/soulslike'
import { ITEMS } from './lib/items'

type Build = 'tank' | 'duelist' | 'marksman'

interface ProfileLike {
    id: string
    level: number
    xp: number
    gold: number
    hp_max: number
    hp_current: number
    energy: number
    strength: number
    defense: number
    agility: number
    accuracy: number
    vigor: number
    class: string
}

interface Scenario {
    name: string
    level: number
    build: Build
    runs: number
    loadout: string[]
    enemyMultiplier: number
}

const BUILD_PRESETS: Record<Build, Omit<ProfileLike, 'id' | 'level' | 'xp' | 'gold' | 'hp_max' | 'hp_current' | 'energy' | 'class'>> = {
    tank: { strength: 8, defense: 9, agility: 5, accuracy: 5, vigor: 9 },
    duelist: { strength: 6, defense: 5, agility: 10, accuracy: 9, vigor: 7 },
    marksman: { strength: 7, defense: 5, agility: 7, accuracy: 11, vigor: 6 }
}

function scaleStats(base: typeof BUILD_PRESETS[Build], level: number) {
    const points = Math.max(0, (level - 1) * 3)
    const weights =
        base === BUILD_PRESETS.tank
            ? { strength: 0.22, defense: 0.26, agility: 0.10, accuracy: 0.10, vigor: 0.32 }
            : base === BUILD_PRESETS.duelist
                ? { strength: 0.14, defense: 0.10, agility: 0.35, accuracy: 0.28, vigor: 0.13 }
                : { strength: 0.20, defense: 0.10, agility: 0.16, accuracy: 0.40, vigor: 0.14 }

    const extra = {
        strength: Math.floor(points * weights.strength),
        defense: Math.floor(points * weights.defense),
        agility: Math.floor(points * weights.agility),
        accuracy: Math.floor(points * weights.accuracy),
        vigor: Math.floor(points * weights.vigor)
    }
    const used = extra.strength + extra.defense + extra.agility + extra.accuracy + extra.vigor
    const rem = points - used
    extra.accuracy += rem

    return {
        strength: base.strength + extra.strength,
        defense: base.defense + extra.defense,
        agility: base.agility + extra.agility,
        accuracy: base.accuracy + extra.accuracy,
        vigor: base.vigor + extra.vigor
    }
}

function createProfile(level: number, build: Build): ProfileLike {
    const scaled = scaleStats(BUILD_PRESETS[build], level)
    const hp = 100 + (scaled.vigor - 5) * 10
    return {
        id: `test-${build}-${level}`,
        level,
        xp: 0,
        gold: 0,
        hp_max: hp,
        hp_current: hp,
        energy: 100,
        strength: scaled.strength,
        defense: scaled.defense,
        agility: scaled.agility,
        accuracy: scaled.accuracy,
        vigor: scaled.vigor,
        class: 'Forasteiro'
    }
}

function enemyFromPlayer(player: Fighter, multiplier: number): Fighter {
    return {
        name: 'Enemy',
        hp: Math.floor(player.hp * multiplier),
        strength: Math.floor(player.strength * multiplier),
        minDamage: Math.floor(player.minDamage * multiplier),
        maxDamage: Math.max(
            Math.floor(player.minDamage * multiplier) + 1,
            Math.floor(player.maxDamage * multiplier)
        ),
        defense: Math.floor(player.defense * multiplier),
        agility: Math.floor(player.agility * multiplier),
        accuracy: Math.floor(player.accuracy * multiplier),
        weaponName: 'Arma Inimiga'
    }
}

function getLoadout(itemIds: string[]) {
    return itemIds
        .map(id => ITEMS.find(it => it.id === id))
        .filter(Boolean)
        .map(item => ({ ...item!, is_equipped: true, item_id: item!.id }))
}

function toFighter(profile: ProfileLike, equipped: ReturnType<typeof getLoadout>): Fighter {
    const souls = deriveSoulsStats(profile as any, equipped as any)
    return {
        name: 'Player',
        hp: profile.hp_max + (souls.hpBonus || 0),
        strength: souls.attackRating,
        minDamage: souls.minDamage,
        maxDamage: souls.maxDamage,
        defense: profile.defense + souls.bonuses.defense,
        agility: profile.agility + souls.bonuses.agility,
        accuracy: profile.accuracy + souls.bonuses.accuracy,
        weaponName: equipped.find(i => i.type === 'weapon')?.name || 'Punhos'
    }
}

function runScenario(s: Scenario) {
    const equipped = getLoadout(s.loadout)
    if (equipped.length === 0) {
        throw new Error(`Cenário sem itens válidos: ${s.name}`)
    }

    let wins = 0
    let losses = 0
    let draws = 0
    let totalTurns = 0

    for (let i = 0; i < s.runs; i++) {
        const profile = createProfile(s.level, s.build)
        const player = toFighter(profile, equipped)
        const enemy = enemyFromPlayer(player, s.enemyMultiplier)
        const result = simulateCombat(player, enemy)

        const timedOut = result.history.length >= 60
        if (timedOut) {
            draws++
        } else if (result.winner === 'Player') {
            wins++
        } else {
            losses++
        }
        totalTurns += result.history.length
    }

    const winRate = (wins / s.runs) * 100
    const lossRate = (losses / s.runs) * 100
    const drawRate = (draws / s.runs) * 100
    const avgTurns = totalTurns / s.runs

    return {
        scenario: s.name,
        winRate,
        lossRate,
        drawRate,
        avgTurns,
    }
}

const scenarios: Scenario[] = [
    {
        name: 'EARLY L1-10 Tank (Common/Uncommon)',
        level: 8,
        build: 'tank',
        runs: 300,
        loadout: ['xerife_recruit_revolver', 'xerife_worn_badge', 'xerife_patrol_hat'],
        enemyMultiplier: 1.0
    },
    {
        name: 'EARLY L1-10 Duelist (Common/Uncommon)',
        level: 9,
        build: 'duelist',
        runs: 300,
        loadout: ['short_revolver', 'cloth_hat', 'leather_gloves', 'cloth_boots'],
        enemyMultiplier: 1.0
    },
    {
        name: 'MID L11-20 Tank (Rare/Epic)',
        level: 16,
        build: 'tank',
        runs: 300,
        loadout: ['sawed_off', 'sheriff_arm_shield', 'sheriff_greaves', 'ranger_boots'],
        enemyMultiplier: 1.0
    },
    {
        name: 'MID L11-20 Duelist (Rare/Epic)',
        level: 17,
        build: 'duelist',
        runs: 300,
        loadout: ['duelist_revolver', 'duelist_gloves', 'xerife_hunt_legs', 'xerife_steel_spurs'],
        enemyMultiplier: 1.0
    },
    {
        name: 'LATE L21+ Marksman (Legendary)',
        level: 26,
        build: 'marksman',
        runs: 300,
        loadout: ['precision_rifle', 'trigger_king_hat', 'nightfang_grips', 'raven_boots'],
        enemyMultiplier: 1.0
    },
    {
        name: 'LATE L21+ Xerife Tank (Legendary)',
        level: 28,
        build: 'tank',
        runs: 300,
        loadout: ['xerife_oath_rifle', 'sheriff_coat', 'xerife_highmarshal_shield', 'xerife_legend_hat'],
        enemyMultiplier: 1.0
    }
]

console.log('=== BALANCE PASS 2 ===')
console.log(`Cenários: ${scenarios.length} | Rodadas por cenário: 300`)
console.log('')

const results = scenarios.map(runScenario)
for (const r of results) {
    console.log(`[${r.scenario}]`)
    console.log(`  WinRate: ${r.winRate.toFixed(1)}% | LossRate: ${r.lossRate.toFixed(1)}% | DrawRate: ${r.drawRate.toFixed(1)}%`)
    console.log(`  AvgTurns: ${r.avgTurns.toFixed(1)}`)
    console.log('')
}

console.log('=== QUICK READ ===')
console.log('Meta alvo aproximado:')
console.log('- Early: 45-60% de vitória')
console.log('- Mid: 50-65% de vitória')
console.log('- Late (legendary): 60-75% de vitória')
