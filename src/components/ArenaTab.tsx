'use client'

import { useEffect, useState, useRef, CSSProperties } from 'react'
import { Profile, Enemy, COMBAT_ENERGY_COST, beginArenaCombat, getEnemies, getUserInventory, resolveArenaCombat, ONBOARDING_STAT_POINTS } from '@/lib/gameActions'
import { simulateCombat, Fighter, NarrativeTurn } from '@/combat'
import { getOptimizedAssetSrc } from '@/lib/assets'
import { ITEMS as CATALOG_ITEMS, Item, ItemRarity, getItemById } from '@/lib/items'
import { deriveSoulsStats, SoulsDerivedStats } from '@/lib/soulslike'
import CharacterPortrait from './CharacterPortrait'
import StatBar from './StatBar'
import Lightbox from './Lightbox'

const RARITY_COLORS: Record<string, { border: string; glow: string; label: string; textColor: string }> = {
    common: { border: '#3a3a3a', glow: 'transparent', label: 'Comum', textColor: '#9ca3af' },
    uncommon: { border: '#22c55e', glow: 'rgba(34,197,94,0.3)', label: 'Incomum', textColor: '#4ade80' },
    rare: { border: '#3b82f6', glow: 'rgba(59,130,246,0.3)', label: 'Raro', textColor: '#60a5fa' },
    epic: { border: '#a855f7', glow: 'rgba(168,85,247,0.4)', label: 'Épico', textColor: '#c084fc' },
    legendary: { border: '#f2b90d', glow: 'rgba(242,185,13,0.4)', label: 'Lendário', textColor: '#f2b90d' },
}

const CLASS_PORTRAITS: Record<string, string> = {
    'Xerife': '/images/xerife.jpeg',
    'Pistoleiro': '/images/pistoleiro.jpeg',
    'Forasteiro': '/images/forasteiro.jpeg',
    'Pregador': '/images/pregador.jpeg',
    'Nativo': '/images/nativo.jpeg',
    'Vendedor': '/images/mercador.jpeg',
    'CacadorDeRecompensas': '/images/cacador-de-recompensas.jpeg'
}

function getEnemyPortraitSrc(enemyId?: string | null) {
    if (!enemyId) return null
    return `/images/enemies/${enemyId}.png`
}

const BASE_CLASS_STAT_SUM = 10

function getEnemyStatBudget(level: number) {
    return BASE_CLASS_STAT_SUM + ONBOARDING_STAT_POINTS + (level - 1) * 3
}

type EnemyBuildWeights = {
    strength: number
    defense: number
    agility: number
    accuracy: number
    vigor: number
}

// Build contextual por nome/fantasia do inimigo (foco de atributos).
const ENEMY_BUILD_BY_NAME: Record<string, EnemyBuildWeights> = {
    'Larápio de Saloon': { strength: 9, defense: 6, agility: 12, accuracy: 10, vigor: 7 },
    'Saqueador Ardil': { strength: 10, defense: 7, agility: 14, accuracy: 13, vigor: 8 },
    'Bandido de Estrada': { strength: 9, defense: 6, agility: 9, accuracy: 9, vigor: 7 },
    'Desperado Solitário': { strength: 10, defense: 8, agility: 11, accuracy: 14, vigor: 8 },
    'Xerife Renegado': { strength: 11, defense: 11, agility: 8, accuracy: 10, vigor: 10 },

    'Billy the Kid, O Relampago': { strength: 12, defense: 9, agility: 18, accuracy: 17, vigor: 8 },
    'Jesse James, Sombra do Trem': { strength: 13, defense: 9, agility: 15, accuracy: 14, vigor: 9 },
    'Doc Holliday, As de Sangue': { strength: 11, defense: 9, agility: 16, accuracy: 19, vigor: 9 },
    'Annie Oakley, Mira Implacavel': { strength: 9, defense: 8, agility: 14, accuracy: 22, vigor: 8 },
    'Butch Cassidy, Rei do Assalto': { strength: 14, defense: 10, agility: 14, accuracy: 13, vigor: 10 },
    'Sundance Kid, Passo Fantasma': { strength: 11, defense: 9, agility: 20, accuracy: 15, vigor: 9 },
    'Calamity Jane, Tempestade Escarlate': { strength: 13, defense: 9, agility: 13, accuracy: 15, vigor: 10 },
    'Wyatt Earp, Lei de Ferro': { strength: 15, defense: 16, agility: 12, accuracy: 17, vigor: 14 },
}

function getEnemyBaseStats(enemy: Enemy) {
    const total = getEnemyStatBudget(enemy.level)
    const build = ENEMY_BUILD_BY_NAME[enemy.name]

    let wStrength = build
        ? Math.max(1, build.strength + Math.round((enemy.strength || 1) * 0.2))
        : Math.max(1, enemy.strength || 1)
    let wAgility = build
        ? Math.max(1, build.agility + Math.round((enemy.agility || 1) * 0.2))
        : Math.max(1, enemy.agility || 1)
    let wAccuracy = build
        ? Math.max(1, build.accuracy + Math.round((enemy.precision || 1) * 0.2))
        : Math.max(1, enemy.precision || 1)
    let wDefense = build
        ? Math.max(1, build.defense + Math.round(enemy.level * 0.15))
        : Math.max(1, Math.round(enemy.level * 0.8))
    let wVigor = build
        ? Math.max(1, build.vigor + Math.round(enemy.level * 0.15))
        : Math.max(1, Math.round(enemy.level * 0.8))

    const weightSum = wStrength + wDefense + wAgility + wAccuracy + wVigor

    let strength = Math.round(total * (wStrength / weightSum))
    let defense = Math.round(total * (wDefense / weightSum))
    let agility = Math.round(total * (wAgility / weightSum))
    let accuracy = Math.round(total * (wAccuracy / weightSum))
    let vigor = Math.round(total * (wVigor / weightSum))

    let sum = strength + defense + agility + accuracy + vigor
    let diff = total - sum

    const statsOrder: Array<'strength' | 'defense' | 'agility' | 'accuracy' | 'vigor'> = ['strength', 'defense', 'agility', 'accuracy', 'vigor']
    const adjustTargets: Record<'strength' | 'defense' | 'agility' | 'accuracy' | 'vigor', number> = { strength, defense, agility, accuracy, vigor }

    while (diff !== 0) {
        for (const key of statsOrder) {
            if (diff === 0) break
            if (diff > 0) {
                adjustTargets[key] += 1
                diff--
            } else {
                if (adjustTargets[key] > 1) {
                    adjustTargets[key] -= 1
                    diff++
                }
            }
        }
    }

    strength = adjustTargets.strength
    defense = adjustTargets.defense
    agility = adjustTargets.agility
    accuracy = adjustTargets.accuracy
    vigor = adjustTargets.vigor

    const hp_max = 100 + vigor * 10

    return { strength, defense, agility, accuracy, vigor, hp_max }
}

function getEnemyRarityForLevel(level: number): ItemRarity {
    if (level <= 3) return 'common'
    if (level <= 6) return 'uncommon'
    if (level <= 9) return 'rare'
    if (level <= 12) return 'epic'
    return 'legendary'
}

function getEnemyEquipment(enemy: Enemy, catalog: Item[]) {
    const fixedGear: Record<string, { weapon?: string, helmet?: string, chest?: string, gloves?: string, legs?: string, boots?: string, shield?: string }> = {
        'Saqueador Ardil': {
            weapon: 'rusty_dagger', chest: 'dusty_poncho', helmet: 'cloth_hat',
            gloves: 'leather_gloves', legs: 'traveler_pants', boots: 'cloth_boots'
        },
        'Bandoleiro Novato': {
            weapon: 'short_revolver', chest: 'reinforced_poncho', helmet: 'leather_hat',
            gloves: 'reinforced_gloves', legs: 'leather_chaps', boots: 'mercenary_boots', shield: 'reinforced_sling'
        },
        'Caçador Furtivo': {
            weapon: 'sawed_off', chest: 'steel_lined_coat', helmet: 'bandit_mask',
            gloves: 'duelist_gloves', legs: 'lined_pants', boots: 'iron_boots', shield: 'reinforced_bandolier'
        },
        'Atirador de Elite': {
            weapon: 'precision_rifle', chest: 'marshal_trenchcoat', helmet: 'trigger_king_hat',
            gloves: 'marshal_gloves', legs: 'sheriff_greaves', boots: 'ranger_boots', shield: 'sheriff_arm_shield'
        },
        'Chefe Rufião': {
            weapon: 'duelist_revolver', chest: 'sheriff_coat', helmet: 'sheriff_hat',
            gloves: 'nightfang_grips', legs: 'ghost_step_pants', boots: 'raven_boots', shield: 'iron_star_buckler'
        },
    }

    fixedGear['Billy the Kid, O Relampago'] = {
        weapon: 'fantasma_deserto_legendary_weapon', chest: 'fantasma_deserto_legendary_chest', helmet: 'fantasma_deserto_legendary_helmet',
        gloves: 'fantasma_deserto_legendary_gloves', legs: 'fantasma_deserto_legendary_legs', boots: 'fantasma_deserto_legendary_boots', shield: 'fantasma_deserto_legendary_shield'
    }
    fixedGear['Wyatt Earp, Lei de Ferro'] = {
        weapon: 'xerife_lendario_legendary_weapon', chest: 'xerife_lendario_legendary_chest', helmet: 'xerife_lendario_legendary_helmet',
        gloves: 'xerife_lendario_legendary_gloves', legs: 'xerife_lendario_legendary_legs', boots: 'xerife_lendario_legendary_boots', shield: 'xerife_lendario_legendary_shield'
    }
    fixedGear['Jesse James, Sombra do Trem'] = {
        weapon: 'duelista_carmesim_epic_weapon', chest: 'duelista_carmesim_epic_chest', helmet: 'duelista_carmesim_epic_helmet',
        gloves: 'duelista_carmesim_epic_gloves', legs: 'duelista_carmesim_epic_legs', boots: 'duelista_carmesim_epic_boots', shield: 'duelista_carmesim_epic_shield'
    }
    fixedGear['Doc Holliday, As de Sangue'] = {
        weapon: 'xama_tormenta_epic_weapon', chest: 'xama_tormenta_epic_chest', helmet: 'xama_tormenta_epic_helmet',
        gloves: 'xama_tormenta_epic_gloves', legs: 'xama_tormenta_epic_legs', boots: 'xama_tormenta_epic_boots', shield: 'xama_tormenta_epic_shield'
    }
    fixedGear['Annie Oakley, Mira Implacavel'] = {
        weapon: 'xerife_lendario_legendary_weapon', chest: 'xama_tormenta_epic_chest', helmet: 'xama_tormenta_epic_helmet',
        gloves: 'xama_tormenta_epic_gloves', legs: 'xama_tormenta_epic_legs', boots: 'xama_tormenta_epic_boots', shield: 'xama_tormenta_epic_shield'
    }
    fixedGear['Butch Cassidy, Rei do Assalto'] = {
        weapon: 'lobo_tempestade_legendary_weapon', chest: 'lobo_tempestade_legendary_chest', helmet: 'lobo_tempestade_legendary_helmet',
        gloves: 'lobo_tempestade_legendary_gloves', legs: 'lobo_tempestade_legendary_legs', boots: 'lobo_tempestade_legendary_boots', shield: 'lobo_tempestade_legendary_shield'
    }
    fixedGear['Sundance Kid, Passo Fantasma'] = {
        weapon: 'fantasma_deserto_legendary_weapon', chest: 'fantasma_deserto_legendary_chest', helmet: 'fantasma_deserto_legendary_helmet',
        gloves: 'fantasma_deserto_legendary_gloves', legs: 'fantasma_deserto_legendary_legs', boots: 'fantasma_deserto_legendary_boots', shield: 'fantasma_deserto_legendary_shield'
    }
    fixedGear['Calamity Jane, Tempestade Escarlate'] = {
        weapon: 'xama_tormenta_epic_weapon', chest: 'guardiao_aco_epic_chest', helmet: 'guardiao_aco_epic_helmet',
        gloves: 'guardiao_aco_epic_gloves', legs: 'guardiao_aco_epic_legs', boots: 'guardiao_aco_epic_boots', shield: 'guardiao_aco_epic_shield'
    }

    const gearMap = fixedGear[enemy.name];
    if (gearMap) {
        return {
            weapon: catalog.find(i => i.id === gearMap.weapon) || catalog.find(i => i.id === 'rusty_dagger')!,
            armor: [
                catalog.find(i => i.id === gearMap.chest),
                catalog.find(i => i.id === gearMap.helmet),
                catalog.find(i => i.id === gearMap.gloves),
                catalog.find(i => i.id === gearMap.legs),
                catalog.find(i => i.id === gearMap.boots),
                catalog.find(i => i.id === gearMap.shield)
            ].filter(Boolean) as Item[]
        }
    }

    // Default fallback based on level for missing gearMap
    const lvl = enemy.level;
    let w = 'rusty_dagger', c = 'dusty_poncho', h = 'cloth_hat', g = 'leather_gloves', l = 'traveler_pants', b = 'cloth_boots', s = 'simple_bandolier';

    if (lvl >= 4) {
        w = 'short_revolver'; c = 'reinforced_poncho'; h = 'leather_hat';
        g = 'reinforced_gloves'; l = 'leather_chaps'; b = 'mercenary_boots'; s = 'reinforced_sling';
    }
    if (lvl >= 8) {
        w = 'sawed_off'; c = 'steel_lined_coat'; h = 'bandit_mask';
        g = 'duelist_gloves'; l = 'lined_pants'; b = 'iron_boots'; s = 'reinforced_bandolier';
    }
    if (lvl >= 12) {
        w = 'duelist_revolver'; c = 'marshal_trenchcoat'; h = 'trigger_king_hat';
        g = 'marshal_gloves'; l = 'sheriff_greaves'; b = 'ranger_boots'; s = 'sheriff_arm_shield';
    }
    if (lvl >= 15) {
        w = 'precision_rifle'; c = 'sheriff_coat'; h = 'trigger_king_hat';
        g = 'nightfang_grips'; l = 'ghost_step_pants'; b = 'raven_boots'; s = 'iron_star_buckler';
    }
    if (lvl >= 20) {
        w = 'xama_tormenta_epic_weapon'; c = 'xama_tormenta_epic_chest'; h = 'xama_tormenta_epic_helmet';
        g = 'xama_tormenta_epic_gloves'; l = 'xama_tormenta_epic_legs'; b = 'xama_tormenta_epic_boots'; s = 'xama_tormenta_epic_shield';
    }
    if (lvl >= 24) {
        w = 'fantasma_deserto_legendary_weapon'; c = 'fantasma_deserto_legendary_chest'; h = 'fantasma_deserto_legendary_helmet';
        g = 'fantasma_deserto_legendary_gloves'; l = 'fantasma_deserto_legendary_legs'; b = 'fantasma_deserto_legendary_boots'; s = 'fantasma_deserto_legendary_shield';
    }
    if (lvl >= 28) {
        w = 'lobo_tempestade_legendary_weapon'; c = 'lobo_tempestade_legendary_chest'; h = 'lobo_tempestade_legendary_helmet';
        g = 'lobo_tempestade_legendary_gloves'; l = 'lobo_tempestade_legendary_legs'; b = 'lobo_tempestade_legendary_boots'; s = 'lobo_tempestade_legendary_shield';
    }
    if (lvl >= 32) {
        w = 'xerife_lendario_legendary_weapon'; c = 'xerife_lendario_legendary_chest'; h = 'xerife_lendario_legendary_helmet';
        g = 'xerife_lendario_legendary_gloves'; l = 'xerife_lendario_legendary_legs'; b = 'xerife_lendario_legendary_boots'; s = 'xerife_lendario_legendary_shield';
    }

    return {
        weapon: catalog.find(i => i.id === w) || catalog.find(i => i.id === 'rusty_dagger')!,
        armor: [
            catalog.find(i => i.id === c),
            catalog.find(i => i.id === h),
            catalog.find(i => i.id === g),
            catalog.find(i => i.id === l),
            catalog.find(i => i.id === b),
            catalog.find(i => i.id === s)
        ].filter(Boolean) as Item[]
    }
}

function getEnemyEquipmentHpBonus(enemy: Enemy, catalog: Item[]) {
    const eq = getEnemyEquipment(enemy, catalog)
    return (eq.armor || []).reduce((sum, item) => sum + (item.stats?.vigor || 0), 0)
}

function getEnemyMaxHp(enemy: Enemy, catalog: Item[]) {
    const base = getEnemyBaseStats(enemy)
    return base.hp_max + getEnemyEquipmentHpBonus(enemy, catalog)
}

function ItemIcon({ item, className = "" }: { item: Item; className?: string }) {
    const [imgError, setImgError] = useState(false)
    const displayUrl = getOptimizedAssetSrc(item.image_url)

    if (displayUrl && !imgError) {
        return (
            <img
                src={displayUrl}
                alt={item.name}
                className={`w-full h-full object-cover ${className}`}
                onError={() => setImgError(true)}
            />
        )
    }

    return <span className="text-sm leading-none">{item.icon}</span>
}

type CombatLogEntry = NarrativeTurn & { isNew?: boolean }

export default function ArenaTab({ profile, onRefresh }: { profile: Profile; onRefresh: () => void }) {
    type EnemyTier = 'tier1' | 'tier2'
    const [enemies, setEnemies] = useState<Enemy[]>([])
    const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null)
    const [enemyTier, setEnemyTier] = useState<EnemyTier>('tier1')
    const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([])
    const [isFighting, setIsFighting] = useState(false)
    const [winner, setWinner] = useState<string | null>(null)
    const [showCollectButton, setShowCollectButton] = useState(false)
    const [isResolving, setIsResolving] = useState(false)
    const [combatSummary, setCombatSummary] = useState<{
        xpGain: number;
        goldGain: number;
        energyCost: number;
        leveledUp?: boolean;
        consumableDrop?: { name: string; icon: string };
        equipmentDrop?: { name: string; icon: string; rarity: ItemRarity };
    } | null>(null)
    const [playerHp, setPlayerHp] = useState(profile.hp_current)
    const [enemyHp, setEnemyHp] = useState<number>(0)
    const [playerHit, setPlayerHit] = useState<'normal' | 'critical' | false>(false)
    const [enemyHit, setEnemyHit] = useState<'normal' | 'critical' | false>(false)
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
    const [lightboxAlt, setLightboxAlt] = useState<string | null>(null)
    const [lightboxStats, setLightboxStats] = useState<Record<string, number> | undefined>(undefined)
    const [lightboxRequirements, setLightboxRequirements] = useState<Record<string, number> | undefined>(undefined)
    const [soulsSnapshot, setSoulsSnapshot] = useState<SoulsDerivedStats | null>(null)
    const [playerEquipment, setPlayerEquipment] = useState<{ weapon: Item | null, armor: Item[] }>({ weapon: null, armor: [] })
    const logEndRef = useRef<HTMLDivElement>(null)

    const [finalCombatResult, setFinalCombatResult] = useState<{
        winnerName: string;
        finalPlayerHp: number;
        enemy: Enemy;
        combatTicket: string;
    } | null>(null);

    const [shouldSkipCombat, setShouldSkipCombat] = useState(false);
    const skipCombatRef = useRef(false);
    const tier1Enemies = enemies.filter((e) => e.level < 20)
    const tier2Enemies = enemies.filter((e) => e.level >= 20)
    const filteredEnemies = enemyTier === 'tier2' ? tier2Enemies : tier1Enemies

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
        }
    }, [combatLog])

    const loadSoulsSnapshot = async () => {
        const inventory = await getUserInventory(profile.id)
        const equippedItems = (inventory || [])
            .filter((inv: any) => inv.is_equipped)
            .map((inv: any) => getItemById(inv.item_id))
            .filter(Boolean) as Item[]
        setSoulsSnapshot(deriveSoulsStats(profile, equippedItems as any))

        setPlayerEquipment({
            weapon: equippedItems.find(i => i.type === 'weapon') || null,
            armor: equippedItems.filter(i => i.type !== 'weapon' && i.type !== 'consumable')
        })
    }

    useEffect(() => {
        getEnemies().then(data => {
            setEnemies(data)
            const initialTierEnemies = data.filter((e) => e.level < 20)
            const initialEnemy = initialTierEnemies[0] || data[0] || null
            if (initialEnemy) {
                setSelectedEnemy(initialEnemy)
                setEnemyHp(getEnemyMaxHp(initialEnemy, CATALOG_ITEMS))
            }
        })
        loadSoulsSnapshot()
    }, [profile.id])

    useEffect(() => {
        if (filteredEnemies.length === 0) {
            setSelectedEnemy(null)
            setEnemyHp(0)
            return
        }

        const isCurrentEnemyInTier = selectedEnemy
            ? filteredEnemies.some((enemy) => enemy.id === selectedEnemy.id)
            : false

        if (!isCurrentEnemyInTier) {
            setSelectedEnemy(filteredEnemies[0])
            setEnemyHp(getEnemyMaxHp(filteredEnemies[0], CATALOG_ITEMS))
        }
    }, [enemyTier, enemies])

    const handleEnemyChange = (id: string) => {
        const en = filteredEnemies.find(e => e.id === id) || null
        setSelectedEnemy(en)
        if (en) setEnemyHp(getEnemyMaxHp(en, CATALOG_ITEMS))
    }

    const triggerShake = (target: 'player' | 'enemy', isCritical: boolean) => {
        const hitState = isCritical ? 'critical' : 'normal'
        if (target === 'player') {
            setPlayerHit(hitState)
            setTimeout(() => setPlayerHit(false), isCritical ? 800 : 600)
            return
        }
        setEnemyHit(hitState)
        setTimeout(() => setEnemyHit(false), isCritical ? 800 : 600)
    }

    const openItemLightbox = (item: Item) => {
        if (!item?.image_url) return
        setLightboxSrc(item.image_url)
        setLightboxAlt(item.name)
        setLightboxStats(item.stats || undefined)
        setLightboxRequirements(item.requirements || undefined)
    }

    const handleFight = async () => {
        if (!selectedEnemy) return
        if (profile.energy < COMBAT_ENERGY_COST) {
            alert(`Energia insuficiente. Necessário: ${COMBAT_ENERGY_COST}.`)
            return
        }

        const arenaStart = await beginArenaCombat(profile.id, selectedEnemy.id)
        if (!arenaStart.success || !arenaStart.ticket) {
            alert(arenaStart.error || 'Falha de segurança ao iniciar duelo. Tente novamente.')
            return
        }

        const combatTicket = arenaStart.ticket
        setIsFighting(true)
        setShowCollectButton(false)
        setShouldSkipCombat(false)
        skipCombatRef.current = false;
        setCombatLog([])
        setWinner(null)
        setCombatSummary(null)
        setPlayerHp(profile.hp_current)

        const baseEnemyStats = getEnemyBaseStats(selectedEnemy)

        const inventory = await getUserInventory(profile.id)
        const equippedItems = (inventory || [])
            .filter((inv: any) => inv.is_equipped)
            .map((inv: any) => getItemById(inv.item_id))
            .filter(Boolean)

        let weaponName = 'punhos'
        equippedItems.forEach((item: any) => {
            if (item.type === 'weapon') weaponName = item.name
        })

        const souls = deriveSoulsStats(profile, equippedItems as any)
        setSoulsSnapshot(souls)

        const playerFighter: Fighter = {
            name: profile.username,
            hp: profile.hp_current + (souls.hpBonus || 0),
            strength: souls.attackRating,
            defense: profile.defense + souls.bonuses.defense,
            agility: profile.agility + souls.bonuses.agility,
            accuracy: Math.floor((profile.accuracy + souls.bonuses.accuracy) * souls.requirementPenalty),
            minDamage: souls.minDamage,
            maxDamage: souls.maxDamage,
            weaponName: weaponName
        }

        const enemyEq = getEnemyEquipment(selectedEnemy, CATALOG_ITEMS)
        const enemyVigorBonus = (enemyEq.armor || []).reduce((sum, item) => sum + (item.stats?.vigor || 0), 0)
        const enemyMaxHp = baseEnemyStats.hp_max + enemyVigorBonus
        setEnemyHp(enemyMaxHp)

        const enemyFighter: Fighter = {
            name: selectedEnemy.name,
            hp: enemyMaxHp,
            strength: baseEnemyStats.strength,
            defense: baseEnemyStats.defense,
            agility: baseEnemyStats.agility,
            accuracy: baseEnemyStats.accuracy,
            minDamage: Math.floor(baseEnemyStats.strength * 0.8),
            maxDamage: Math.floor(baseEnemyStats.strength * 1.2),
            weaponName: enemyEq.weapon?.name || 'Punhos'
        }

        const result = simulateCombat(playerFighter, enemyFighter)
        let finalPlayerHpVal = profile.hp_current
        for (const turn of result.history) {
            const defenderWasPlayer = turn.defender.toLowerCase() === profile.username.toLowerCase()
            if (defenderWasPlayer) {
                finalPlayerHpVal = turn.resultHp
            }
        }
        for (const turn of result.history) {
            // Wait logic that can be interrupted
            const sleepMs = 2400;
            const pollInterval = 80;
            let waited = 0;

            while (waited < sleepMs && !skipCombatRef.current) {
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                waited += pollInterval;
            }

            const attackerName = turn.attacker.toLowerCase()
            const playerName = profile.username.toLowerCase()

            if (turn.damage > 0) {
                if (attackerName === playerName) {
                    if (!skipCombatRef.current) triggerShake('enemy', turn.isCritical);
                } else {
                    if (!skipCombatRef.current) triggerShake('player', turn.isCritical);
                }
            }

            if (turn.damage > 0) {
                if (attackerName === playerName) {
                    setEnemyHp(turn.resultHp);
                } else {
                    setPlayerHp(turn.resultHp);
                }
            }

            setCombatLog(prev => [...prev, { ...turn, isNew: true }])
        }

        setWinner(result.winner)

        const balancedEnemy: Enemy = {
            ...selectedEnemy,
            strength: baseEnemyStats.strength,
            agility: baseEnemyStats.agility,
            precision: baseEnemyStats.accuracy,
            hp_max: baseEnemyStats.hp_max
        }

        setFinalCombatResult({
            winnerName: result.winner,
            finalPlayerHp: finalPlayerHpVal,
            enemy: balancedEnemy,
            combatTicket
        })
        setShowCollectButton(true)
        setIsFighting(false)
    }

    const handleCollectReward = async () => {
        if (!finalCombatResult || isResolving) return
        setIsResolving(true)

        const resolution = await resolveArenaCombat(
            profile.id,
            finalCombatResult.enemy,
            finalCombatResult.winnerName.toLowerCase() === profile.username.toLowerCase(),
            finalCombatResult.finalPlayerHp,
            finalCombatResult.combatTicket
        )

        if (resolution.success) {
            setCombatSummary({
                xpGain: resolution.xpGain,
                goldGain: resolution.goldGain,
                energyCost: resolution.energyCost,
                leveledUp: resolution.leveledUp,
                consumableDrop: resolution.consumableDrop,
                equipmentDrop: resolution.equipmentDrop
            })
            await onRefresh()
        }

        setShowCollectButton(false)
        setIsResolving(false)
    }

    const getLogStyle = (log: NarrativeTurn): CSSProperties => {
        const playerName = profile.username.toLowerCase()
        const attackerName = log.attacker.toLowerCase()
        const isPlayer = attackerName === playerName

        // Base theme colors
        const playerColor = '#60a5fa' // Bright Blue
        const enemyColor = '#ef4444'  // Bright Red
        const turnColor = isPlayer ? playerColor : enemyColor

        if (log.isMiss) return {
            color: '#6b7280',
            fontWeight: 'normal',
            borderLeft: '4px solid transparent',
            opacity: 0.6
        }

        const baseStyle: React.CSSProperties = {
            color: turnColor,
            fontWeight: '900',
            borderLeft: `4px solid ${turnColor}`,
            paddingLeft: '12px',
            background: isPlayer ? 'rgba(96, 165, 250, 0.05)' : 'rgba(239, 68, 68, 0.05)',
            marginBottom: '4px',
            borderRadius: '0 4px 4px 0',
            transition: 'all 0.3s ease'
        }

        if (log.isCritical) {
            return {
                ...baseStyle,
                color: '#ffffff', // White text for criticals to pop
                background: isPlayer ? 'rgba(96, 165, 250, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                textShadow: `0 0 12px ${turnColor}`,
                fontSize: '16px',
                borderLeft: `6px solid ${turnColor}`,
                letterSpacing: '0.05em',
                animation: 'pulse 0.5s infinite alternate'
            }
        }

        return baseStyle
    }

    const enemyBase = selectedEnemy ? getEnemyBaseStats(selectedEnemy) : null
    const enemyEquipment = selectedEnemy ? getEnemyEquipment(selectedEnemy, CATALOG_ITEMS) : null

    const playerMaxHp = profile.hp_max + (soulsSnapshot?.hpBonus || 0)
    const enemyVigorBonus = (enemyEquipment?.armor || []).reduce((sum, item) => sum + (item.stats?.vigor || 0), 0)
    const enemyHpMax = (enemyBase?.hp_max || selectedEnemy?.hp_max || 1) + enemyVigorBonus

    const playerIsWinner = winner?.toLowerCase() === profile.username.toLowerCase()

    const playerHpPct = Math.max(0, (playerHp / playerMaxHp) * 100)
    const enemyHpPct = Math.max(0, (enemyHp / enemyHpMax) * 100)

    // Calculate Enemy Bonus Stats from Equipment
    let enemyBonusStrength = 0
    let enemyBonusDefense = 0
    let enemyBonusAgility = 0
    let enemyBonusAccuracy = 0
    let enemyBonusVigor = 0

    if (enemyEquipment) {
        const allItems = [enemyEquipment.weapon, ...enemyEquipment.armor].filter(Boolean) as Item[]
        allItems.forEach(item => {
            if (item.stats) {
                if (item.stats.strength) enemyBonusStrength += item.stats.strength
                if (item.stats.defense) enemyBonusDefense += item.stats.defense
                if (item.stats.agility) enemyBonusAgility += item.stats.agility
                if (item.stats.accuracy) enemyBonusAccuracy += item.stats.accuracy
                if (item.stats.vigor) enemyBonusVigor += item.stats.vigor
            }
        })
    }

    return (
        <div className="relative flex flex-col gap-3 h-[min(100vh,calc(100vh-110px))] max-h-[100vh] p-3 md:p-4 rounded-sm overflow-hidden"
            style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url('${getOptimizedAssetSrc('/images/duelo1.jpeg')}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}>

            {/* THREE COLUMN LAYOUT ON DESKTOP */}
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 h-full min-h-0">

                {/* 1. PLAYER COLUMN */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                    <div className="relative bg-[#140d07]/90 border-2 border-[#3a2a1a] rounded-sm p-4 shadow-inner flex flex-col h-full">
                        <div className="flex justify-between w-full mb-2 items-center">
                            <span className="text-sm md:text-base font-black text-blue-300 uppercase tracking-[0.12em]">{profile.username}</span>
                            <span className="text-xs md:text-sm text-blue-100/80 font-mono">HP {playerHp}/{playerMaxHp}</span>
                        </div>
                        <div className="w-full h-3 mb-4 bg-black/60 border border-blue-900/30 rounded-full overflow-hidden shrink-0">
                            <div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-500" style={{ width: `${playerHpPct}%` }} />
                        </div>

                        <div className="w-full flex items-center gap-4">
                        <CharacterPortrait
                            src={CLASS_PORTRAITS[profile.class] || null}
                            fallbackEmoji="🤠"
                            borderColor="blue"
                            size="md"
                            isHit={playerHit}
                        />

                        {/* Player Stats */}
                        <div className="grid grid-cols-5 gap-2 flex-1 py-2 border-l border-[#3a2a1a] pl-3">
                            {[
                                { label: 'FOR', base: profile.strength, bonus: soulsSnapshot?.bonuses.strength || 0 },
                                { label: 'DEF', base: profile.defense, bonus: soulsSnapshot?.bonuses.defense || 0 },
                                { label: 'AGI', base: profile.agility, bonus: soulsSnapshot?.bonuses.agility || 0 },
                                { label: 'PON', base: profile.accuracy, bonus: soulsSnapshot?.bonuses.accuracy || 0 },
                                { label: 'VIG', base: profile.vigor, bonus: soulsSnapshot?.bonuses.vigor || 0 },
                            ].map(({ label, base, bonus }) => (
                                <div key={label} className="flex flex-col items-center">
                                    <span className="text-[11px] text-[#a39281] font-bold uppercase tracking-wider">{label}</span>
                                    <div className="flex flex-col items-center leading-tight">
                                        <span className="text-base md:text-lg font-black text-white">{base + bonus}</span>
                                        <div className="flex flex-col items-center text-[10px] text-gray-400 font-bold leading-none">
                                            <span>({base})</span>
                                            {bonus > 0 ? <span>(+{bonus})</span> : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        </div>

                        {/* Player Equipment Grid */}
                        <div className="flex flex-wrap gap-1.5 mt-auto pt-3 items-center justify-center">
                            {(() => {
                                const allItems = [playerEquipment.weapon, ...playerEquipment.armor].filter(Boolean) as Item[];
                                if (allItems.length === 0) return <span className="text-[10px] text-gray-600 italic">Sem equipamento</span>;
                                return allItems.map((item, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className="w-8 h-8 bg-black/80 border-2 flex items-center justify-center shadow-inner rounded-sm overflow-hidden relative group cursor-pointer transition-transform hover:scale-105"
                                        style={{
                                            borderColor: RARITY_COLORS[item.rarity || 'common'].border,
                                            boxShadow: `0 0 6px ${RARITY_COLORS[item.rarity || 'common'].glow}`
                                        }}
                                        title={item.name}
                                        onClick={() => openItemLightbox(item)}
                                    >
                                        <ItemIcon item={item} />
                                    </button>
                                ))
                            })()}
                        </div>

                        {/* VS Overlay */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
                            <div className="text-3xl md:text-4xl lg:text-5xl font-black text-[#a52a2a] italic tracking-tighter drop-shadow-2xl animate-pulse">VS</div>
                        </div>
                    </div>
                </div>

                {/* 2. CENTER COLUMN: CONTROLS & LOG */}
                <div className="lg:col-span-4 flex flex-col gap-2 min-h-0 h-full">
                        {/* Integrated Combat Status */}
                        {isFighting && (
                            <div className="text-center py-1 animate-in fade-in slide-in-from-top-2">
                                <div className="text-xl font-black text-[#a52a2a] italic tracking-tighter drop-shadow-lg animate-pulse">EM COMBATE</div>
                                <div className="text-[10px] text-gold font-bold uppercase tracking-[0.1em] opacity-80">
                                    Sorte a favor do gatilho
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="bg-[#140d07] border border-[#3a2a1a] p-3 rounded-sm shadow-md flex flex-col gap-3 h-fit flex-shrink-0">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setEnemyTier('tier1')}
                                    disabled={isFighting || showCollectButton}
                                    className={`py-2 px-3 text-[11px] font-black uppercase tracking-[0.08em] border rounded-sm transition-colors ${enemyTier === 'tier1'
                                        ? 'bg-[#2a3e58] border-blue-400 text-blue-100'
                                        : 'bg-[#111] border-[#3a3a3a] text-gray-300 hover:border-blue-700'
                                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    Tier 1 ({tier1Enemies.length})
                                </button>
                                <button
                                    onClick={() => setEnemyTier('tier2')}
                                    disabled={isFighting || showCollectButton || tier2Enemies.length === 0}
                                    className={`py-2 px-3 text-[11px] font-black uppercase tracking-[0.08em] border rounded-sm transition-colors ${enemyTier === 'tier2'
                                        ? 'bg-[#5a2a2a] border-red-400 text-red-100'
                                        : 'bg-[#111] border-[#3a3a3a] text-gray-300 hover:border-red-700'
                                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    Tier 2 ({tier2Enemies.length})
                                </button>
                            </div>

                            <select
                                className="w-full bg-[#111] border-2 border-[#3a3a3a] text-white p-2 outline-none focus:border-red-600 transition-colors rounded-sm western-select text-sm font-black"
                                onChange={(e) => handleEnemyChange(e.target.value)}
                                disabled={isFighting || showCollectButton}
                                value={selectedEnemy?.id || ''}
                            >
                                <option value="">
                                    {filteredEnemies.length === 0
                                        ? '-- SEM INIMIGOS NESTE TIER --'
                                        : '-- SELECIONAR ALVO --'}
                                </option>
                                {filteredEnemies.map(en => (
                                    <option key={en.id} value={en.id}>{en.name} (Nvl {en.level})</option>
                                ))}
                            </select>

                            {!showCollectButton ? (
                                <>
                                <button
                                    onClick={handleFight}
                                    disabled={isFighting || !selectedEnemy || profile.energy < COMBAT_ENERGY_COST}
                                    className="btn-western py-4 px-8 text-base font-black min-w-[200px]"
                                >
                                    {isFighting ? '🔫 DUELANDO...' : '⚔️ INICIAR DUELO'}
                                </button>
                                {isFighting && (
                                    <button
                                        onClick={() => {
                                            setShouldSkipCombat(true)
                                            skipCombatRef.current = true
                                        }}
                                        disabled={shouldSkipCombat}
                                        className="py-2 px-4 text-xs font-black uppercase tracking-[0.08em] bg-[#2b1a0a] text-[#f2b90d] border border-[#5e3e1f] hover:bg-[#3a2410] disabled:opacity-60 disabled:cursor-not-allowed transition-colors rounded-sm"
                                    >
                                        {shouldSkipCombat ? 'PULANDO DUELO...' : 'PULAR DUELO'}
                                    </button>
                                )}
                                </>
                            ) : (
                                <button
                                    onClick={handleCollectReward}
                                    disabled={isResolving}
                                    className="py-4 px-10 text-base font-black uppercase tracking-[0.1em] bg-gold text-black border-2 border-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.5)] animate-bounce min-w-[240px]"
                                >
                                    {isResolving ? 'COLETANDO...' : '💰 COLETAR RECOMPENSA'}
                                </button>
                            )}
                        </div>

                        {/* Combat Summary */}
                        {combatSummary && (
                            <div className="flex flex-col gap-1 p-3 bg-[#111] border border-gold/40 rounded-sm text-xs shadow-inner animate-in fade-in flex-shrink-0">
                                <span className="text-gold font-black uppercase tracking-[0.2em] mb-1">Espólios:</span>
                                <span className="text-green-400">+{combatSummary.xpGain} XP</span>
                                <span className="text-yellow-400">+{combatSummary.goldGain} Ouro</span>
                                {combatSummary.consumableDrop && <span className="text-purple-400 mt-1">📦 {combatSummary.consumableDrop.name}</span>}
                                {combatSummary.equipmentDrop && (
                                    <span style={{ color: RARITY_COLORS[combatSummary.equipmentDrop.rarity]?.textColor }} className="font-bold border-l-2 border-white/20 pl-2 mt-1">
                                        ⚔️ {combatSummary.equipmentDrop.name}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Combat Log */}
                        <div className="western-border bg-black/60 rounded-sm overflow-hidden flex flex-col min-h-[200px] flex-1">
                            <div className="flex items-center justify-between px-2 py-1 border-b border-[#2a2a2a] bg-black/40">
                                <span className="text-[9px] font-black text-gold uppercase tracking-[0.2em]">Crônica</span>
                            </div>
                            <div ref={logEndRef} className="flex-1 overflow-y-auto p-2 font-serif text-[12px] space-y-1.5">
                                {combatLog.length === 0 && !winner && (
                                    <div className="text-gray-600 text-center italic mt-8 text-[10px] tracking-widest uppercase opacity-40">Aguardando duelistas...</div>
                                )}
                                {combatLog.map((log, i) => (
                                    <div key={i} className={`flex items-start gap-2 px-2 py-1.5 rounded-sm border-l-2 ${log.isCritical ? 'border-red-600 bg-red-950/20' : 'border-transparent'}`} style={getLogStyle(log)}>
                                        <span className="flex-1 leading-relaxed">{log.narrative}</span>
                                        {log.damage > 0 && <span className="text-[10px] font-black min-w-[25px] text-right">-{log.damage}</span>}
                                    </div>
                                ))}
                                {winner && (
                                    <div className={`mt-3 p-2 text-center rounded-sm border-2 animate-in fade-in zoom-in duration-500 ${playerIsWinner ? 'bg-gold/10 border-gold/30' : 'bg-red-900/10 border-red-900/30'}`}>
                                        <div className={`text-sm font-black uppercase tracking-[0.1em] ${playerIsWinner ? 'text-gold' : 'text-red-500'}`}>
                                            {playerIsWinner ? 'Vitória!' : 'Derrota!'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                {/* 3. ENEMY COLUMN */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                        {selectedEnemy ? (
                            <div className="bg-[#140d07]/90 border-2 border-[#3a2a1a] rounded-sm p-4 shadow-inner flex flex-col h-full">
                                <div className="flex justify-between w-full mb-2 items-center flex-row-reverse">
                                    <span className="text-sm md:text-base font-black text-red-400 uppercase tracking-[0.12em]">{selectedEnemy.name}</span>
                                    <span className="text-xs md:text-sm text-red-100/80 font-mono">HP {enemyHp}/{enemyHpMax}</span>
                                </div>
                                <div className="w-full h-3 mb-4 bg-black/60 border border-red-900/30 rounded-full overflow-hidden shrink-0">
                                    <div className="h-full bg-gradient-to-l from-red-700 to-red-500 transition-all duration-500" style={{ width: `${enemyHpPct}%`, marginLeft: 'auto' }} />
                                </div>

                                <div className="w-full flex items-center gap-4">
                                <CharacterPortrait
                                    src={getEnemyPortraitSrc(selectedEnemy.id)}
                                    fallbackEmoji="💀"
                                    borderColor="red"
                                    size="md"
                                    isHit={enemyHit}
                                />
                                {/* Enemy Stats */}
                                <div className="grid grid-cols-5 gap-2 flex-1 py-2 border-l border-[#3a2a1a] pl-3">
                                    {[
                                        { label: 'FOR', base: enemyBase?.strength ?? selectedEnemy.strength, bonus: enemyBonusStrength },
                                        { label: 'DEF', base: enemyBase?.defense ?? 0, bonus: enemyBonusDefense },
                                        { label: 'AGI', base: enemyBase?.agility ?? selectedEnemy.agility, bonus: enemyBonusAgility },
                                        { label: 'PON', base: enemyBase?.accuracy ?? selectedEnemy.precision, bonus: enemyBonusAccuracy },
                                        { label: 'VIG', base: enemyBase?.vigor ?? 0, bonus: enemyBonusVigor },
                                    ].map(({ label, base, bonus }) => (
                                        <div key={label} className="flex flex-col items-center">
                                            <span className="text-[11px] text-[#a39281] font-bold uppercase tracking-wider">{label}</span>
                                            <div className="flex flex-col items-center leading-tight">
                                                <span className="text-base md:text-lg font-black text-white">{base + bonus}</span>
                                                <div className="flex flex-col items-center text-[10px] text-gray-400 font-bold leading-none">
                                                    <span>({base})</span>
                                                    {bonus > 0 ? <span>(+{bonus})</span> : null}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                </div>

                                {/* Enemy Equipment Grid */}
                                <div className="flex flex-wrap gap-1.5 mt-auto pt-3 items-center justify-center">
                                    {(() => {
                                        const allItems = [enemyEquipment?.weapon, ...(enemyEquipment?.armor || [])].filter(Boolean) as Item[];
                                        if (allItems.length === 0) return <span className="text-[10px] text-gray-600 italic">Sem equipamento</span>;
                                        return allItems.map((item, idx) => (
                                            <button key={idx}
                                                type="button"
                                                className="w-8 h-8 bg-black/80 border-2 flex items-center justify-center shadow-inner rounded-sm overflow-hidden relative group cursor-pointer transition-transform hover:scale-105"
                                                style={{
                                                    borderColor: RARITY_COLORS[item.rarity || 'common'].border,
                                                    boxShadow: `0 0 6px ${RARITY_COLORS[item.rarity || 'common'].glow}`
                                                }}
                                                title={item.name}
                                                onClick={() => openItemLightbox(item)}
                                            >
                                                <ItemIcon item={item} />
                                            </button>
                                        ))
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full border-2 border-dashed border-[#3a2a1a] rounded-sm flex flex-col items-center justify-center opacity-30 gap-2 p-6">
                                <span className="text-4xl">🌵</span>
                                <span className="font-serif tracking-widest text-[#3a2a1a] uppercase text-sm font-black">Nenhum Alvo</span>
                            </div>
                        )}
                </div>
            </div>

            <Lightbox
                src={lightboxSrc}
                isOpen={!!lightboxSrc}
                onClose={() => {
                    setLightboxSrc(null)
                    setLightboxAlt(null)
                    setLightboxStats(undefined)
                    setLightboxRequirements(undefined)
                }}
                alt={lightboxAlt || undefined}
                stats={lightboxStats}
                requirements={lightboxRequirements}
            />
        </div>
    )
}
