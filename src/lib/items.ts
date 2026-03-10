export type CoreStat = 'strength' | 'defense' | 'agility' | 'accuracy' | 'vigor' | 'hp_current' | 'energy'
export type ScalingGrade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export type ItemType = 'weapon' | 'shield' | 'chest' | 'helmet' | 'gloves' | 'legs' | 'boots' | 'consumable' | 'relic'
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

type Archetype = 'lawman' | 'agile' | 'tank'

export interface Item {
    id: string
    name: string
    type: ItemType
    price: number
    description: string
    rarity: ItemRarity
    requirements?: {
        strength?: number
        agility?: number
        accuracy?: number
        vigor?: number
    }
    scaling?: {
        strength?: ScalingGrade
        agility?: ScalingGrade
        accuracy?: ScalingGrade
        vigor?: ScalingGrade
    }
    stats?: Partial<Record<CoreStat, number>>
    relic_effect?: {
        gold_per_duel_pct?: number
        item_drop_per_duel_pct?: number
    }
    min_damage?: number
    max_damage?: number
    image_url?: string
    icon: string
}

interface TierConfig {
    priceBase: number
    reqBase: number
    weaponMin: number
    weaponMax: number
    armorDefBase: number
}

interface SetTheme {
    key: string
    name: string
    archetype: Archetype
    lore: string
}

const TIER_CONFIG: Record<ItemRarity, TierConfig> = {
    common: { priceBase: 80, reqBase: 4, weaponMin: 8, weaponMax: 14, armorDefBase: 4 },
    uncommon: { priceBase: 230, reqBase: 8, weaponMin: 14, weaponMax: 24, armorDefBase: 8 },
    rare: { priceBase: 520, reqBase: 12, weaponMin: 24, weaponMax: 38, armorDefBase: 14 },
    epic: { priceBase: 1050, reqBase: 16, weaponMin: 36, weaponMax: 56, armorDefBase: 22 },
    legendary: { priceBase: 2100, reqBase: 20, weaponMin: 56, weaponMax: 84, armorDefBase: 32 }
}

const SLOT_MULTIPLIER: Record<Exclude<ItemType, 'consumable' | 'relic'>, number> = {
    weapon: 2.2,
    helmet: 1.1,
    chest: 1.8,
    gloves: 1.0,
    legs: 1.4,
    boots: 1.2,
    shield: 1.5
}

const VIGOR_CAP_BY_RARITY: Record<ItemRarity, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5
}

const VIGOR_SLOT_BONUS: Record<Exclude<ItemType, 'consumable' | 'relic'>, number> = {
    weapon: 1,
    helmet: 0,
    chest: 2,
    gloves: 0,
    legs: 1,
    boots: 0,
    shield: 1
}

const RARITY_POWER_BASE: Record<ItemRarity, number> = {
    common: 22,
    uncommon: 38,
    rare: 58,
    epic: 84,
    legendary: 116
}

const SLOT_POWER_WEIGHT: Record<Exclude<ItemType, 'consumable' | 'relic'>, number> = {
    weapon: 1.28,
    helmet: 0.72,
    chest: 1.22,
    gloves: 0.66,
    legs: 0.94,
    boots: 0.72,
    shield: 0.98
}

const SLOT_ICONS: Record<Exclude<ItemType, 'consumable' | 'relic'>, string> = {
    weapon: '🔫',
    helmet: '🤠',
    chest: '🧥',
    gloves: '🧤',
    legs: '👖',
    boots: '🥾',
    shield: '🛡️'
}

const SLOT_LABELS: Record<Exclude<ItemType, 'consumable' | 'relic'>, string> = {
    weapon: 'Arma',
    helmet: 'Chapéu',
    chest: 'Casaco',
    gloves: 'Luvas',
    legs: 'Perneiras',
    boots: 'Botas',
    shield: 'Braçadeira'
}

const SETS_BY_RARITY: Record<ItemRarity, SetTheme[]> = {
    common: [
        { key: 'pistoleiro_estrada', name: 'Pistoleiro da Estrada', archetype: 'lawman', lore: 'Jovens pistoleiros que defendiam comboios entre vilas secas.' },
        { key: 'forasteiro_po', name: 'Forasteiro do Pó', archetype: 'agile', lore: 'Bando nômade de saque rápido e passos leves nas dunas.' },
        { key: 'garimpeiro_cobre', name: 'Garimpeiro de Cobre', archetype: 'tank', lore: 'Mineiros armados que lutavam para proteger os veios de cobre.' }
    ],
    uncommon: [
        { key: 'rastreador_canyon', name: 'Rastreador de Canyon', archetype: 'agile', lore: 'Exploradores que caçavam foras-da-lei nos cânions estreitos.' },
        { key: 'mercenario_fronteira', name: 'Mercenário da Fronteira', archetype: 'tank', lore: 'Veteranos pagos a ouro para segurar muralhas e saloons.' },
        { key: 'pregador_cinzento', name: 'Pregador Cinzento', archetype: 'lawman', lore: 'Ordem de pregadores armados que impunham paz à força.' }
    ],
    rare: [
        { key: 'cacador_recompensas', name: 'Caçador de Recompensas', archetype: 'agile', lore: 'Lendas urbanas juram que nunca erravam um rosto procurado.' },
        { key: 'bandoleiro_sombrio', name: 'Bandoleiro Sombrio', archetype: 'tank', lore: 'Quadrilha de couraças pesadas conhecida por cercos violentos.' },
        { key: 'guarda_velha', name: 'Guarda Velha', archetype: 'lawman', lore: 'Antigos soldados de posto avançado, disciplina acima de tudo.' }
    ],
    epic: [
        { key: 'duelista_carmesim', name: 'Duelista Carmesim', archetype: 'agile', lore: 'Mestres de duelo ao amanhecer, famosos por golpes críticos.' },
        { key: 'guardiao_aco', name: 'Guardião de Aço', archetype: 'tank', lore: 'Companhia blindada que resistiu ao Cerco de Red Mesa.' },
        { key: 'xama_tormenta', name: 'Xamã da Tormenta', archetype: 'lawman', lore: 'Guerreiros-ritualistas que uniam precisão e resistência mental.' }
    ],
    legendary: [
        { key: 'xerife_lendario', name: 'Xerife Lendário', archetype: 'lawman', lore: 'Relíquias do último Alto Xerife, símbolo supremo de autoridade.' },
        { key: 'fantasma_deserto', name: 'Fantasma do Deserto', archetype: 'agile', lore: 'Dizem que seus usuários surgem, atiram e somem com o vento.' },
        { key: 'lobo_tempestade', name: 'Lobo da Tempestade', archetype: 'tank', lore: 'Armaduras forjadas nas tormentas de sal para guerras de atrito.' }
    ]
}

export const ITEM_SET_LORE: Record<string, string> = Object.values(SETS_BY_RARITY)
    .flat()
    .reduce((acc, set) => {
        acc[set.key] = set.lore
        return acc
    }, {} as Record<string, string>)

function withPositiveRequirements(req: Record<string, number>) {
    const out: Record<string, number> = {}
    Object.entries(req).forEach(([k, v]) => {
        if (v > 0) out[k] = v
    })
    return out
}

function buildRequirements(
    rarity: ItemRarity,
    archetype: Archetype,
    type: Exclude<ItemType, 'consumable' | 'relic'>,
    powerFactor: number = 1
) {
    const baseReq = TIER_CONFIG[rarity].reqBase + (type === 'weapon' ? 2 : 0)
    const base = Math.max(1, Math.round(baseReq * Math.max(0.9, powerFactor)))

    if (rarity === 'common' && type !== 'weapon') return undefined

    if (archetype === 'agile') {
        const req = withPositiveRequirements({ agility: base, accuracy: base - 2 })
        return Object.keys(req).length ? req : undefined
    }

    if (archetype === 'tank') {
        const req = withPositiveRequirements({ strength: base + 1, vigor: base })
        return Object.keys(req).length ? req : undefined
    }

    const req = withPositiveRequirements({ strength: base - 1, vigor: base - 1, accuracy: type === 'weapon' ? base - 2 : 0 })
    return Object.keys(req).length ? req : undefined
}

function scalePositive(val: number, factor: number) {
    return Math.max(1, Math.round(val * factor))
}

function scaleSigned(val: number, factor: number) {
    if (val < 0) return -Math.max(1, Math.round(Math.abs(val) * Math.max(1, factor * 0.9)))
    return Math.max(1, Math.round(val * factor))
}

function themePrestige(theme: SetTheme) {
    const t = `${theme.name} ${theme.lore}`.toLowerCase()
    let score = 0

    if (theme.archetype === 'tank') score += 0.03
    if (theme.archetype === 'agile') score -= 0.02

    if (t.includes('lendário') || t.includes('alto xerife') || t.includes('relíquias')) score += 0.16
    if (t.includes('tempestade') || t.includes('fantasma')) score += 0.08
    if (t.includes('aço') || t.includes('carmesim') || t.includes('recompensas')) score += 0.05
    if (t.includes('novato') || t.includes('estrada')) score -= 0.04

    return Math.max(-0.08, Math.min(0.26, score))
}

function buildWeaponStats(rarity: ItemRarity, archetype: Archetype, powerFactor: number) {
    const cfg = TIER_CONFIG[rarity]

    if (archetype === 'agile') {
        return {
            stats: {
                agility: scalePositive(Math.floor(cfg.reqBase * 0.8), powerFactor),
                accuracy: scalePositive(Math.floor(cfg.reqBase * 0.9), powerFactor),
                strength: scalePositive(Math.floor(cfg.reqBase * 0.3), powerFactor)
            },
            scaling: { agility: rarity === 'legendary' ? 'A' : rarity === 'epic' ? 'B' : 'C', accuracy: rarity === 'legendary' ? 'S' : 'B' } as Item['scaling'],
            min_damage: Math.max(1, Math.round(cfg.weaponMin * powerFactor)),
            max_damage: Math.max(2, Math.round(cfg.weaponMax * powerFactor))
        }
    }

    if (archetype === 'tank') {
        return {
            stats: {
                strength: scalePositive(Math.floor(cfg.reqBase * 1.1), powerFactor),
                vigor: scalePositive(Math.floor(cfg.reqBase * 0.8), powerFactor),
                agility: scaleSigned(-Math.floor(cfg.reqBase * 0.25), powerFactor)
            },
            scaling: { strength: rarity === 'legendary' ? 'S' : rarity === 'epic' ? 'A' : 'B', vigor: rarity === 'legendary' ? 'A' : 'B' } as Item['scaling'],
            min_damage: Math.max(1, Math.round((cfg.weaponMin + 2) * powerFactor)),
            max_damage: Math.max(2, Math.round((cfg.weaponMax + 4) * powerFactor))
        }
    }

    return {
        stats: {
            strength: scalePositive(Math.floor(cfg.reqBase * 0.7), powerFactor),
            accuracy: scalePositive(Math.floor(cfg.reqBase * 0.8), powerFactor),
            vigor: scalePositive(Math.floor(cfg.reqBase * 0.5), powerFactor)
        },
        scaling: { strength: rarity === 'legendary' ? 'A' : 'B', accuracy: rarity === 'legendary' ? 'A' : 'B', vigor: 'C' } as Item['scaling'],
        min_damage: Math.max(1, Math.round((cfg.weaponMin + 1) * powerFactor)),
        max_damage: Math.max(2, Math.round((cfg.weaponMax + 2) * powerFactor))
    }
}

function buildArmorStats(rarity: ItemRarity, archetype: Archetype, type: Exclude<ItemType, 'weapon' | 'consumable' | 'relic'>, powerFactor: number) {
    const cfg = TIER_CONFIG[rarity]
    const slotFactor: Record<typeof type, number> = {
        helmet: 0.85,
        chest: 1.7,
        gloves: 0.7,
        legs: 1.15,
        boots: 0.95,
        shield: 1.35
    }
    const slotVigorFactor: Record<typeof type, number> = {
        helmet: 0.65,
        chest: 1.15,
        gloves: 0.55,
        legs: 0.9,
        boots: 0.6,
        shield: 0.85
    }

    const defense = Math.max(2, Math.floor(cfg.armorDefBase * slotFactor[type]))

    if (archetype === 'agile') {
        return {
            defense: scalePositive(Math.max(1, defense - 2), powerFactor),
            agility: scalePositive(Math.max(1, Math.floor(cfg.reqBase * 0.35)), powerFactor),
            accuracy: scalePositive(Math.max(1, Math.floor(cfg.reqBase * 0.25)), powerFactor)
        }
    }

    if (archetype === 'tank') {
        return {
            defense: scalePositive(defense + 2, powerFactor),
            strength: scalePositive(Math.max(1, Math.floor(cfg.reqBase * 0.25)), powerFactor),
            vigor: scalePositive(Math.max(1, Math.floor(cfg.reqBase * 0.18 * slotVigorFactor[type])), powerFactor),
            agility: scaleSigned(-Math.max(1, Math.floor(cfg.reqBase * 0.15)), powerFactor)
        }
    }

    return {
        defense: scalePositive(defense, powerFactor),
        vigor: scalePositive(Math.max(1, Math.floor(cfg.reqBase * 0.14 * slotVigorFactor[type])), powerFactor),
        accuracy: scalePositive(Math.max(1, Math.floor(cfg.reqBase * 0.2)), powerFactor)
    }
}

function weaponNameForTheme(theme: SetTheme) {
    if (theme.archetype === 'agile') return `Revólver do ${theme.name}`
    if (theme.archetype === 'tank') return `Escopeta do ${theme.name}`
    return `Carabina do ${theme.name}`
}

function createSetItems(rarity: ItemRarity, theme: SetTheme): Item[] {
    const cfg = TIER_CONFIG[rarity]
    const types: Array<Exclude<ItemType, 'consumable' | 'relic'>> = ['weapon', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'shield']
    const prestige = themePrestige(theme)

    return types.map((type) => {
        const referencePrice = Math.floor(cfg.priceBase * SLOT_MULTIPLIER[type])
        const price = Math.max(40, Math.round(referencePrice * (1 + prestige)))
        const powerFactor = Math.max(0.82, Math.min(1.35, price / referencePrice))

        const item_id = `${theme.key}_${rarity}_${type}`;
        const image_url = `/images/items/${item_id}_realistic.png`;
        
        const baseItem: Item = {
            id: item_id,
            name: type === 'weapon' ? weaponNameForTheme(theme) : `${SLOT_LABELS[type]} do ${theme.name}`,
            type,
            rarity,
            price,
            description: `Conjunto ${theme.name} (${rarity}): ${theme.lore}`,
            requirements: buildRequirements(rarity, theme.archetype, type, powerFactor),
            image_url,
            icon: SLOT_ICONS[type]
        }

        if (type === 'weapon') {
            const w = buildWeaponStats(rarity, theme.archetype, powerFactor)
            return {
                ...baseItem,
                stats: w.stats,
                scaling: w.scaling,
                min_damage: w.min_damage,
                max_damage: w.max_damage
            }
        }

        return {
            ...baseItem,
            stats: buildArmorStats(rarity, theme.archetype, type, powerFactor)
        }
    })
}

function getItemPowerScore(item: Item) {
    const stats = item.stats || {}
    const statWeights: Partial<Record<CoreStat, number>> = {
        strength: 1,
        defense: 1.15,
        agility: 1,
        accuracy: 1,
        vigor: 1.1
    }

    let score = 0
    Object.entries(stats).forEach(([k, v]) => {
        const weight = statWeights[k as CoreStat] || 0
        score += Number(v || 0) * weight
    })

    if (item.type === 'weapon') {
        const avgDmg = ((item.min_damage || 0) + (item.max_damage || 0)) / 2
        score += avgDmg * 0.85
    }

    return Math.max(1, Math.round(score * 100) / 100)
}

function isEquippable(type: ItemType): type is Exclude<ItemType, 'consumable' | 'relic'> {
    return type !== 'consumable' && type !== 'relic'
}

function buildPowerMultipliers(size: number) {
    if (size <= 1) return [1]
    const min = 0.9
    const max = 1.14
    const step = (max - min) / (size - 1)
    return Array.from({ length: size }, (_, idx) => min + step * idx)
}

function scaleStatsForFactor(stats: Item['stats'], factor: number): Item['stats'] {
    if (!stats) return stats

    const out: Partial<Record<CoreStat, number>> = {}
    for (const [key, rawVal] of Object.entries(stats)) {
        const val = Number(rawVal || 0)
        if (val === 0) continue
        const scaled = val < 0
            ? -Math.max(1, Math.round(Math.abs(val) * Math.max(1, factor * 0.9)))
            : Math.max(1, Math.round(val * factor))
        out[key as CoreStat] = scaled
    }

    return out
}

function rebalanceEquipmentStatsByBudget(items: Item[]) {
    const grouped = new Map<string, Item[]>()

    items.forEach((item) => {
        if (!isEquippable(item.type)) return
        const key = `${item.rarity}:${item.type}`
        const group = grouped.get(key) || []
        group.push(item)
        grouped.set(key, group)
    })

    const scaledById = new Map<string, Item>()

    grouped.forEach((group, key) => {
        const [rarity, type] = key.split(':') as [ItemRarity, Exclude<ItemType, 'consumable' | 'relic'>]
        const sorted = [...group].sort((a, b) => a.price - b.price)
        const multipliers = buildPowerMultipliers(sorted.length)
        const baseTargetPower = RARITY_POWER_BASE[rarity] * SLOT_POWER_WEIGHT[type]

        sorted.forEach((item, idx) => {
            const currentPower = getItemPowerScore(item)
            const targetPower = baseTargetPower * multipliers[idx]
            const rawFactor = targetPower / Math.max(1, currentPower)
            const factor = Math.max(0.78, Math.min(1.26, rawFactor))

            const nextStats = scaleStatsForFactor(item.stats, factor)
            const isWeapon = item.type === 'weapon'
            const nextMin = isWeapon && typeof item.min_damage === 'number'
                ? Math.max(1, Math.round(item.min_damage * factor))
                : item.min_damage
            const nextMax = isWeapon && typeof item.max_damage === 'number'
                ? Math.max(nextMin || 2, Math.round(item.max_damage * factor))
                : item.max_damage

            scaledById.set(item.id, {
                ...item,
                stats: nextStats,
                min_damage: nextMin,
                max_damage: nextMax
            })
        })
    })

    return items.map((item) => scaledById.get(item.id) || item)
}

function rebalancePricesByPower(items: Item[]) {
    const grouped = new Map<string, Item[]>()

    items.forEach((item) => {
        const key = `${item.rarity}:${item.type}`
        const list = grouped.get(key) || []
        list.push(item)
        grouped.set(key, list)
    })

    const priced = new Map<string, number>()

    grouped.forEach((group, key) => {
        const [rarity, type] = key.split(':') as [ItemRarity, Exclude<ItemType, 'consumable' | 'relic'>]
        const basePrice = Math.floor(TIER_CONFIG[rarity].priceBase * SLOT_MULTIPLIER[type])
        const multipliers = [0.9, 1.0, 1.12]

        const sorted = [...group].sort((a, b) => getItemPowerScore(a) - getItemPowerScore(b))
        let lastPrice = 0

        sorted.forEach((item, idx) => {
            let p = Math.max(40, Math.round(basePrice * (multipliers[idx] || (1 + idx * 0.12))))
            if (p <= lastPrice) p = lastPrice + 1
            lastPrice = p
            priced.set(item.id, p)
        })
    })

    return items.map((item) => {
        const price = priced.get(item.id)
        return price ? { ...item, price } : item
    })
}

const GENERATED_SET_ITEMS_RAW: Item[] = (Object.keys(SETS_BY_RARITY) as ItemRarity[])
    .flatMap((rarity) => SETS_BY_RARITY[rarity].flatMap((theme) => createSetItems(rarity, theme)))
const GENERATED_SET_ITEMS: Item[] = rebalancePricesByPower(GENERATED_SET_ITEMS_RAW)

const BASE_ITEMS: Item[] = [
    // Compatibilidade com onboarding atual
    {
        id: 'rusty_dagger',
        name: 'Faca de Saloon',
        type: 'weapon',
        price: 50,
        rarity: 'common',
        description: 'Lâmina gasta para briga de bar.',
        requirements: { agility: 5 },
        scaling: { agility: 'C', strength: 'E' },
        stats: { strength: 3, agility: 2 },
        min_damage: 5,
        max_damage: 10,
        image_url: '/images/rusty_dagger.png',
        icon: '🔪'
    },

    ...GENERATED_SET_ITEMS,

    // Consumables
    {
        id: 'medical_kit',
        name: 'Kit Médico',
        type: 'consumable',
        price: 150,
        rarity: 'uncommon',
        description: 'Ataduras e remédios.',
        stats: { hp_current: 50 },
        image_url: '/images/medical_kit.png',
        icon: '💉'
    },
    {
        id: 'canned_beans',
        name: 'Feijão Enlatado',
        type: 'consumable',
        price: 50,
        rarity: 'common',
        description: 'Recupera o fôlego e a energia.',
        stats: { energy: 30 },
        image_url: '/images/items/canned_beans_realistic.jpg',
        icon: '🥫'
    },

    // Gloves
    { id: 'leather_gloves', name: 'Luvas de Couro', type: 'gloves', price: 90, rarity: 'common', description: 'Aderência e controle no saque.', stats: { agility: 1, accuracy: 1 }, image_url: '/images/items/leather_gloves_realistic.jpg', icon: '🧤' },
    { id: 'reinforced_gloves', name: 'Luvas Reforçadas', type: 'gloves', price: 360, rarity: 'uncommon', description: 'Boas para pancada e recoil pesado.', requirements: { strength: 8 }, stats: { defense: 9 }, image_url: '/images/items/reinforced_gloves_realistic.jpg', icon: '🥊' },
    { id: 'duelist_gloves', name: 'Luvas do Duelista', type: 'gloves', price: 760, rarity: 'rare', description: 'Feitas para tiro rápido.', requirements: { agility: 10 }, stats: { agility: 3, accuracy: 4 }, image_url: '/images/items/duelist_gloves_realistic.jpg', icon: '💨' },
    { id: 'marshal_gloves', name: 'Luvas do Marechal', type: 'gloves', price: 1300, rarity: 'epic', description: 'Aguentam briga longa sem tremer.', requirements: { strength: 14, vigor: 8 }, stats: { defense: 15, vigor: 4 }, image_url: '/images/items/marshal_gloves_realistic.jpg', icon: '🧤' },
    { id: 'nightfang_grips', name: 'Empunhadura Noturna', type: 'gloves', price: 2100, rarity: 'legendary', description: 'Controle fino para tiros letais.', requirements: { agility: 16, accuracy: 12 }, stats: { agility: 5, accuracy: 7 }, image_url: '/images/items/nightfang_grips_realistic.jpg', icon: '🌙' },

    // Legs
    { id: 'traveler_pants', name: 'Calça de Viajante', type: 'legs', price: 110, rarity: 'common', description: 'Confortável para longas cavalgadas.', stats: { agility: 2 }, image_url: '/images/items/traveler_pants_realistic.jpg', icon: '👖' },
    { id: 'leather_chaps', name: 'Perneira de Couro', type: 'legs', price: 430, rarity: 'uncommon', description: 'Proteção básica contra estilhaços.', requirements: { strength: 8 }, stats: { defense: 11 }, image_url: '/images/items/leather_chaps_realistic.jpg', icon: '👖' },
    { id: 'lined_pants', name: 'Calça Forrada', type: 'legs', price: 880, rarity: 'rare', description: 'Boa defesa sem travar o movimento.', requirements: { vigor: 8 }, stats: { defense: 14, vigor: 3 }, image_url: '/images/items/lined_pants_realistic.jpg', icon: '🛡️' },
    { id: 'sheriff_greaves', name: 'Perneira do Xerife', type: 'legs', price: 1650, rarity: 'epic', description: 'Equipamento de alto nível da lei.', requirements: { strength: 16, vigor: 10 }, stats: { defense: 22, vigor: 6 }, image_url: '/images/items/sheriff_greaves_realistic.jpg', icon: '👖' },
    { id: 'ghost_step_pants', name: 'Calça Passo Fantasma', type: 'legs', price: 2350, rarity: 'legendary', description: 'Feita para aproximação silenciosa.', requirements: { agility: 16 }, stats: { agility: 8, accuracy: 4, defense: 9 }, image_url: '/images/items/ghost_step_pants_realistic.jpg', icon: '💨' },

    // Boots
    { id: 'cloth_boots', name: 'Botas de Pano', type: 'boots', price: 70, rarity: 'common', description: 'Leves para iniciar na trilha.', stats: { agility: 1 }, image_url: '/images/items/cloth_boots_realistic.jpg', icon: '🥾' },
    { id: 'mercenary_boots', name: 'Botas de Mercenário', type: 'boots', price: 300, rarity: 'uncommon', description: 'Firmes para duelo em rua de terra.', requirements: { agility: 8 }, stats: { agility: 2, defense: 6 }, image_url: '/images/items/mercenary_boots_realistic.jpg', icon: '🥾' },
    { id: 'iron_boots', name: 'Botas Ferradas', type: 'boots', price: 700, rarity: 'rare', description: 'Passada pesada, difícil derrubar.', requirements: { strength: 10 }, stats: { defense: 11 }, image_url: '/images/items/iron_boots_realistic.jpg', icon: '👞' },
    { id: 'ranger_boots', name: 'Botas do Ranger', type: 'boots', price: 1350, rarity: 'epic', description: 'Resistentes para vigia da fronteira.', requirements: { strength: 14, vigor: 8 }, stats: { defense: 16, vigor: 4 }, image_url: '/images/items/ranger_boots_realistic.jpg', icon: '👞' },
    { id: 'raven_boots', name: 'Botas do Corvo', type: 'boots', price: 2200, rarity: 'legendary', description: 'Mobilidade extrema para emboscadas.', requirements: { agility: 18, accuracy: 12 }, stats: { agility: 7, accuracy: 5 }, image_url: '/images/items/raven_boots_realistic.jpg', icon: '🐦‍⬛' },

    // Relics
    { 
        id: 'blood_nugget', 
        name: 'Pepita de Sangue', 
        type: 'relic', 
        price: 1200, 
        rarity: 'rare', 
        description: 'Uma pepita manchada de vermelho que pulsa com vitalidade sombria.', 
        relic_effect: { gold_per_duel_pct: 15 },
        image_url: '/images/items/blood_nugget_realistic.jpg', 
        icon: '💎' 
    },
    { 
        id: 'hangman_noose', 
        name: 'Corda do Carrasco', 
        type: 'relic', 
        price: 1500, 
        rarity: 'rare', 
        description: 'Fragmento de corda antiga usada em enforcamentos na fronteira.', 
        relic_effect: { item_drop_per_duel_pct: 10 },
        image_url: '/images/items/hangman_noose_realistic.jpg', 
        icon: '🪢' 
    },
    { 
        id: 'saint_medallion', 
        name: 'Medalhão do Peregrino', 
        type: 'relic', 
        price: 1800, 
        rarity: 'rare', 
        description: 'Relíquia sagrada de metal envelhecido com símbolos de proteção.', 
        relic_effect: { gold_per_duel_pct: 10, item_drop_per_duel_pct: 5 },
        image_url: '/images/items/saint_medallion_realistic.jpg', 
        icon: '📿' 
    },
    { 
        id: 'phantom_horseshoe', 
        name: 'Ferradura Fantasma', 
        type: 'relic', 
        price: 2500, 
        rarity: 'rare', 
        description: 'Ferradura espectral envolta em poeira e energia etérea.', 
        relic_effect: { gold_per_duel_pct: 20 },
        image_url: '/images/items/phantom_horseshoe_realistic.jpg', 
        icon: '🐎' 
    },
    { 
        id: 'devils_coin', 
        name: 'Moeda do Diabo', 
        type: 'relic', 
        price: 3000, 
        rarity: 'rare', 
        description: 'Moeda amaldiçoada marcada com sigilos profanos.', 
        relic_effect: { gold_per_duel_pct: 25, item_drop_per_duel_pct: 10 },
        image_url: '/images/items/devils_coin_realistic.jpg', 
        icon: '🪙' 
    }
]

const LEGACY_ITEM_ID_ALIASES: Record<string, string> = {
    short_revolver: 'pregador_cinzento_uncommon_weapon',
    sawed_off: 'bandoleiro_sombrio_rare_weapon',
    duelist_revolver: 'duelista_carmesim_epic_weapon',
    precision_rifle: 'xerife_lendario_legendary_weapon',

    sheriff_coat: 'xerife_lendario_legendary_chest',
    cloth_hat: 'pistoleiro_estrada_common_helmet',
    leather_hat: 'pregador_cinzento_uncommon_helmet',
    sheriff_hat: 'guarda_velha_rare_helmet',
    bandit_mask: 'duelista_carmesim_epic_helmet',
    trigger_king_hat: 'xerife_lendario_legendary_helmet',

    simple_bandolier: 'garimpeiro_cobre_common_shield',
    reinforced_bandolier: 'bandoleiro_sombrio_rare_shield',
    sheriff_arm_shield: 'guardiao_aco_epic_shield',

    xerife_recruit_revolver: 'pistoleiro_estrada_common_weapon',
    xerife_patrol_revolver: 'pregador_cinzento_uncommon_weapon',
    xerife_veteran_carbine: 'guarda_velha_rare_weapon',
    xerife_oath_rifle: 'xerife_lendario_legendary_weapon',

    xerife_border_jacket: 'pregador_cinzento_uncommon_chest',
    xerife_bastion_coat: 'guardiao_aco_epic_chest',
    xerife_patrol_hat: 'pregador_cinzento_uncommon_helmet',
    xerife_legend_hat: 'xerife_lendario_legendary_helmet',
    xerife_quickdraw_gloves: 'duelista_carmesim_epic_gloves',
    xerife_hunt_legs: 'cacador_recompensas_rare_legs',
    xerife_recruit_boots: 'pistoleiro_estrada_common_boots',
    xerife_steel_spurs: 'guardiao_aco_epic_boots',
    xerife_worn_badge: 'pistoleiro_estrada_common_shield',
    xerife_tactical_bracer: 'guarda_velha_rare_shield',
    xerife_highmarshal_shield: 'xerife_lendario_legendary_shield'
}

function getVigorCap(item: Item) {
    if (!isEquippable(item.type)) return Infinity

    const rarityBase = VIGOR_CAP_BY_RARITY[item.rarity]
    const slotBonus = VIGOR_SLOT_BONUS[item.type]
    const referencePrice = Math.max(1, Math.floor(TIER_CONFIG[item.rarity].priceBase * SLOT_MULTIPLIER[item.type]))
    const priceRatio = item.price / referencePrice
    const priceBonus = Math.max(0, Math.min(2, Math.floor((priceRatio - 1) / 0.22)))

    return rarityBase + slotBonus + priceBonus
}

function applyVigorBalance(item: Item): Item {
    if (!item.stats || typeof item.stats.vigor !== 'number' || item.stats.vigor <= 0) return item

    const cap = getVigorCap(item)
    if (item.stats.vigor <= cap) return item

    return {
        ...item,
        stats: {
            ...item.stats,
            vigor: cap
        }
    }
}

const ITEMS_WITH_ALIASED_IMAGES: Item[] = BASE_ITEMS.map((item) => {
    const aliasId = LEGACY_ITEM_ID_ALIASES[item.id]
    if (!aliasId) return item

    return {
        ...item,
        image_url: `/images/items/${aliasId}_realistic.png`
    }
})

export const ITEMS: Item[] = rebalanceEquipmentStatsByBudget(ITEMS_WITH_ALIASED_IMAGES).map(applyVigorBalance)

const ITEM_BY_ID = new Map<string, Item>(ITEMS.map((item) => [item.id, item]))

export function getItemById(itemId: string): Item | undefined {
    if (ITEM_BY_ID.has(itemId)) return ITEM_BY_ID.get(itemId)
    const aliased = LEGACY_ITEM_ID_ALIASES[itemId]
    if (!aliased) return undefined
    return ITEM_BY_ID.get(aliased)
}
