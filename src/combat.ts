// combat.ts - Motor narrativo de duelo no faroeste

export interface Fighter {
    name: string;
    hp: number;
    strength: number;
    defense: number;
    agility: number;
    accuracy: number;
    minDamage: number;
    maxDamage: number;
    weaponName?: string;
}

export interface NarrativeTurn {
    turn: number;
    attacker: string;
    defender: string;
    action: string;
    narrative: string;
    damage: number;
    resultHp: number;
    isCritical: boolean;
    isMiss: boolean;
}

export interface CombatResult {
    winner: string;
    history: NarrativeTurn[];
}

const MAX_TURNS = 120;

const NARRATIVE_TEMPLATES = {
    firearm_miss: [
        "{attacker} dispara, mas a bala raspa o vento.",
        "{defender} mergulha na terra e escapa do tiro.",
        "O tiro de {weapon} acerta apenas a poeira.",
        "{attacker} erra o alvo; {defender} mantém a calma.",
        "A bala de {weapon} passa zunindo ao lado de {defender}.",
        "{attacker} puxa o gatilho, mas {defender} já se moveu.",
        "Poeira sobe onde {defender} estava — o tiro chega tarde.",
        "{defender} abaixa rápido e o projétil passa por cima.",
        "{attacker} mira apressado e erra feio.",
        "O disparo ecoa pelo deserto, mas não acerta nada.",
        "{defender} se joga atrás de uma cobertura no último segundo.",
        "O estampido do {weapon} é alto, mas o tiro é torto."
    ],
    melee_miss: [
        "{attacker} golpeia com {weapon}, mas erra por pouco.",
        "{defender} recua e a lâmina corta o ar.",
        "{attacker} avança, mas {defender} esquiva no tempo certo.",
        "O golpe de {weapon} passa no vazio.",
        "{attacker} corta o ar — {defender} recua a tempo.",
        "{defender} se abaixa e {weapon} passa por cima.",
        "O avanço de {attacker} é rápido, mas {defender} é mais.",
        "{attacker} tenta um ataque lateral, mas {defender} bloqueia.",
        "{weapon} assobia no ar sem encontrar carne.",
        "{defender} desvia com um passo lateral preciso.",
        "{attacker} investe com fúria, mas perde o equilíbrio.",
        "O golpe de {attacker} encontra apenas o vento quente do deserto."
    ],
    firearm_hit: [
        "{attacker} acerta {art_def} {bodyPart} com {weapon}.",
        "Tiro certeiro {art_prep} {bodyPart} de {defender}.",
        "{weapon} encontra {art_def} {bodyPart} de {defender}.",
        "{attacker} perfura {art_def} {bodyPart} com chumbo.",
        "A bala de {weapon} atinge {art_def} {bodyPart} de {defender}.",
        "{attacker} puxa o gatilho e acerta {art_def} {bodyPart}.",
        "O projétil de {weapon} rasga {art_def} {bodyPart} de {defender}.",
        "Com mira firme, {attacker} alveja {art_def} {bodyPart}.",
        "Um estalo seco e {defender} sente chumbo {art_prep} {bodyPart}.",
        "{attacker} dispara sem hesitar — pega {art_prep} {bodyPart}.",
        "O tiro de {attacker} acerta em cheio {art_def} {bodyPart}.",
        "Sangue jorra quando a bala atinge {art_def} {bodyPart} de {defender}."
    ],
    melee_hit: [
        "Corte seco! {attacker} atinge {art_def} {bodyPart} com {weapon}.",
        "{attacker} rasga {art_def} {bodyPart} de {defender}.",
        "{weapon} corta {art_def} {bodyPart} de {defender}.",
        "{attacker} conecta um golpe {art_prep} {bodyPart}.",
        "{attacker} crava {weapon} {art_prep} {bodyPart} de {defender}.",
        "O fio de {weapon} morde {art_def} {bodyPart} de {defender}.",
        "{attacker} desfere um golpe pesado {art_prep} {bodyPart}.",
        "O aço de {weapon} encontra {art_def} {bodyPart} de {defender}.",
        "{attacker} avança e acerta {art_def} {bodyPart} with {weapon}.",
        "Com um movimento rápido, {attacker} fere {art_def} {bodyPart}.",
        "{weapon} arranha {art_def} {bodyPart} — {defender} grunhe de dor.",
        "{attacker} gira o corpo e conecta {weapon} {art_prep} {bodyPart}."
    ],
    firearm_crit: [
        "TIRO BRUTAL! {weapon} destrói {art_def} {bodyPart} de {defender}!",
        "PRECISÃO MORTAL! {attacker} acerta em cheio {art_def} {bodyPart}!",
        "BANG! O tiro {art_prep} {bodyPart} é devastador!",
        "QUE PONTARIA! {attacker} crava chumbo {art_prep} {bodyPart} de {defender}!",
        "IMPACTO BRUTAL! A bala entra {art_prep} {bodyPart} sem piedade!",
        "O tiro de {weapon} atinge {art_def} {bodyPart} com força absurda!",
        "DANO CRÍTICO! {attacker} perfura {art_def} {bodyPart} com {weapon}!",
        "SEM CHANCE! {defender} recebe chumbo em cheio {art_prep} {bodyPart}!",
        "O estampido ecoa e {defender} cambaleia — tiro {art_prep} {bodyPart}!",
        "MIRA CIRÚRGICA! {attacker} acerta {art_def} {bodyPart} de {defender}!"
    ],
    melee_crit: [
        "GOLPE DEVASTADOR! {attacker} crava {weapon} {art_prep} {bodyPart}!",
        "VIOLÊNCIA PURA! O corte {art_prep} {bodyPart} é profundo!",
        "{attacker} dilacera {art_def} {bodyPart} de {defender}!",
        "CORTE BRUTAL! {weapon} abre {art_def} {bodyPart} de {defender}!",
        "IMPACTO FEROZ! {attacker} atinge {art_def} {bodyPart} com toda a força!",
        "{attacker} gira {weapon} e rasga {art_def} {bodyPart} de {defender}!",
        "GOLPE CERTEIRO! O aço afunda {art_prep} {bodyPart} de {defender}!",
        "SEM PIEDADE! {attacker} retalha {art_def} {bodyPart} com {weapon}!",
        "DANO CRÍTICO! {weapon} abre um corte profundo {art_prep} {bodyPart}!",
        "O golpe de {attacker} {art_prep} {bodyPart} faz {defender} cambalear!"
    ],
    firearm_graze: [
        "TIRO DE RASPÃO! Pegou {art_prep} {bodyPart}.",
        "O projétil arranha {art_def} {bodyPart} de {defender}.",
        "A bala raspa {art_def} {bodyPart} — corte superficial.",
        "O tiro passa de raspão {art_prep} {bodyPart} de {defender}.",
        "{attacker} acerta de leve {art_def} {bodyPart}.",
        "Quase errou! Pegou {art_def} {bodyPart} de raspão."
    ],
    melee_graze: [
        "CORTE SUPERFICIAL! Atingiu {art_def} {bodyPart}.",
        "{weapon} apenas arranha {art_def} {bodyPart} de {defender}.",
        "O golpe pega {art_def} {bodyPart} de raspão.",
        "{attacker} roça {art_def} {bodyPart} de {defender} com {weapon}.",
        "Corte raso {art_prep} {bodyPart} — pouco dano.",
        "O fio de {weapon} desliza {art_prep} {bodyPart} sem ir fundo."
    ],
    narrative_firearm: [
        "{attacker} gira o tambor do revólver.",
        "{attacker} ajusta o chapéu e foca em {defender}.",
        "{attacker} mantém a mão firme no coldre.",
        "{attacker} cospe de lado e encara o alvo.",
        "{attacker} sopra a fumaça do cano de {weapon}.",
        "{attacker} ergue {weapon} devagar, mirando com calma.",
        "{attacker} dá um passo para o lado, buscando ângulo.",
        "Os olhos de {attacker} se estreitam sobre {defender}.",
        "O sol bate no cano de {weapon} enquanto {attacker} mira.",
        "{attacker} recarrega {weapon} com movimentos precisos."
    ],
    narrative_melee: [
        "{attacker} testa o fio da lâmina.",
        "{attacker} gira {weapon} na mão.",
        "{attacker} respira fundo, medindo o bote.",
        "{attacker} encara {defender} com sangue nos olhos.",
        "{attacker} passa o polegar no fio de {weapon}.",
        "{attacker} faz um gesto provocador com {weapon}.",
        "{attacker} circula {defender} como um predador.",
        "O suor escorre pelo rosto de {attacker} enquanto segura {weapon}.",
        "{attacker} troca {weapon} de mão rapidamente.",
        "{attacker} abaixa o corpo, pronto para investir."
    ],
    // ===== FRASES DE FINALIZAÇÃO — SÓ APARECEM NO GOLPE FATAL =====
    finishing_firearm: [
        "💀 ACABOU! {attacker} mete bala {art_prep} {bodyPart} e {defender} vai pro chão de vez!",
        "💀 {attacker} dá o tiro da misericórdia {art_prep} {bodyPart}. Boa noite, {defender}.",
        "💀 PÁ! Chumbo {art_prep} {bodyPart}! {defender} roda e cai feito saco de batata!",
        "💀 {defender} olha pro céu pela última vez. {attacker} não perdoou — bala {art_prep} {bodyPart}.",
        "💀 {attacker} guarda o {weapon} no coldre. Não precisa mais. {defender} tá no chão.",
        "💀 E ERA ISSO! {attacker} resolve o duelo com um tiro seco {art_prep} {bodyPart}!",
        "💀 {defender} tropeça, cambaleia... e desaba. O último tiro de {attacker} foi cirúrgico.",
        "💀 {attacker} sopra a fumaça do cano. {defender} não vai reclamar desse tiro.",
        "💀 A poeira baixa e {defender} tá estirado no chão. Chumbo quente {art_prep} {bodyPart}.",
        "💀 BANG! {defender} nem viu o que pegou! {attacker} acerta {art_def} {bodyPart} e apaga a luz!",
        "💀 O silêncio toma conta. {attacker} olha pro corpo de {defender}. Duelo encerrado.",
        "💀 {attacker} cospe no chão e vira as costas. {defender} ficou pra trás — de vez.",
        "💀 Esse foi o último suspiro de {defender}. {attacker} não errou quando importava.",
        "💀 Os abutres já tão circulando. {attacker} mandou {defender} pro outro lado com bala {art_prep} {bodyPart}."
    ],
    finishing_melee: [
        "💀 ACABOU! {attacker} enfia {weapon} {art_prep} {bodyPart} e {defender} desmorona!",
        "💀 {attacker} puxa {weapon} de volta ensanguentado. {defender} já era.",
        "💀 QUE BRUTALIDADE! O corte {art_prep} {bodyPart} derruba {defender} de uma vez!",
        "💀 {defender} cai de joelhos... e depois de cara na terra. {attacker} não teve dó.",
        "💀 {attacker} limpa {weapon} na bota. {defender} não vai mais precisar de médico.",
        "💀 E PRONTO! {attacker} resolve na lâmina! Golpe fatal {art_prep} {bodyPart}!",
        "💀 {defender} tenta se levantar, mas não rola. O golpe de {attacker} foi demais.",
        "💀 Sangue na areia. {attacker} fica de pé, {defender} não.",
        "💀 {attacker} dá um passo atrás e observa {defender} tombar. Sem pressa, sem remorso.",
        "💀 A lâmina de {weapon} brilha vermelha. {defender} tá fora do jogo.",
        "💀 {defender} nem gritou — o golpe {art_prep} {bodyPart} foi rápido demais.",
        "💀 {attacker} guarda {weapon} e tira o chapéu. Até que {defender} durou bastante.",
        "💀 Os urubus já tão de olho. {attacker} mandou {defender} dormir o sono eterno com {weapon}.",
        "💀 ERA ISSO! {attacker} crava {weapon} {art_prep} {bodyPart} e o duelo acaba aqui!"
    ]
};

function capitalize(str: string) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function interpolate(template: string, vars: any) {
    return template.replace(/{(\w+)}/g, (match, key) => vars[key] || match);
}

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function getRandomTarget(accuracy: number, agility: number) {
    const advantage = Math.max(0, accuracy - agility);
    const bonusWeight = Math.floor(advantage / 8);

    const dynamicTargets = [
        { key: 'head', name: 'Cabeça', multiplier: 1.75, weight: 6 + bonusWeight, gender: 'f', plural: false },
        { key: 'chest', name: 'Peito', multiplier: 1.15, weight: 20 + bonusWeight, gender: 'm', plural: false },
        { key: 'arm', name: 'Braço', multiplier: 0.9, weight: 24, gender: 'm', plural: false },
        { key: 'leg', name: 'Perna', multiplier: 0.9, weight: 24, gender: 'f', plural: false },
        { key: 'hand', name: 'Mão', multiplier: 0.65, weight: 13, gender: 'f', plural: false },
        { key: 'foot', name: 'Pé', multiplier: 0.65, weight: 13, gender: 'm', plural: false },
    ];

    const totalWeight = dynamicTargets.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;

    for (const target of dynamicTargets) {
        if (random < target.weight) return target;
        random -= target.weight;
    }
    return dynamicTargets[0];
}

function isFirearm(weaponName: string): boolean {
    const meleeKeywords = ['faca', 'punhal', 'canivete', 'punho', 'machado', 'lâmina', 'baioneta', 'cutelo', 'adaga', 'falcão', 'espada', 'garras', 'mordida', 'presas'];
    const name = weaponName.toLowerCase();
    return !meleeKeywords.some(kw => name.includes(kw));
}

export function simulateCombat(fighter1: Fighter, fighter2: Fighter): CombatResult {
    const f1 = {
        ...fighter1,
        name: capitalize(fighter1.name),
        weaponName: fighter1.weaponName || 'revólver'
    };
    const f2 = {
        ...fighter2,
        name: capitalize(fighter2.name),
        weaponName: fighter2.weaponName || 'faca'
    };

    let attacker = f1.agility >= f2.agility ? f1 : f2;
    let defender = attacker === f1 ? f2 : f1;
    const history: NarrativeTurn[] = [];
    let turn = 1;

    while (f1.hp > 0 && f2.hp > 0 && turn <= MAX_TURNS) {
        let damage = 0;
        let isMiss = false;
        let isCritical = false;
        let narrative = "";

        const accuracyGap = attacker.accuracy - defender.agility;
        const hitChance = clamp(62 + accuracyGap * 0.7, 12, 96);

        const target = getRandomTarget(attacker.accuracy, defender.agility);
        const hasGun = isFirearm(attacker.weaponName || '');

        // Gramática
        const artDef = target.gender === 'f' ? (target.plural ? 'as' : 'a') : (target.plural ? 'os' : 'o');
        const artPrep = target.gender === 'f' ? (target.plural ? 'nas' : 'na') : (target.plural ? 'nos' : 'no');

        const templateVars = {
            attacker: attacker.name,
            defender: defender.name,
            weapon: attacker.weaponName,
            bodyPart: target.name.toLowerCase(),
            art_def: artDef,
            art_prep: artPrep,
            damage: 0
        };

        const isNarrativeAction = Math.random() < 0.12;

        if (isNarrativeAction) {
            const actions = hasGun ? NARRATIVE_TEMPLATES.narrative_firearm : NARRATIVE_TEMPLATES.narrative_melee;
            narrative = interpolate(pickRandom(actions), templateVars);
        } else if (Math.random() * 100 > hitChance) {
            isMiss = true;
            const templates = hasGun ? NARRATIVE_TEMPLATES.firearm_miss : NARRATIVE_TEMPLATES.melee_miss;
            narrative = interpolate(pickRandom(templates), templateVars);
        } else {
            const rawBase = attacker.minDamage + Math.random() * (attacker.maxDamage - attacker.minDamage);

            // Defesa efetiva considera penetração parcial por força para reduzir extremos.
            const defensePenetration = Math.max(0, attacker.strength * 0.35);
            const effectiveDefense = Math.max(0, defender.defense - defensePenetration);
            const mitigation = 100 / (100 + effectiveDefense * 0.9);
            let finalDamage = Math.max(2, rawBase * mitigation);

            const isGraze = Math.random() < 0.18;
            if (isGraze) {
                damage = Math.max(1, Math.floor(finalDamage * 0.55));
                defender.hp = Math.max(0, defender.hp - damage);
                templateVars.damage = damage;

                const grazeTemplates = hasGun ? NARRATIVE_TEMPLATES.firearm_graze : NARRATIVE_TEMPLATES.melee_graze;
                narrative = interpolate(pickRandom(grazeTemplates), templateVars);
            } else {
                const critChance = clamp(5 + Math.max(0, accuracyGap) * 0.18, 5, 28);
                const canCrit = target.key === 'head' || target.key === 'chest';
                isCritical = canCrit && Math.random() * 100 < critChance;

                let rolledDamage = finalDamage * target.multiplier;
                if (isCritical) {
                    rolledDamage *= target.key === 'head' ? 1.4 : 1.2;
                }

                damage = Math.max(1, Math.floor(rolledDamage));
                defender.hp = Math.max(0, defender.hp - damage);
                templateVars.damage = damage;

                // Se o defensor morreu, usa frase de FINALIZAÇÃO
                if (defender.hp <= 0) {
                    const finishTemplates = hasGun ? NARRATIVE_TEMPLATES.finishing_firearm : NARRATIVE_TEMPLATES.finishing_melee;
                    narrative = interpolate(pickRandom(finishTemplates), templateVars);
                } else {
                    // Golpe normal ou crítico (mas NÃO final)
                    let templates;
                    if (isCritical) {
                        templates = hasGun ? NARRATIVE_TEMPLATES.firearm_crit : NARRATIVE_TEMPLATES.melee_crit;
                    } else {
                        templates = hasGun ? NARRATIVE_TEMPLATES.firearm_hit : NARRATIVE_TEMPLATES.melee_hit;
                    }
                    narrative = interpolate(pickRandom(templates), templateVars);
                }
            }
        }

        history.push({
            turn,
            attacker: attacker.name,
            defender: defender.name,
            action: narrative,
            narrative,
            damage,
            resultHp: defender.hp,
            isCritical,
            isMiss
        });

        if (defender.hp <= 0) break;
        [attacker, defender] = [defender, attacker];
        turn++;
    }

    return {
        winner: f1.hp > 0 ? f1.name : (f2.hp > 0 ? f2.name : 'Empate'),
        history
    };
}
