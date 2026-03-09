'use client'

import { useEffect, useState, useRef, CSSProperties } from 'react'
import { Profile, Enemy, COMBAT_ENERGY_COST, getEnemies, getUserInventory, resolveArenaCombat, ONBOARDING_STAT_POINTS } from '@/lib/gameActions'
import { simulateCombat, Fighter, NarrativeTurn } from '@/combat'
import { ITEMS as CATALOG_ITEMS, Item, ItemRarity } from '@/lib/items'
import { deriveSoulsStats, SoulsDerivedStats } from '@/lib/soulslike'
import CharacterPortrait from './CharacterPortrait'
import StatBar from './StatBar'

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

const BASE_CLASS_STAT_SUM = 10

function getEnemyStatBudget(level: number) {
    return BASE_CLASS_STAT_SUM + ONBOARDING_STAT_POINTS + (level - 1) * 3
}

function getEnemyBaseStats(enemy: Enemy) {
    const total = getEnemyStatBudget(enemy.level)

    let wStrength = Math.max(1, enemy.strength || 1)
    let wAgility = Math.max(1, enemy.agility || 1)
    let wAccuracy = Math.max(1, enemy.precision || 1)
    let wDefense = Math.max(1, Math.round(enemy.level * 0.8))
    let wVigor = Math.max(1, Math.round(enemy.level * 0.8))

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

type CombatLogEntry = NarrativeTurn & { isNew?: boolean }

function ItemIcon({ item, className = "" }: { item: Item; className?: string }) {
    const [imgError, setImgError] = useState(false)
    const displayUrl = item.image_url

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

export default function ArenaTab({ profile, onRefresh }: { profile: Profile; onRefresh: () => void }) {
    const [enemies, setEnemies] = useState<Enemy[]>([])
    const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null)
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
    const [soulsSnapshot, setSoulsSnapshot] = useState<SoulsDerivedStats | null>(null)
    const [playerEquipment, setPlayerEquipment] = useState<{ weapon: Item | null, armor: Item[] }>({ weapon: null, armor: [] })
    const logEndRef = useRef<HTMLDivElement>(null)

    const [finalCombatResult, setFinalCombatResult] = useState<{
        winnerName: string;
        finalPlayerHp: number;
        enemy: Enemy;
    } | null>(null);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
        }
    }, [combatLog])

    const loadSoulsSnapshot = async () => {
        const inventory = await getUserInventory(profile.id)
        const equippedItems = (inventory || [])
            .filter((inv: any) => inv.is_equipped)
            .map((inv: any) => CATALOG_ITEMS.find(it => it.id === inv.item_id))
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
            if (data.length > 0) {
                setSelectedEnemy(data[0])
                setEnemyHp(getEnemyMaxHp(data[0], CATALOG_ITEMS))
            }
        })
        loadSoulsSnapshot()
    }, [profile.id])


    const handleEnemyChange = (id: string) => {
        const en = enemies.find(e => e.id === id) || null
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

    const handleFight = async () => {
        if (!selectedEnemy) return
        if (profile.energy < COMBAT_ENERGY_COST) {
            alert(`Energia insuficiente. Necessário: ${COMBAT_ENERGY_COST}.`)
            return
        }
        setIsFighting(true)
        setShowCollectButton(false)
        setCombatLog([])
        setWinner(null)
        setCombatSummary(null)
        setPlayerHp(profile.hp_current)

        const baseEnemyStats = getEnemyBaseStats(selectedEnemy)

        const inventory = await getUserInventory(profile.id)
        const equippedItems = (inventory || [])
            .filter((inv: any) => inv.is_equipped)
            .map((inv: any) => CATALOG_ITEMS.find(it => it.id === inv.item_id))
            .filter(Boolean)

        let weaponName = 'punhos'
        equippedItems.forEach((item: any) => {
            if (item.type === 'weapon') weaponName = item.name
        })

        const souls = deriveSoulsStats(profile, equippedItems as any)
        setSoulsSnapshot(souls)

        const playerMaxHp = profile.hp_max + (souls.hpBonus || 0)
        const playerFighter: Fighter = {
            name: profile.username,
            hp: profile.hp_current + (souls.hpBonus || 0), // Start with current + bonus (assuming fully healed for bonus)
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
            await new Promise(resolve => setTimeout(resolve, 3200))

            const attackerName = turn.attacker.toLowerCase()
            const playerName = profile.username.toLowerCase()

            if (turn.damage > 0) {
                if (attackerName === playerName) {
                    setEnemyHp(turn.resultHp)
                    triggerShake('enemy', turn.isCritical)
                } else {
                    setPlayerHp(turn.resultHp)
                    triggerShake('player', turn.isCritical)
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
            enemy: balancedEnemy
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
            finalCombatResult.finalPlayerHp
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

    const totalStrength = profile.strength + (soulsSnapshot?.bonuses.strength || 0)
    const totalDefense = profile.defense + (soulsSnapshot?.bonuses.defense || 0)
    const totalAgility = profile.agility + (soulsSnapshot?.bonuses.agility || 0)
    const totalAccuracy = profile.accuracy + (soulsSnapshot?.bonuses.accuracy || 0)
    const totalVigor = profile.vigor + (soulsSnapshot?.bonuses.vigor || 0)

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
        <div className="relative flex flex-col gap-3 lg:h-[min(800px,calc(100vh-140px))] p-3 md:p-4 rounded-sm overflow-hidden" 
             style={{ 
                 backgroundImage: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url('/images/duelo1.jpeg')`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 backgroundAttachment: 'fixed'
             }}>
            {/* Combat status is now moved into the central column */}

            {/* THREE COLUMN LAYOUT ON DESKTOP */}
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 h-full min-h-0">
                
                {/* 1. PLAYER COLUMN */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                    <div className="bg-[#140d07]/90 border-2 border-[#3a2a1a] rounded-sm p-3 shadow-inner flex flex-col items-center h-full auto-rows-min">
                        <div className="flex justify-between w-full mb-2 items-center">
                            <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{profile.username}</span>
                            <span className="text-[10px] text-blue-200/50 font-mono">HP {playerHp}/{playerMaxHp}</span>
                        </div>
                        <div className="w-full h-2 mb-4 bg-black/60 border border-blue-900/30 rounded-full overflow-hidden shrink-0">
                            <div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-500" style={{ width: `${playerHpPct}%` }} />
                        </div>

                        <CharacterPortrait
                            src={CLASS_PORTRAITS[profile.class] || null}
                            fallbackEmoji="🤠"
                            borderColor="blue"
                            size="sm"
                            isHit={playerHit}
                        />

                        {/* Player Stats (TOTAL (+BÔNUS)) */}
                        <div className="grid grid-cols-5 gap-1 mt-auto pt-3 border-t border-[#3a2a1a]">
                            {[
                                { label: 'FOR', base: profile.strength, bonus: soulsSnapshot?.bonuses.strength || 0 },
                                { label: 'DEF', base: profile.defense, bonus: soulsSnapshot?.bonuses.defense || 0 },
                                { label: 'AGI', base: profile.agility, bonus: soulsSnapshot?.bonuses.agility || 0 },
                                { label: 'PON', base: profile.accuracy, bonus: soulsSnapshot?.bonuses.accuracy || 0 },
                                { label: 'VIG', base: profile.vigor, bonus: soulsSnapshot?.bonuses.vigor || 0 },
                            ].map(({ label, base, bonus }) => (
                                <div key={label} className="flex flex-col items-center">
                                    <span className="text-[10px] text-[#8a7a6a] font-bold uppercase tracking-wider">{label}</span>
                                    <div className="flex flex-col items-center leading-tight">
                                        <span className="text-sm font-black text-white">{base + bonus}</span>
                                        <div className="flex flex-col items-center text-[9px] text-gray-500 font-bold leading-none">
                                            <span>({base})</span>
                                            {bonus > 0 ? <span>(+{bonus})</span> : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Player Equipment Grid */}
                        <div className="flex flex-wrap gap-1.5 mt-auto pt-3 items-center justify-center">
                            {(() => {
                                const allItems = [playerEquipment.weapon, ...playerEquipment.armor].filter(Boolean) as Item[];
                                if (allItems.length === 0) return <span className="text-[10px] text-gray-600 italic">Sem equipamento</span>;
                                return allItems.map((item, idx) => (
                                    <div key={idx}
                                        className="w-8 h-8 bg-black/80 border-2 flex items-center justify-center shadow-inner rounded-sm overflow-hidden relative group"
                                        style={{
                                            borderColor: RARITY_COLORS[item.rarity || 'common'].border,
                                            boxShadow: `0 0 6px ${RARITY_COLORS[item.rarity || 'common'].glow}`
                                        }}
                                        title={item.name}
                                    >
                                        <ItemIcon item={item} />
                                    </div>
                                ));
                            })()}
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
                        <select
                            className="w-full bg-[#111] border-2 border-[#3a3a3a] text-white p-2 outline-none focus:border-red-600 transition-colors rounded-sm western-select text-sm font-black"
                            onChange={(e) => handleEnemyChange(e.target.value)}
                            disabled={isFighting || showCollectButton}
                            value={selectedEnemy?.id || ''}
                        >
                            <option value="">-- SELECIONAR ALVO --</option>
                            {enemies.map(en => (
                                <option key={en.id} value={en.id}>{en.name} (Nvl {en.level})</option>
                            ))}
                        </select>

                        {!showCollectButton ? (
                            <button
                                onClick={handleFight}
                                disabled={isFighting || !selectedEnemy || profile.energy < COMBAT_ENERGY_COST}
                                className="btn-western py-3 w-full text-sm font-black"
                            >
                                {isFighting ? '🔫 DUELANDO...' : '⚔️ INICIAR DUELO'}
                            </button>
                        ) : (
                            <button
                                onClick={handleCollectReward}
                                disabled={isResolving}
                                className="py-3 w-full text-sm font-black uppercase tracking-[0.1em] bg-gold text-black border-2 border-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.5)] animate-pulse"
                            >
                                {isResolving ? 'COLETANDO...' : '💰 COLETAR'}
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
                        <div className="bg-[#140d07]/90 border-2 border-[#3a2a1a] rounded-sm p-3 shadow-inner flex flex-col items-center h-full auto-rows-min">
                            <div className="flex justify-between w-full mb-2 items-center flex-row-reverse">
                                <span className="text-xs font-black text-red-500 uppercase tracking-widest">{selectedEnemy.name}</span>
                                <span className="text-[10px] text-red-300/50 font-mono">HP {enemyHp}/{enemyHpMax}</span>
                            </div>
                            <div className="w-full h-2 mb-4 bg-black/60 border border-red-900/30 rounded-full overflow-hidden shrink-0">
                                <div className="h-full bg-gradient-to-l from-red-700 to-red-500 transition-all duration-500" style={{ width: `${enemyHpPct}%`, marginLeft: 'auto' }} />
                            </div>

                            <CharacterPortrait
                                src={null}
                                fallbackEmoji="💀"
                                borderColor="red"
                                size="sm"
                                isHit={enemyHit}
                            />
                            {/* Enemy Stats (TOTAL = BASE + BÔNUS) */}
                             <div className="grid grid-cols-5 gap-1 mt-auto pt-3 border-t border-[#3a2a1a] w-full">
                                {[
                                    { label: 'FOR', base: enemyBase?.strength ?? selectedEnemy.strength, bonus: enemyBonusStrength },
                                    { label: 'DEF', base: enemyBase?.defense ?? 0, bonus: enemyBonusDefense },
                                    { label: 'AGI', base: enemyBase?.agility ?? selectedEnemy.agility, bonus: enemyBonusAgility },
                                    { label: 'PON', base: enemyBase?.accuracy ?? selectedEnemy.precision, bonus: enemyBonusAccuracy },
                                    { label: 'VIG', base: enemyBase?.vigor ?? 0, bonus: enemyBonusVigor },
                                ].map(({ label, base, bonus }) => (
                                    <div key={label} className="flex flex-col items-center">
                                        <span className="text-[10px] text-[#8a7a6a] font-bold uppercase tracking-wider">{label}</span>
                                        <div className="flex flex-col items-center leading-tight">
                                            <span className="text-sm font-black text-white">{base + bonus}</span>
                                            <div className="flex flex-col items-center text-[9px] text-gray-500 font-bold leading-none">
                                                <span>({base})</span>
                                                {bonus > 0 ? <span>(+{bonus})</span> : null}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Enemy Equipment Grid */}
                            <div className="flex flex-wrap gap-1.5 mt-auto pt-3 items-center justify-center">
                                {(() => {
                                    const allItems = [enemyEquipment?.weapon, ...(enemyEquipment?.armor || [])].filter(Boolean) as Item[];
                                    if (allItems.length === 0) return <span className="text-[10px] text-gray-600 italic">Sem equipamento</span>;
                                    return allItems.map((item, idx) => (
                                        <div key={idx}
                                            className="w-8 h-8 bg-black/80 border-2 flex items-center justify-center shadow-inner rounded-sm overflow-hidden relative group"
                                            style={{
                                                borderColor: RARITY_COLORS[item.rarity || 'common'].border,
                                                boxShadow: `0 0 6px ${RARITY_COLORS[item.rarity || 'common'].glow}`
                                            }}
                                            title={item.name}
                                        >
                                            <ItemIcon item={item} />
                                        </div>
                                    ));
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
        </div>
    )
}

