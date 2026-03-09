import type { Item, ScalingGrade } from './items'
import type { Profile } from './gameActions'

type CoreStat = 'strength' | 'defense' | 'agility' | 'accuracy' | 'vigor'
type StatWithReq = 'strength' | 'agility' | 'accuracy' | 'vigor'

export interface EquippedItemEntry {
    is_equipped?: boolean
    item_id?: string
    stats?: Partial<Record<CoreStat, number>>
    type?: Item['type']
    requirements?: Partial<Record<StatWithReq, number>>
    scaling?: Partial<Record<StatWithReq, ScalingGrade>>
    min_damage?: number
    max_damage?: number
}

export interface SoulsDerivedStats {
    bonuses: Record<CoreStat, number>
    attackRating: number
    minDamage: number
    maxDamage: number
    requirementPenalty: number
    unmetRequirements: string[]
    hpBonus: number
}

const SCALING_FACTOR: Record<ScalingGrade, number> = {
    E: 0.15,
    D: 0.3,
    C: 0.45,
    B: 0.65,
    A: 0.85,
    S: 1.05
}

export function checkItemRequirements(
    profile: Profile,
    item: Pick<Item, 'requirements' | 'name'>
) {
    const req = item.requirements || {}
    const unmet = Object.entries(req).map(([attr, needed]) => {
        const current = (profile as any)[attr] || 0
        const isMet = current >= Number(needed)
        return {
            attr,
            needed: Number(needed),
            current,
            diff: Math.max(0, Number(needed) - current),
            isMet
        }
    }).filter(r => !r.isMet)

    const ATTRIBUTE_LABELS: Record<string, string> = {
        strength: 'FORÇA',
        agility: 'AGILIDADE',
        accuracy: 'PONTARIA',
        vigor: 'VIGOR',
        defense: 'DEFESA'
    }

    return {
        meets: unmet.length === 0,
        unmetLabels: unmet.map(([attr, needed]) => `${ATTRIBUTE_LABELS[attr] || attr.toUpperCase()} ${needed}`)
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

    const unmetRequirements: string[] = []
    const equippedWeapon = equippedItems.find(i => i.type === 'weapon')

    equippedItems.forEach((item) => {
        Object.entries(item.stats || {}).forEach(([stat, val]) => {
            if (stat in bonuses) {
                bonuses[stat as CoreStat] += Number(val || 0)
            }
        })

        if (item.requirements) {
            const r = checkItemRequirements(profile, { requirements: item.requirements, name: 'item' })
            unmetRequirements.push(...r.unmetLabels)
        }
    })

    const scalingBonus = getWeaponScalingBonus(profile, equippedWeapon as any)
    const requirementPenalty = unmetRequirements.length > 0 ? 0.5 : 1

    const minBase = equippedWeapon?.min_damage || 1
    const maxBase = equippedWeapon?.max_damage || 5

    // Scale damage by strength (30% efficiency)
    const strBonus = (profile.strength + bonuses.strength) * 0.3

    const minDamage = Math.floor((minBase + scalingBonus + strBonus) * requirementPenalty)
    const maxDamage = Math.floor((maxBase + scalingBonus + strBonus) * requirementPenalty)
    const attackRating = Math.floor((minDamage + maxDamage) / 2)

    return {
        bonuses,
        attackRating,
        minDamage,
        maxDamage,
        requirementPenalty,
        unmetRequirements: Array.from(new Set(unmetRequirements)),
        hpBonus: bonuses.vigor
    }
}
