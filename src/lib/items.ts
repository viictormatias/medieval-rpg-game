export type CoreStat = 'strength' | 'defense' | 'agility' | 'accuracy' | 'vigor' | 'hp_current' | 'energy'
export type ScalingGrade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export type ItemType = 'weapon' | 'shield' | 'chest' | 'helmet' | 'gloves' | 'legs' | 'boots' | 'consumable' | 'misc'
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

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
    min_damage?: number
    max_damage?: number
    image_url?: string
    icon: string
}

export const ITEMS: Item[] = [
    // Weapons
    { id: 'rusty_dagger', name: 'Faca de Saloon', type: 'weapon', price: 50, rarity: 'common', description: 'Lâmina gasta para briga de bar.', scaling: { agility: 'C', strength: 'E' }, stats: { strength: 3, agility: 2 }, min_damage: 5, max_damage: 10, image_url: '/images/rusty_dagger.png', icon: '🔪' },
    { id: 'short_revolver', name: 'Revólver de Cano Curto', type: 'weapon', price: 250, rarity: 'uncommon', description: 'Confiável para duelos no meio da rua.', requirements: { strength: 8, agility: 6 }, scaling: { accuracy: 'D', agility: 'D' }, stats: { strength: 8, accuracy: 6 }, min_damage: 15, max_damage: 25, image_url: '/images/arma2.jpeg', icon: '🔫' },
    { id: 'sawed_off', name: 'Espingarda de Cano Serrado', type: 'weapon', price: 600, rarity: 'rare', description: 'Brutal de perto e intimidadora.', requirements: { strength: 16, agility: 4 }, scaling: { strength: 'C' }, stats: { strength: 18, agility: -4 }, min_damage: 45, max_damage: 65, image_url: '/images/sawed_off.png', icon: '💥' },
    { id: 'duelist_revolver', name: 'Revólver de Duelista', type: 'weapon', price: 1200, rarity: 'epic', description: 'Saque veloz e tiro preciso.', requirements: { agility: 16, accuracy: 10 }, scaling: { agility: 'B', accuracy: 'D' }, stats: { agility: 10, accuracy: 18, strength: 6 }, min_damage: 28, max_damage: 38, image_url: '/images/arma1.jpeg', icon: '✨' },
    { id: 'precision_rifle', name: 'Rifle de Precisão', type: 'weapon', price: 2500, rarity: 'legendary', description: 'Longo alcance e alto impacto.', requirements: { strength: 20, agility: 8 }, scaling: { strength: 'B', accuracy: 'A' }, stats: { strength: 30, agility: -6, accuracy: 20 }, min_damage: 60, max_damage: 80, image_url: '/images/precision_rifle.png', icon: '🔭' },

    // Chest
    { id: 'sheriff_coat', name: 'Casaco do Xerife', type: 'chest', price: 2900, rarity: 'legendary', description: 'Respeito e proteção em um só traje.', stats: { defense: 70, vigor: 30, agility: -8 }, image_url: '/images/sheriff_coat.png', icon: '⭐' },

    // Helmets
    { id: 'cloth_hat', name: 'Chapéu de Pano', type: 'helmet', price: 120, rarity: 'common', description: 'Protege do sol e da poeira.', stats: { defense: 3, agility: 1 }, icon: '🤠' },
    { id: 'leather_hat', name: 'Chapéu de Couro Duro', type: 'helmet', price: 420, rarity: 'uncommon', description: 'Resistente para patrulha bruta.', requirements: { strength: 8 }, stats: { defense: 10, agility: -1 }, icon: '🤠' },
    { id: 'sheriff_hat', name: 'Chapéu do Xerife', type: 'helmet', price: 900, rarity: 'rare', description: 'Marca de autoridade no condado.', requirements: { strength: 12 }, stats: { defense: 18, vigor: 3, agility: -1 }, icon: '🤠' },
    { id: 'bandit_mask', name: 'Máscara de Bandido', type: 'helmet', price: 1500, rarity: 'epic', description: 'Intimida e esconde a identidade.', requirements: { agility: 12 }, stats: { defense: 9, accuracy: 4, agility: 3 }, image_url: '/images/bandit_mask.png', icon: '🥷' },
    { id: 'trigger_king_hat', name: 'Chapéu da Lenda do Gatilho', type: 'helmet', price: 2300, rarity: 'legendary', description: 'Marca de uma lenda viva entre os pistoleiros.', requirements: { vigor: 12, accuracy: 12 }, stats: { defense: 12, accuracy: 9, vigor: 6 }, icon: '🤠' },

    // Gloves
    { id: 'leather_gloves', name: 'Luvas de Couro', type: 'gloves', price: 90, rarity: 'common', description: 'Aderência e controle no saque.', stats: { agility: 1, accuracy: 1 }, icon: '🧤' },
    { id: 'reinforced_gloves', name: 'Luvas Reforçadas', type: 'gloves', price: 360, rarity: 'uncommon', description: 'Boas para pancada e recoil pesado.', requirements: { strength: 8 }, stats: { defense: 9, agility: -1 }, icon: '🥊' },
    { id: 'duelist_gloves', name: 'Luvas do Duelista', type: 'gloves', price: 760, rarity: 'rare', description: 'Feitas para tiro rápido.', requirements: { agility: 10 }, stats: { agility: 3, accuracy: 4 }, icon: '💨' },
    { id: 'marshal_gloves', name: 'Luvas do Marechal', type: 'gloves', price: 1300, rarity: 'epic', description: 'Aguentam briga longa sem tremer.', requirements: { strength: 14, vigor: 8 }, stats: { defense: 15, vigor: 4, agility: -2 }, icon: '🧤' },
    { id: 'nightfang_grips', name: 'Empunhadura Noturna', type: 'gloves', price: 2100, rarity: 'legendary', description: 'Controle fino para tiros letais.', requirements: { agility: 16, accuracy: 12 }, stats: { agility: 5, accuracy: 7 }, icon: '🌙' },

    // Legs
    { id: 'traveler_pants', name: 'Calça de Viajante', type: 'legs', price: 110, rarity: 'common', description: 'Confortável para longas cavalgadas.', stats: { agility: 2 }, icon: '👖' },
    { id: 'leather_chaps', name: 'Perneira de Couro', type: 'legs', price: 430, rarity: 'uncommon', description: 'Proteção básica contra estilhaços.', requirements: { strength: 8 }, stats: { defense: 11, agility: -1 }, icon: '👖' },
    { id: 'lined_pants', name: 'Calça Forrada', type: 'legs', price: 880, rarity: 'rare', description: 'Boa defesa sem travar o movimento.', requirements: { vigor: 8 }, stats: { defense: 14, vigor: 3 }, icon: '🛡️' },
    { id: 'sheriff_greaves', name: 'Perneira do Xerife', type: 'legs', price: 1650, rarity: 'epic', description: 'Equipamento de alto nível da lei.', requirements: { strength: 16, vigor: 10 }, stats: { defense: 22, vigor: 6, agility: -2 }, icon: '👖' },
    { id: 'ghost_step_pants', name: 'Calça Passo Fantasma', type: 'legs', price: 2350, rarity: 'legendary', description: 'Feita para aproximação silenciosa.', requirements: { agility: 16 }, stats: { agility: 8, accuracy: 4, defense: 9 }, icon: '💨' },

    // Boots
    { id: 'cloth_boots', name: 'Botas de Pano', type: 'boots', price: 70, rarity: 'common', description: 'Leves para iniciar na trilha.', stats: { agility: 1 }, icon: '🥾' },
    { id: 'mercenary_boots', name: 'Botas de Mercenário', type: 'boots', price: 300, rarity: 'uncommon', description: 'Firmes para duelo em rua de terra.', requirements: { agility: 8 }, stats: { agility: 2, defense: 6 }, icon: '🥾' },
    { id: 'iron_boots', name: 'Botas Ferradas', type: 'boots', price: 700, rarity: 'rare', description: 'Passada pesada, difícil derrubar.', requirements: { strength: 10 }, stats: { defense: 11, agility: -1 }, icon: '👢' },
    { id: 'ranger_boots', name: 'Botas do Ranger', type: 'boots', price: 1350, rarity: 'epic', description: 'Resistentes para vigia da fronteira.', requirements: { strength: 14, vigor: 8 }, stats: { defense: 16, vigor: 4 }, icon: '👢' },
    { id: 'raven_boots', name: 'Botas do Corvo', type: 'boots', price: 2200, rarity: 'legendary', description: 'Mobilidade extrema para emboscadas.', requirements: { agility: 18, accuracy: 12 }, stats: { agility: 7, accuracy: 5 }, icon: '🐦‍⬛' },

    // Offhand (shield slot)
    { id: 'simple_bandolier', name: 'Bandoleira Simples', type: 'shield', price: 150, rarity: 'common', description: 'Peitoral lateral para segurar suprimentos e impacto.', stats: { defense: 8, agility: -1 }, icon: '🛡️' },
    { id: 'reinforced_bandolier', name: 'Bandoleira Reforçada', type: 'shield', price: 600, rarity: 'rare', description: 'Proteção extra para trocas de tiro longas.', requirements: { strength: 12 }, stats: { defense: 20, agility: -4 }, icon: '🛡️' },
    { id: 'sheriff_arm_shield', name: 'Braçadeira Reforçada do Xerife', type: 'shield', price: 1500, rarity: 'epic', description: 'Protetor de braço pesado para aguentar disparos.', requirements: { strength: 20, vigor: 8 }, stats: { defense: 38, agility: -8, vigor: 9 }, icon: '🛡️' },

    // Consumables
    { id: 'medical_kit', name: 'Kit Médico', type: 'consumable', price: 150, rarity: 'uncommon', description: 'Ataduras e remédios.', stats: { hp_current: 50 }, image_url: '/images/medical_kit.png', icon: '💉' },
    { id: 'canned_beans', name: 'Feijão Enlatado', type: 'consumable', price: 50, rarity: 'common', description: 'Recupera o fôlego e a energia.', stats: { energy: 30 }, icon: '🥫' },

    // Misc / Utilities
    { id: 'leather_bag', name: 'Alforje de Couro', type: 'misc', price: 450, rarity: 'rare', description: 'Um saco extra de montaria. Libera a BAG 2 no seu inventário permanentemente.', image_url: '/images/leather_bag.png', icon: '🎒' }
]

