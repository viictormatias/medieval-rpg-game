export type CoreStat = 'strength' | 'defense' | 'agility' | 'accuracy' | 'vigor' | 'hp_current' | 'energy'
export type ScalingGrade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export type ItemType = 'weapon' | 'shield' | 'chest' | 'helmet' | 'gloves' | 'legs' | 'boots' | 'consumable' | 'relic'
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
    relic_effect?: {
        gold_per_duel_pct?: number
        item_drop_per_duel_pct?: number
    }
    min_damage?: number
    max_damage?: number
    image_url?: string
    icon: string
}

export const ITEMS: Item[] = [
    // Weapons
    { id: 'rusty_dagger', name: 'Faca de Saloon', type: 'weapon', price: 50, rarity: 'common', description: 'LÃ¢mina gasta para briga de bar.', requirements: { agility: 5 }, scaling: { agility: 'C', strength: 'E' }, stats: { strength: 3, agility: 2 }, min_damage: 5, max_damage: 10, image_url: '/images/rusty_dagger.png', icon: 'ðŸ”ª' },
    { id: 'short_revolver', name: 'RevÃ³lver de Cano Curto', type: 'weapon', price: 250, rarity: 'uncommon', description: 'ConfiÃ¡vel para duelos no meio da rua.', requirements: { strength: 8, agility: 6 }, scaling: { accuracy: 'D', agility: 'D' }, stats: { strength: 8, accuracy: 6 }, min_damage: 15, max_damage: 25, image_url: '/images/arma2.jpeg', icon: 'ðŸ”«' },
    { id: 'sawed_off', name: 'Espingarda de Cano Serrado', type: 'weapon', price: 600, rarity: 'rare', description: 'Brutal de perto e intimidadora.', requirements: { strength: 16, agility: 4 }, scaling: { strength: 'C' }, stats: { strength: 18 }, min_damage: 45, max_damage: 65, image_url: '/images/sawed_off.png', icon: 'ðŸ’¥' },
    { id: 'duelist_revolver', name: 'RevÃ³lver de Duelista', type: 'weapon', price: 1200, rarity: 'epic', description: 'Saque veloz e tiro preciso.', requirements: { agility: 16, accuracy: 10 }, scaling: { agility: 'B', accuracy: 'D' }, stats: { agility: 10, accuracy: 18, strength: 6 }, min_damage: 28, max_damage: 38, image_url: '/images/arma1.jpeg', icon: 'âœ¨' },
    { id: 'precision_rifle', name: 'Rifle de PrecisÃ£o', type: 'weapon', price: 2500, rarity: 'legendary', description: 'Longo alcance e alto impacto.', requirements: { strength: 20, agility: 8 }, scaling: { strength: 'B', accuracy: 'A' }, stats: { strength: 30, accuracy: 20 }, min_damage: 60, max_damage: 80, image_url: '/images/precision_rifle.png', icon: 'ðŸ”­' },

    // Chest
    { id: 'dusty_poncho', name: 'Poncho Empoeirado', type: 'chest', price: 260, rarity: 'common', description: 'Tecido grosso, jÃ¡ gasto pela estrada. Protege do vento e de alguns estilhaÃ§os.', stats: { defense: 10, vigor: 4 }, image_url: '/images/items/dusty_poncho_realistic.png', icon: 'ðŸ§¥' },
    { id: 'reinforced_poncho', name: 'Poncho ReforÃ§ado', type: 'chest', price: 780, rarity: 'uncommon', description: 'Forrado com couro cru e placas discretas de metal.', requirements: { vigor: 6 }, stats: { defense: 22, vigor: 8 }, image_url: '/images/items/reinforced_poncho_realistic.png', icon: 'ðŸ§¥' },
    { id: 'steel_lined_coat', name: 'Casaco Forrado de AÃ§o', type: 'chest', price: 1450, rarity: 'rare', description: 'Placas de aÃ§o escondidas sob o tecido pesado, ideal para duelos urbanos.', requirements: { strength: 12, vigor: 8 }, stats: { defense: 36, vigor: 12 }, image_url: '/images/items/steel_lined_coat_realistic.png', icon: 'ðŸ§¥' },
    { id: 'marshal_trenchcoat', name: 'Sobretudo do Marechal', type: 'chest', price: 2300, rarity: 'epic', description: 'PeÃ§a oficial dos marechais federais, feita para aguentar chuva de chumbo.', requirements: { strength: 16, vigor: 12 }, stats: { defense: 52, vigor: 20 }, image_url: '/images/items/marshal_trenchcoat_realistic.png', icon: 'ðŸ§¥' },
    { id: 'sheriff_coat', name: 'Casaco do Xerife', type: 'chest', price: 2900, rarity: 'legendary', description: 'Respeito e proteÃ§Ã£o em um sÃ³ traje.', stats: { defense: 70, vigor: 30 }, image_url: '/images/items/sheriff_coat_realistic.png', icon: 'â­' },

    // Helmets
    { id: 'cloth_hat', name: 'ChapÃ©u de Pano', type: 'helmet', price: 120, rarity: 'common', description: 'Protege do sol e da poeira.', stats: { defense: 3, agility: 1 }, image_url: '/images/items/cloth_hat_realistic.png', icon: 'ðŸ¤ ' },
    { id: 'leather_hat', name: 'ChapÃ©u de Couro Duro', type: 'helmet', price: 420, rarity: 'uncommon', description: 'Resistente para patrulha bruta.', requirements: { strength: 8 }, stats: { defense: 10 }, image_url: '/images/items/leather_hat_realistic.jpg', icon: 'ðŸ¤ ' },
    { id: 'sheriff_hat', name: 'ChapÃ©u do Xerife', type: 'helmet', price: 900, rarity: 'rare', description: 'Marca de autoridade no condado.', requirements: { strength: 12 }, stats: { defense: 18, vigor: 3 }, image_url: '/images/items/sheriff_hat_realistic.jpg', icon: 'ðŸ¤ ' },
    { id: 'bandit_mask', name: 'MÃ¡scara de Bandido', type: 'helmet', price: 1500, rarity: 'epic', description: 'Intimida e esconde a identidade.', requirements: { agility: 12 }, stats: { defense: 9, accuracy: 4, agility: 3 }, image_url: '/images/items/bandit_mask_realistic.jpg', icon: 'ðŸ¥·' },
    { id: 'trigger_king_hat', name: 'ChapÃ©u da Lenda do Gatilho', type: 'helmet', price: 2300, rarity: 'legendary', description: 'Marca de uma lenda viva entre os pistoleiros.', requirements: { vigor: 12, accuracy: 12 }, stats: { defense: 12, accuracy: 9, vigor: 6 }, image_url: '/images/items/trigger_king_hat_realistic.jpg', icon: 'ðŸ¤ ' },

    // Gloves
    { id: 'leather_gloves', name: 'Luvas de Couro', type: 'gloves', price: 90, rarity: 'common', description: 'AderÃªncia e controle no saque.', stats: { agility: 1, accuracy: 1 }, image_url: '/images/items/leather_gloves_realistic.jpg', icon: 'ðŸ§¤' },
    { id: 'reinforced_gloves', name: 'Luvas ReforÃ§adas', type: 'gloves', price: 360, rarity: 'uncommon', description: 'Boas para pancada e recoil pesado.', requirements: { strength: 8 }, stats: { defense: 9 }, image_url: '/images/items/reinforced_gloves_realistic.jpg', icon: 'ðŸ¥Š' },
    { id: 'duelist_gloves', name: 'Luvas do Duelista', type: 'gloves', price: 760, rarity: 'rare', description: 'Feitas para tiro rÃ¡pido.', requirements: { agility: 10 }, stats: { agility: 3, accuracy: 4 }, image_url: '/images/items/duelist_gloves_realistic.jpg', icon: 'ðŸ’¨' },
    { id: 'marshal_gloves', name: 'Luvas do Marechal', type: 'gloves', price: 1300, rarity: 'epic', description: 'Aguentam briga longa sem tremer.', requirements: { strength: 14, vigor: 8 }, stats: { defense: 15, vigor: 4 }, image_url: '/images/items/marshal_gloves_realistic.jpg', icon: 'ðŸ§¤' },
    { id: 'nightfang_grips', name: 'Empunhadura Noturna', type: 'gloves', price: 2100, rarity: 'legendary', description: 'Controle fino para tiros letais.', requirements: { agility: 16, accuracy: 12 }, stats: { agility: 5, accuracy: 7 }, image_url: '/images/items/nightfang_grips_realistic.jpg', icon: 'ðŸŒ™' },

    // Legs
    { id: 'traveler_pants', name: 'CalÃ§a de Viajante', type: 'legs', price: 110, rarity: 'common', description: 'ConfortÃ¡vel para longas cavalgadas.', stats: { agility: 2 }, image_url: '/images/items/traveler_pants_realistic.jpg', icon: 'ðŸ‘–' },
    { id: 'leather_chaps', name: 'Perneira de Couro', type: 'legs', price: 430, rarity: 'uncommon', description: 'ProteÃ§Ã£o bÃ¡sica contra estilhaÃ§os.', requirements: { strength: 8 }, stats: { defense: 11 }, image_url: '/images/items/leather_chaps_realistic.jpg', icon: 'ðŸ‘–' },
    { id: 'lined_pants', name: 'CalÃ§a Forrada', type: 'legs', price: 880, rarity: 'rare', description: 'Boa defesa sem travar o movimento.', requirements: { vigor: 8 }, stats: { defense: 14, vigor: 3 }, image_url: '/images/items/lined_pants_realistic.jpg', icon: 'ðŸ›¡ï¸' },
    { id: 'sheriff_greaves', name: 'Perneira do Xerife', type: 'legs', price: 1650, rarity: 'epic', description: 'Equipamento de alto nÃ­vel da lei.', requirements: { strength: 16, vigor: 10 }, stats: { defense: 22, vigor: 6 }, image_url: '/images/items/sheriff_greaves_realistic.jpg', icon: 'ðŸ‘–' },
    { id: 'ghost_step_pants', name: 'CalÃ§a Passo Fantasma', type: 'legs', price: 2350, rarity: 'legendary', description: 'Feita para aproximaÃ§Ã£o silenciosa.', requirements: { agility: 16 }, stats: { agility: 8, accuracy: 4, defense: 9 }, image_url: '/images/items/ghost_step_pants_realistic.jpg', icon: 'ðŸ’¨' },

    // Boots
    { id: 'cloth_boots', name: 'Botas de Pano', type: 'boots', price: 70, rarity: 'common', description: 'Leves para iniciar na trilha.', stats: { agility: 1 }, image_url: '/images/items/cloth_boots_realistic.jpg', icon: 'ðŸ¥¾' },
    { id: 'mercenary_boots', name: 'Botas de MercenÃ¡rio', type: 'boots', price: 300, rarity: 'uncommon', description: 'Firmes para duelo em rua de terra.', requirements: { agility: 8 }, stats: { agility: 2, defense: 6 }, image_url: '/images/items/mercenary_boots_realistic.jpg', icon: 'ðŸ¥¾' },
    { id: 'iron_boots', name: 'Botas Ferradas', type: 'boots', price: 700, rarity: 'rare', description: 'Passada pesada, difÃ­cil derrubar.', requirements: { strength: 10 }, stats: { defense: 11 }, image_url: '/images/items/iron_boots_realistic.jpg', icon: 'ðŸ‘¢' },
    { id: 'ranger_boots', name: 'Botas do Ranger', type: 'boots', price: 1350, rarity: 'epic', description: 'Resistentes para vigia da fronteira.', requirements: { strength: 14, vigor: 8 }, stats: { defense: 16, vigor: 4 }, image_url: '/images/items/ranger_boots_realistic.jpg', icon: 'ðŸ‘¢' },
    { id: 'raven_boots', name: 'Botas do Corvo', type: 'boots', price: 2200, rarity: 'legendary', description: 'Mobilidade extrema para emboscadas.', requirements: { agility: 18, accuracy: 12 }, stats: { agility: 7, accuracy: 5 }, image_url: '/images/items/raven_boots_realistic.jpg', icon: 'ðŸ¦â€â¬›' },

    // Acessorio defensivo (slot extra)
    { id: 'simple_bandolier', name: 'Bandoleira Simples', type: 'shield', price: 150, rarity: 'common', description: 'Peitoral lateral para segurar suprimentos e impacto.', requirements: { strength: 6 }, stats: { defense: 8 }, image_url: '/images/items/simple_bandolier_realistic.jpg', icon: 'ðŸ›¡ï¸' },
    { id: 'reinforced_sling', name: 'Bandoleira Rebitada', type: 'shield', price: 360, rarity: 'uncommon', description: 'Correias reforÃ§adas e placas leves para aguentar os primeiros tiroteios sÃ©rios.', requirements: { strength: 8 }, stats: { defense: 14 }, image_url: '/images/items/reinforced_sling_realistic.jpg', icon: 'ðŸ›¡ï¸' },
    { id: 'reinforced_bandolier', name: 'Bandoleira ReforÃ§ada', type: 'shield', price: 600, rarity: 'rare', description: 'ProteÃ§Ã£o extra para trocas de tiro longas.', requirements: { strength: 12 }, stats: { defense: 20 }, image_url: '/images/items/reinforced_bandolier_realistic.jpg', icon: 'ðŸ›¡ï¸' },
    { id: 'sheriff_arm_shield', name: 'BraÃ§adeira ReforÃ§ada do Xerife', type: 'shield', price: 1500, rarity: 'epic', description: 'Protetor de braÃ§o pesado para aguentar disparos.', requirements: { strength: 20, vigor: 8 }, stats: { defense: 38, vigor: 9 }, image_url: '/images/items/sheriff_arm_shield_realistic.jpg', icon: 'ðŸ›¡ï¸' },
    { id: 'iron_star_buckler', name: 'Broquel Estrela de Ferro', type: 'shield', price: 2600, rarity: 'legendary', description: 'Um escudo compacto com a estrela do condado, feito para quem nunca recua.', requirements: { strength: 22, vigor: 10 }, stats: { defense: 52, vigor: 14 }, image_url: '/images/items/iron_star_buckler_realistic.jpg', icon: 'â­' },

    // Consumables
    { id: 'medical_kit', name: 'Kit MÃ©dico', type: 'consumable', price: 150, rarity: 'uncommon', description: 'Ataduras e remÃ©dios.', stats: { hp_current: 50 }, image_url: '/images/medical_kit.png', icon: 'ðŸ’‰' },
    { id: 'canned_beans', name: 'FeijÃ£o Enlatado', type: 'consumable', price: 50, rarity: 'common', description: 'Recupera o fÃ´lego e a energia.', stats: { energy: 30 }, image_url: '/images/items/canned_beans_realistic.jpg', icon: 'ðŸ¥«' },

    // Relics
    { id: 'blood_nugget', name: 'Pepita de Sangue', type: 'relic', price: 1200, rarity: 'rare', description: 'Uma pepita amaldiçoada que atrai riqueza nos duelos.', requirements: { vigor: 12 }, relic_effect: { gold_per_duel_pct: 12 }, image_url: '/images/items/blood_nugget_realistic.jpg', icon: '*' },
    { id: 'hangman_noose', name: 'Corda do Carrasco', type: 'relic', price: 1500, rarity: 'epic', description: 'A presença da forca parece puxar espólios dos derrotados.', requirements: { strength: 16 }, relic_effect: { item_drop_per_duel_pct: 10 }, image_url: '/images/items/hangman_noose_realistic.jpg', icon: '~' },
    { id: 'saint_medallion', name: 'Medalhão do Peregrino', type: 'relic', price: 2100, rarity: 'epic', description: 'Um talismã de fortuna que aumenta o pagamento de cada vitória.', requirements: { accuracy: 14, vigor: 10 }, relic_effect: { gold_per_duel_pct: 18 }, image_url: '/images/items/saint_medallion_realistic.jpg', icon: 'o' },
    { id: 'phantom_horseshoe', name: 'Ferradura Fantasma', type: 'relic', price: 2600, rarity: 'legendary', description: 'Sussurros da ferradura atraem mais itens no pós-duelo.', requirements: { agility: 18 }, relic_effect: { item_drop_per_duel_pct: 16 }, image_url: '/images/items/phantom_horseshoe_realistic.jpg', icon: 'u' },
    { id: 'devils_coin', name: 'Moeda do Diabo', type: 'relic', price: 3000, rarity: 'legendary', description: 'Cada duelo vencido rende mais ouro para quem carrega esta moeda.', requirements: { strength: 18, accuracy: 14 }, relic_effect: { gold_per_duel_pct: 25 }, image_url: '/images/items/devils_coin_realistic.jpg', icon: '$' }
]



