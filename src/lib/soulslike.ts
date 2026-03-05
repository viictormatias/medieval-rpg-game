import type { Item, ScalingGrade } from './items'
import type { Profile } from './gameActions'

type CoreStat = 'strength' | 'defense' | 'agility' | 'accuracy' | 'vigor'
type StatWithReq = 'strength' | 'agility' | 'accuracy' | 'vigor'
export type EquipLoadTier = 'light' | 'medium' | 'heavy' | 'overloaded'

export interface EquippedItemEntry {
    is_equipped?: boolean
    item_id?: string
    stats?: Partial<Record<CoreStat, number>>
    type?: Item['type']
    requirements?: Partial<Record<StatWithReq, number>>
    scaling?: Partial<Record<StatWithReq, ScalingGrade>>
    weight?: number
}

export interface SoulsDerivedStats {
    bonuses: Record<CoreStat, number>
    equipLoadMax: number
    equipLoadCurrent: number
    equipLoadPct: number
    equipTier: EquipLoadTier
    dodgeBonus: number
    staminaRegenPenalty: number
    attackRating: number
    requirementPenalty: number
    unmetRequirements: string[]
}

const SCALING_FACTOR: Record<ScalingGrade, number> = {
    E: 0.15,
    D: 0.3,
    C: 0.45,
    B: 0.65,
    A: 0.85,
    S: 1.05
}

export function getEquipLoadTier(pct: number): EquipLoadTier {
    if (pct < 30) return 'light'
    if (pct < 70) return 'medium'
    if (pct < 100) return 'heavy'
    return 'overloaded'
}

function tierCombatModifiers(tier: EquipLoadTier) {
    if (tier === 'light') return { dodgeBonus: 8, staminaRegenPenalty: 0 }
    if (tier === 'medium') return { dodgeBonus: 0, staminaRegenPenalty: 8 }
    if (tier === 'heavy') return { dodgeBonus: -12, staminaRegenPenalty: 22 }
    return { dodgeBonus: -30, staminaRegenPenalty: 45 }
}

export function checkItemRequirements(
    profile: Profile,
    item: Pick<Item, 'requirements' | 'name'>
) {
    const req = item.requirements || {}
    const unmet = Object.entries(req).filter(([attr, needed]) => {
        const current = (profile as any)[attr] || 0
        return current < Number(needed)
    })
    return {
        meets: unmet.length === 0,
        unmetLabels: unmet.map(([attr, needed]) => `${attr.toUpperCase()} ${needed}`)
    }
}

export function getWeaponScalingBonus(
    profile: Profile,
    weapon?: Pick<Item, 'requirements' | 'scaling'>
) {
    if (!weapon || !weapon.scaling) return 0

    let total = 0
    const scalingEntries = Object.entries(weapon.scaling) as Array<[StatWithReq, ScalingGrade]>
    scalingEntries.forEach(([stat, grade]) => {
        const req = weapon.requirements?.[stat] || 0
        const current = (profile as any)[stat] || 0
        const aboveReq = Math.max(0, current - req)
        total += aboveReq * SCALING_FACTOR[grade]
    })

    return Math.floor(total)
}

export function deriveSoulsStats(profile: Profile, equippedItems: EquippedItemEntry[]): SoulsDerivedStats {
    const bonuses: Record<CoreStat, number> = {
        strength: 0,
        defense: 0,
        agility: 0,
        accuracy: 0,
        vigor: 0
    }

    let totalWeight = 0
    const unmetRequirements: string[] = []
    const equippedWeapon = equippedItems.find(i => i.type === 'weapon')

    equippedItems.forEach((item) => {
        Object.entries(item.stats || {}).forEach(([stat, val]) => {
            if (stat in bonuses) {
                bonuses[stat as CoreStat] += Number(val || 0)
            }
        })

        totalWeight += Number(item.weight || 0)

        if (item.requirements) {
            const r = checkItemRequirements(profile, { requirements: item.requirements, name: 'item' })
            unmetRequirements.push(...r.unmetLabels)
        }
    })

    const equipLoadMax = Math.max(20, 40 + profile.vigor * 2 + profile.strength * 0.8)
    const equipLoadPct = (totalWeight / equipLoadMax) * 100
    const equipTier = getEquipLoadTier(equipLoadPct)
    const { dodgeBonus, staminaRegenPenalty } = tierCombatModifiers(equipTier)

    const scalingBonus = getWeaponScalingBonus(profile, equippedWeapon as any)
    const requirementPenalty = unmetRequirements.length > 0 ? 0.6 : 1
    const attackRating = Math.max(
        1,
        Math.floor((profile.strength + bonuses.strength + scalingBonus) * requirementPenalty)
    )

    return {
        bonuses,
        equipLoadMax,
        equipLoadCurrent: totalWeight,
        equipLoadPct,
        equipTier,
        dodgeBonus,
        staminaRegenPenalty,
        attackRating,
        requirementPenalty,
        unmetRequirements: Array.from(new Set(unmetRequirements))
    }
}
