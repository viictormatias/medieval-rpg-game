export interface Item {
    id: string;
    name: string;
    type: 'weapon' | 'armor';
    price: number;
    description: string;
    stats: {
        strength?: number;
        defense?: number;
        agility?: number;
        accuracy?: number;
        vigor?: number;
    };
    icon: string;
}

export const ITEMS: Item[] = [
    // ARMAS
    {
        id: 'rusty_dagger',
        name: 'Adaga Enferrujada',
        type: 'weapon',
        price: 50,
        description: 'Uma lâmina velha e denteada. Melhor que nada.',
        stats: { strength: 2, agility: 3 },
        icon: '🗡️'
    },
    {
        id: 'short_sword',
        name: 'Espada Curta',
        type: 'weapon',
        price: 250,
        description: 'Uma espada padrão para soldados e mercenários.',
        stats: { strength: 8, accuracy: 5 },
        icon: '⚔️'
    },
    {
        id: 'battle_axe',
        name: 'Machado de Batalha',
        type: 'weapon',
        price: 600,
        description: 'Pesado e brutal. Capaz de fender escudos.',
        stats: { strength: 18, agility: -5 },
        icon: '🪓'
    },
    {
        id: 'rapier',
        name: 'Estoque de Duelista',
        type: 'weapon',
        price: 1200,
        description: 'Uma arma elegante para aqueles que prezam a rapidez.',
        stats: { agility: 20, accuracy: 15 },
        icon: '🤺'
    },
    {
        id: 'claymore',
        name: 'Claymore de Ferro',
        type: 'weapon',
        price: 2500,
        description: 'Uma espada de duas mãos que exige força hercúlea.',
        stats: { strength: 45, agility: -10, accuracy: 10 },
        icon: '🗡️'
    },

    // ARMADURAS
    {
        id: 'leather_tunic',
        name: 'Túnica de Couro',
        type: 'armor',
        price: 80,
        description: 'Proteção básica que não restringe seus movimentos.',
        stats: { defense: 5, agility: 2 },
        icon: '👕'
    },
    {
        id: 'chainmail',
        name: 'Cota de Malha',
        type: 'armor',
        price: 400,
        description: 'Anéis de ferro interligados para proteger o tronco.',
        stats: { defense: 20, vigor: 5 },
        icon: '⛓️'
    },
    {
        id: 'plate_armor',
        name: 'Armadura de Placas',
        type: 'armor',
        price: 950,
        description: 'Uma couraça sólida que torna você um tanque humano.',
        stats: { defense: 50, agility: -8, vigor: 15 },
        icon: '🛡️'
    },
    {
        id: 'knight_armor',
        name: 'Armadura Real de Cavaleiro',
        type: 'armor',
        price: 2200,
        description: 'Forjada pelos mestres reais. O ápice da proteção.',
        stats: { defense: 100, vigor: 40, agility: -12 },
        icon: '👑'
    },
    {
        id: 'shadow_cloak',
        name: 'Manto das Sombras',
        type: 'armor',
        price: 1800,
        description: 'Torna o usuário difícil de ser atingido.',
        stats: { defense: 15, agility: 35, accuracy: 10 },
        icon: '🧤'
    }
];
