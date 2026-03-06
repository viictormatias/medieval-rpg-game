'use client'

import { useEffect, useState, useRef } from 'react'
import { Profile, Enemy, COMBAT_ENERGY_COST, getEnemies, getUserInventory, resolveArenaCombat } from '@/lib/gameActions'
import { simulateCombat, Fighter, NarrativeTurn } from '@/combat'
import { ITEMS as CATALOG_ITEMS } from '@/lib/items'
import { deriveSoulsStats, SoulsDerivedStats } from '@/lib/soulslike'
import CharacterPortrait from './CharacterPortrait'
import StatBar from './StatBar'
import { ItemRarity } from '@/lib/items'

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

type CombatLogEntry = NarrativeTurn & { isNew?: boolean }

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
    const logEndRef = useRef<HTMLDivElement>(null)

    const [finalCombatResult, setFinalCombatResult] = useState<{
        winnerName: string;
        finalPlayerHp: number;
        enemy: Enemy;
    } | null>(null);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [combatLog])

    const loadSoulsSnapshot = async () => {
        const inventory = await getUserInventory(profile.id)
        const equippedItems = (inventory || [])
            .filter((inv: any) => inv.is_equipped)
            .map((inv: any) => CATALOG_ITEMS.find(it => it.id === inv.item_id))
            .filter(Boolean)
        setSoulsSnapshot(deriveSoulsStats(profile, equippedItems as any))
    }

    useEffect(() => {
        getEnemies().then(data => {
            setEnemies(data)
            if (data.length > 0) {
                setSelectedEnemy(data[0])
                setEnemyHp(data[0].hp_max)
            }
        })
        loadSoulsSnapshot()
    }, [profile.id])


    const handleEnemyChange = (id: string) => {
        const en = enemies.find(e => e.id === id) || null
        setSelectedEnemy(en)
        if (en) setEnemyHp(en.hp_max)
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
        setEnemyHp(selectedEnemy.hp_max)

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

        const playerFighter: Fighter = {
            name: profile.username,
            hp: profile.hp_current,
            strength: souls.attackRating,
            defense: profile.defense + souls.bonuses.defense,
            agility: profile.agility + souls.bonuses.agility,
            accuracy: Math.floor((profile.accuracy + souls.bonuses.accuracy) * souls.requirementPenalty),
            minDamage: souls.minDamage,
            maxDamage: souls.maxDamage,
            weaponName: weaponName
        }

        const enemyFighter: Fighter = {
            name: selectedEnemy.name,
            hp: selectedEnemy.hp_max,
            strength: selectedEnemy.strength,
            defense: 5,
            agility: selectedEnemy.agility,
            accuracy: selectedEnemy.precision,
            minDamage: Math.floor(selectedEnemy.strength * 0.8),
            maxDamage: Math.floor(selectedEnemy.strength * 1.2),
            weaponName: 'Arma de Inimigo'
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
        setFinalCombatResult({
            winnerName: result.winner,
            finalPlayerHp: finalPlayerHpVal,
            enemy: selectedEnemy
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

    const getLogStyle = (log: NarrativeTurn): React.CSSProperties => {
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

    const enemyHpMax = selectedEnemy?.hp_max || 1
    const playerIsWinner = winner?.toLowerCase() === profile.username.toLowerCase()

    const playerHpPct = Math.max(0, (playerHp / profile.hp_max) * 100)
    const enemyHpPct = Math.max(0, (enemyHp / enemyHpMax) * 100)

    return (
        <div className="flex flex-col gap-3">
            {/* STACK ON MOBILE, LADO A LADO ON DESKTOP: ARENA + LOG */}
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 h-auto lg:h-[380px]">

                {/* Cinematic Duel Arena */}
                <div className="relative w-full h-[220px] md:h-[260px] lg:h-full rounded-sm overflow-hidden border border-[#3a2a1a] shadow-2xl">
                    <img
                        src={selectedEnemy?.name === 'Coiote Sarnento' ? '/images/coiote.jpeg' : '/images/duelo1.jpeg'}
                        alt="Duelo no Oeste"
                        className="w-full h-full object-cover transition-opacity duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                    {/* TOP BARS: VISUAL HEALTH BARS - ADJUSTED FOR MOBILE */}
                    <div className="absolute top-2 md:top-4 inset-x-2 md:inset-x-4 flex gap-3 md:gap-8 z-20">
                        {/* Player HP Bar */}
                        <div className="flex-1">
                            <div className="flex justify-between items-end mb-0.5 md:mb-1">
                                <span className="text-[8px] md:text-[10px] font-black text-blue-400 uppercase tracking-widest truncate max-w-[60px] md:max-w-none">{profile.username}</span>
                                <span className="text-[8px] md:text-[10px] text-blue-200/50 font-mono">{playerHp}/{profile.hp_max}</span>
                            </div>
                            <div className="h-1.5 md:h-2.5 bg-black/60 border border-blue-900/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    style={{ width: `${playerHpPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Enemy HP Bar */}
                        <div className="flex-1">
                            <div className="flex justify-between items-end mb-0.5 md:mb-1 flex-row-reverse">
                                <span className="text-[8px] md:text-[10px] font-black text-red-500 uppercase tracking-widest truncate max-w-[60px] md:max-w-none">{selectedEnemy?.name || '???'}</span>
                                <span className="text-[8px] md:text-[10px] text-red-300/50 font-mono">{enemyHp}/{enemyHpMax}</span>
                            </div>
                            <div className="h-1.5 md:h-2.5 bg-black/60 border border-red-900/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-l from-red-700 to-red-500 transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                    style={{ width: `${enemyHpPct}%`, marginLeft: 'auto' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Character Portraits in Arena - SMALLER ON MOBILE */}
                    <div className="absolute inset-x-2 md:inset-x-4 bottom-2 md:bottom-4 flex justify-between items-end">
                        <CharacterPortrait
                            src={CLASS_PORTRAITS[profile.class] || null}
                            fallbackEmoji="🤠"
                            borderColor="blue"
                            size="xs"
                            className="md:!w-16 md:!h-16"
                            isHit={playerHit}
                        />
                        <CharacterPortrait
                            src={null}
                            fallbackEmoji="💀"
                            borderColor="red"
                            size="xs"
                            className="md:!w-16 md:!h-16"
                            isHit={enemyHit}
                        />
                    </div>

                    {/* VS Overlay */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
                        <div className="text-3xl md:text-4xl lg:text-5xl font-black text-[#a52a2a] italic tracking-tighter drop-shadow-2xl animate-pulse">VS</div>
                        {isFighting && (
                            <div className="text-[8px] md:text-[9px] text-gold font-bold uppercase tracking-[0.2em] mt-1">
                                Trocando Tiros
                            </div>
                        )}
                    </div>
                </div>

                {/* Combat Log Panel */}
                <div className="western-border bg-black/50 rounded-sm overflow-hidden flex flex-col h-[200px] md:h-[300px] lg:h-full">
                    <div className="flex items-center justify-between px-3 md:px-4 py-1.5 md:py-2 border-b border-[#2a2a2a] bg-black/40">
                        <span className="text-[10px] md:text-xs font-black text-gold uppercase tracking-[0.2em]">Crônica do Duelo</span>
                        {combatLog.length > 0 && <span className="text-[8px] md:text-[10px] text-gray-600 font-mono uppercase">T{combatLog.length}</span>}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 md:p-3 font-serif text-[12px] md:text-[14px] space-y-1.5 md:space-y-2 scroll-smooth bg-[#0a0a0a]/30">
                        {combatLog.length === 0 && !winner && (
                            <div className="text-gray-600 text-center italic mt-12 text-[10px] md:text-[11px] tracking-widest uppercase opacity-40">
                                Sangue na poeira...
                            </div>
                        )}

                        {combatLog.map((log, i) => (
                            <div key={i} className={`flex items-start gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 rounded-sm border-l-2 ${log.isCritical ? 'border-red-600 bg-red-950/20' : 'border-transparent'}`} style={getLogStyle(log)}>
                                <span className="flex-1 leading-relaxed text-base">{log.narrative}</span>
                                {log.damage > 0 && <span className="text-[10px] md:text-xs font-black min-w-[30px] md:w-[40px] text-right">-{log.damage}</span>}
                            </div>
                        ))}

                        {winner && (
                            <div className={`mt-2 md:mt-3 p-2 md:p-3 text-center rounded-sm border-2 animate-in fade-in zoom-in duration-500 ${playerIsWinner ? 'bg-gold/10 border-gold/30' : 'bg-red-900/10 border-red-900/30'}`}>
                                <div className="text-lg md:text-xl mb-1">{playerIsWinner ? '🏆' : '💀'}</div>
                                <div className={`text-sm md:text-base font-black uppercase tracking-[0.1em] title-western ${playerIsWinner ? 'text-gold' : 'text-red-500'}`}>
                                    {playerIsWinner ? 'Vitória!' : 'Derrota!'}
                                </div>
                            </div>
                        )}
                        <div ref={logEndRef} />
                    </div>
                </div>
            </div>


            {/* CONTROLS AREA - COMPACTED */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mt-1 w-full">
                <select
                    className="w-full sm:w-80 bg-[#111] border-2 border-[#3a3a3a] text-white text-base p-3 outline-none focus:border-red-600 transition-colors rounded-sm western-select font-black"
                    onChange={(e) => handleEnemyChange(e.target.value)}
                    disabled={isFighting || showCollectButton}
                    value={selectedEnemy?.id || ''}
                >
                    <option value="" className="bg-[#111]">-- SELECIONAR ALVO --</option>
                    {enemies.map(en => (
                        <option key={en.id} value={en.id} className="bg-[#111]">{en.name} (Nvl {en.level})</option>
                    ))}
                </select>

                {!showCollectButton ? (
                    <button
                        onClick={handleFight}
                        disabled={isFighting || !selectedEnemy || profile.energy < COMBAT_ENERGY_COST}
                        className="btn-western py-4 px-8 text-base font-black min-w-[200px]"
                    >
                        {isFighting ? '🔫 DUELANDO...' : '⚔️ INICIAR DUELO'}
                    </button>
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

            {/* REWARDS SUMMARY - DISCRETE */}
            {combatSummary && (
                <div className="flex flex-wrap gap-4 justify-center items-center p-4 bg-[#140d07] border border-gold/40 rounded-sm text-sm animate-in zoom-in duration-300 shadow-2xl">
                    <span className="text-gold font-black uppercase tracking-[0.2em] border-b border-gold/20 pb-0.5">Espólios do Duelo:</span>
                    <span className="text-green-400 font-black">+{combatSummary.xpGain} XP</span>
                    <span className="text-yellow-400 font-black">+{combatSummary.goldGain} O</span>
                    <span className="text-blue-400 font-black">-{combatSummary.energyCost} E</span>
                    {combatSummary.consumableDrop && <span className="text-purple-400 font-black">📦 {combatSummary.consumableDrop.name}</span>}
                    {combatSummary.equipmentDrop && (
                        <span style={{ color: RARITY_COLORS[combatSummary.equipmentDrop.rarity]?.textColor }} className="font-black border-l border-white/10 pl-3 ml-2">⚔️ {combatSummary.equipmentDrop.name}</span>
                    )}
                </div>
            )}
        </div>
    )
}
