import { Profile } from './gameActions'
import { getItemById } from './items'

export interface StatBonuses {
    strength: number
    defense: number
    agility: number
    accuracy: number
    vigor: number
}

export interface CalculatedStats extends StatBonuses {
    hp_max: number
}

/**
 * Calcula o bônus total provido pelos itens equipados no inventário.
 */
export function getStatBonuses(inventory: any[]): StatBonuses {
    const bonuses: StatBonuses = {
        strength: 0,
        defense: 0,
        agility: 0,
        accuracy: 0,
        vigor: 0
    }

    const equippedItems = inventory.filter(inv => inv.is_equipped)

    equippedItems.forEach(inv => {
        const spec = getItemById(inv.item_id)
        if (spec && spec.stats) {
            Object.entries(spec.stats).forEach(([stat, val]) => {
                if (stat in bonuses) {
                    (bonuses as any)[stat] += (val as number)
                }
            })
        }
    })

    return bonuses
}

/**
 * Retorna os status totais (Base + Bônus) do perfil.
 */
export function getTotalStats(profile: Profile, bonuses: StatBonuses): CalculatedStats {
    return {
        strength: profile.strength + bonuses.strength,
        defense: profile.defense + bonuses.defense,
        agility: profile.agility + bonuses.agility,
        accuracy: profile.accuracy + bonuses.accuracy,
        vigor: profile.vigor + bonuses.vigor,
        hp_max: 100 + ((profile.vigor + bonuses.vigor - 5) * 10)
    }
}
