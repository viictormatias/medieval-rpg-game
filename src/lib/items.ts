export type ScalingGrade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export type ItemType = 'weapon' | 'shield' | 'chest' | 'helmet' | 'gloves' | 'legs' | 'boots'

export interface Item {
    id: string
    name: string
    type: ItemType
    price: number
    description: string
    weight: number
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
    stats: {
        strength?: number
        defense?: number
        agility?: number
        accuracy?: number
        vigor?: number
    }
    icon: string
}

export const ITEMS: Item[] = [
    // Weapons
    { id: 'rusty_dagger', name: 'Adaga Enferrujada', type: 'weapon', price: 50, description: 'Uma lamina velha e denteada. Melhor que nada.', weight: 1.8, requirements: { agility: 5 }, scaling: { agility: 'C', strength: 'E' }, stats: { strength: 2, agility: 3 }, icon: '🗡️' },
    { id: 'short_sword', name: 'Espada Curta', type: 'weapon', price: 250, description: 'Uma espada padrao para soldados e mercenarios.', weight: 3.4, requirements: { strength: 8, agility: 6 }, scaling: { strength: 'D', agility: 'D' }, stats: { strength: 8, accuracy: 5 }, icon: '⚔️' },
    { id: 'battle_axe', name: 'Machado de Batalha', type: 'weapon', price: 600, description: 'Pesado e brutal. Capaz de fender escudos.', weight: 7.8, requirements: { strength: 16, agility: 4 }, scaling: { strength: 'C' }, stats: { strength: 18, agility: -5 }, icon: '🪓' },
    { id: 'rapier', name: 'Estoque de Duelista', type: 'weapon', price: 1200, description: 'Uma arma elegante para quem preza a rapidez.', weight: 2.0, requirements: { agility: 16, accuracy: 10 }, scaling: { agility: 'B', accuracy: 'D' }, stats: { agility: 20, accuracy: 15 }, icon: '🤺' },
    { id: 'claymore', name: 'Claymore de Ferro', type: 'weapon', price: 2500, description: 'Uma espada de duas maos que exige forca herculea.', weight: 11.5, requirements: { strength: 28, agility: 8 }, scaling: { strength: 'B', agility: 'E' }, stats: { strength: 45, agility: -10, accuracy: 10 }, icon: '🗡️' },

    // Chest (existing armor converted to chest)
    { id: 'leather_tunic', name: 'Tunica de Couro', type: 'chest', price: 80, description: 'Protecao basica que nao restringe movimentos.', weight: 4.6, stats: { defense: 5, agility: 2 }, icon: '👕' },
    { id: 'chainmail', name: 'Cota de Malha', type: 'chest', price: 400, description: 'Aneis de ferro interligados para proteger o tronco.', weight: 11.2, stats: { defense: 20, vigor: 5 }, icon: '⛓️' },
    { id: 'plate_armor', name: 'Armadura de Placas', type: 'chest', price: 950, description: 'Uma couraca solida que torna voce um tanque humano.', weight: 18.8, stats: { defense: 50, agility: -8, vigor: 15 }, icon: '🛡️' },
    { id: 'knight_armor', name: 'Armadura Real de Cavaleiro', type: 'chest', price: 2200, description: 'Forjada pelos mestres reais. O apice da protecao.', weight: 24.4, stats: { defense: 100, vigor: 40, agility: -12 }, icon: '👑' },
    { id: 'shadow_cloak', name: 'Manto das Sombras', type: 'chest', price: 1800, description: 'Torna o usuario dificil de ser atingido.', weight: 3.1, stats: { defense: 15, agility: 35, accuracy: 10 }, icon: '🧤' },

    // Helmets (5)
    { id: 'cloth_hood', name: 'Capuz de Linho', type: 'helmet', price: 120, description: 'Leve e discreto, protege contra cortes superficiais.', weight: 1.2, stats: { defense: 3, agility: 1 }, icon: '🪖' },
    { id: 'iron_helm', name: 'Elmo de Ferro', type: 'helmet', price: 420, description: 'Elmo comum de infantaria, confiavel e robusto.', weight: 3.6, requirements: { strength: 8 }, stats: { defense: 12, agility: -1 }, icon: '🪖' },
    { id: 'knight_helm', name: 'Elmo de Cavaleiro', type: 'helmet', price: 900, description: 'Fornalha de guerra para a linha de frente.', weight: 5.2, requirements: { strength: 12 }, stats: { defense: 22, vigor: 2, agility: -2 }, icon: '⛑️' },
    { id: 'wolf_visage', name: 'Visagem do Lobo', type: 'helmet', price: 1500, description: 'Mascara ritual que intimida inimigos.', weight: 2.8, requirements: { agility: 12 }, stats: { defense: 10, accuracy: 4, agility: 2 }, icon: '🐺' },
    { id: 'crown_of_ashes', name: 'Coroa de Cinzas', type: 'helmet', price: 2300, description: 'Reliquia de um monarca caido.', weight: 2.0, requirements: { vigor: 12, accuracy: 12 }, stats: { defense: 14, accuracy: 8, vigor: 6 }, icon: '👑' },

    // Gloves (5)
    { id: 'leather_gloves', name: 'Luvas de Couro', type: 'gloves', price: 90, description: 'Aderencia extra para armas leves.', weight: 0.8, stats: { agility: 1, accuracy: 1 }, icon: '🧤' },
    { id: 'iron_gauntlets', name: 'Manoplas de Ferro', type: 'gloves', price: 360, description: 'Protecao pesada para bloqueio de golpes.', weight: 2.9, requirements: { strength: 8 }, stats: { defense: 10, agility: -1 }, icon: '🧤' },
    { id: 'duelist_gloves', name: 'Luvas do Duelista', type: 'gloves', price: 760, description: 'Corte preciso e punho firme.', weight: 1.1, requirements: { agility: 10 }, stats: { agility: 3, accuracy: 4 }, icon: '🥊' },
    { id: 'warden_gauntlets', name: 'Manoplas do Guardiao', type: 'gloves', price: 1300, description: 'Feitas para segurar escudos pesados.', weight: 3.8, requirements: { strength: 14, vigor: 8 }, stats: { defense: 18, vigor: 4, agility: -2 }, icon: '🛡️' },
    { id: 'nightfang_grips', name: 'Garras da Presa Noturna', type: 'gloves', price: 2100, description: 'Aperto rapido e letal.', weight: 1.4, requirements: { agility: 16, accuracy: 12 }, stats: { agility: 6, accuracy: 7 }, icon: '🦇' },

    // Legs (5)
    { id: 'traveler_pants', name: 'Calcas de Viajante', type: 'legs', price: 110, description: 'Mobilidade para longas jornadas.', weight: 1.9, stats: { agility: 2 }, icon: '👖' },
    { id: 'soldier_greaves', name: 'Grevas de Soldado', type: 'legs', price: 430, description: 'Placas nos joelhos e canelas.', weight: 5.5, requirements: { strength: 8 }, stats: { defense: 12, agility: -1 }, icon: '🥾' },
    { id: 'chain_leggings', name: 'Perneiras de Malha', type: 'legs', price: 880, description: 'Protecao media sem perder fluidez.', weight: 4.3, requirements: { vigor: 8 }, stats: { defense: 16, vigor: 2 }, icon: '⛓️' },
    { id: 'knight_greaves', name: 'Grevas Reais', type: 'legs', price: 1650, description: 'Aco temperado para confrontos diretos.', weight: 8.7, requirements: { strength: 16, vigor: 10 }, stats: { defense: 26, vigor: 6, agility: -2 }, icon: '🦿' },
    { id: 'miststep_leggings', name: 'Perneiras Passo da Bruma', type: 'legs', price: 2350, description: 'Passos quase silenciosos no campo de batalha.', weight: 2.4, requirements: { agility: 16 }, stats: { agility: 8, accuracy: 4, defense: 10 }, icon: '💨' },

    // Boots (5)
    { id: 'cloth_boots', name: 'Botas de Pano', type: 'boots', price: 70, description: 'Leves, mas pouco resistentes.', weight: 0.9, stats: { agility: 1 }, icon: '👢' },
    { id: 'mercenary_boots', name: 'Botas de Mercenario', type: 'boots', price: 300, description: 'Sola firme para duelos em pedra.', weight: 1.8, requirements: { agility: 8 }, stats: { agility: 2, defense: 6 }, icon: '🥾' },
    { id: 'iron_boots', name: 'Botas de Ferro', type: 'boots', price: 700, description: 'Passadas pesadas e estaveis.', weight: 4.1, requirements: { strength: 10 }, stats: { defense: 12, agility: -1 }, icon: '🦾' },
    { id: 'paladin_boots', name: 'Botas do Paladino', type: 'boots', price: 1350, description: 'Marcha firme para os fieis da muralha.', weight: 5.0, requirements: { strength: 14, vigor: 8 }, stats: { defense: 18, vigor: 4 }, icon: '⚜️' },
    { id: 'raven_boots', name: 'Botas do Corvo', type: 'boots', price: 2200, description: 'Feitas para aproximacao rapida e golpes furtivos.', weight: 1.3, requirements: { agility: 18, accuracy: 12 }, stats: { agility: 7, accuracy: 5 }, icon: '🪶' },

    // Shields
    { id: 'wooden_shield', name: 'Escudo de Madeira', type: 'shield', price: 150, description: 'Um escudo simples de carvalho. Protecao decente.', weight: 3.2, requirements: { strength: 6 }, stats: { defense: 8, agility: -2 }, icon: '🛡️' },
    { id: 'iron_shield', name: 'Escudo de Ferro', type: 'shield', price: 600, description: 'Escudo reforcado capaz de aparar golpes fortes.', weight: 6.5, requirements: { strength: 12 }, stats: { defense: 22, agility: -5 }, icon: '🛡️' },
    { id: 'knight_shield', name: 'Escudo Real de Cavaleiro', type: 'shield', price: 1500, description: 'Grande escudo com brasoes. Defesa quase impenetravel.', weight: 10.4, requirements: { strength: 20, vigor: 8 }, stats: { defense: 45, agility: -10, vigor: 10 }, icon: '⚜️' }
]
