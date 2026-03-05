'use client'

import { useEffect, useState, useRef } from 'react'
import { Profile, Enemy, getEnemies, getUserInventory } from '@/lib/gameActions'
import { simulateCombat, Fighter, NarrativeTurn } from '@/combat'
import { ITEMS as CATALOG_ITEMS } from '@/lib/items'
import { deriveSoulsStats, SoulsDerivedStats } from '@/lib/soulslike'
import CharacterPortrait from './CharacterPortrait'
import StatBar from './StatBar'

type CombatLogEntry = NarrativeTurn & { isNew?: boolean }

export default function ArenaTab({ profile }: { profile: Profile }) {
    const [enemies, setEnemies] = useState<Enemy[]>([])
    const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null)
    const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([])
    const [isFighting, setIsFighting] = useState(false)
    const [winner, setWinner] = useState<string | null>(null)
    const [playerHp, setPlayerHp] = useState(profile.hp_current)
    const [enemyHp, setEnemyHp] = useState<number>(0)
    const [playerHit, setPlayerHit] = useState<'normal' | 'critical' | false>(false)
    const [enemyHit, setEnemyHit] = useState<'normal' | 'critical' | false>(false)
    const [soulsSnapshot, setSoulsSnapshot] = useState<SoulsDerivedStats | null>(null)
    const logEndRef = useRef<HTMLDivElement>(null)

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

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [combatLog])

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
        setIsFighting(true)
        setCombatLog([])
        setWinner(null)
        setPlayerHp(profile.hp_current)
        setEnemyHp(selectedEnemy.hp_max)

        const inventory = await getUserInventory(profile.id)
        const equippedItems = (inventory || [])
            .filter((inv: any) => inv.is_equipped)
            .map((inv: any) => CATALOG_ITEMS.find(it => it.id === inv.item_id))
            .filter(Boolean)

        let weaponName = 'as maos'
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
            agility: profile.agility + souls.bonuses.agility + souls.dodgeBonus,
            accuracy: Math.floor((profile.accuracy + souls.bonuses.accuracy) * souls.requirementPenalty),
            stamina: 100,
            weaponName
        }

        const enemyFighter: Fighter = {
            name: selectedEnemy.name,
            hp: selectedEnemy.hp_max,
            strength: selectedEnemy.strength,
            defense: 5,
            agility: selectedEnemy.agility,
            accuracy: selectedEnemy.precision,
            stamina: 100,
            weaponName: 'garras'
        }

        const result = simulateCombat(playerFighter, enemyFighter)

        for (const turn of result.history) {
            await new Promise(resolve => setTimeout(resolve, 2500))

            if (turn.damage > 0) {
                if (turn.attacker === profile.username) {
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
        setIsFighting(false)
    }

    const getLogStyle = (log: NarrativeTurn): React.CSSProperties => {
        if (log.isMiss) return { color: '#6b7280', fontWeight: 'normal', background: 'transparent' }
        if (log.isCritical) {
            return {
                color: '#ef4444',
                fontWeight: 'bold',
                background: 'rgba(239,68,68,0.1)',
                textShadow: '0 0 10px rgba(220, 38, 38, 0.8)'
            }
        }
        if (log.attacker === profile.username) return { color: '#fbbf24', fontWeight: 'normal', background: 'transparent' }
        return { color: '#f97316', fontWeight: 'normal', background: 'transparent' }
    }

    const enemyHpMax = selectedEnemy?.hp_max || 1
    const playerIsWinner = winner === profile.username

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <div className="medieval-border p-5 flex flex-col items-center gap-3 text-center transition-all">
                    <CharacterPortrait
                        src={null}
                        fallbackEmoji="🛡️"
                        borderColor="blue"
                        size="lg"
                        name={profile.username}
                        isHit={playerHit}
                    />

                    <div className="w-full space-y-1">
                        <div className="text-[9px] uppercase text-gray-500 tracking-widest mb-1">HP</div>
                        <StatBar value={playerHp} max={profile.hp_max} type="hp" label="HP" showValues compact />
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 w-full mt-1">
                        <div className="flex justify-between text-[9px] border-b border-[#2a2a2a] py-0.5">
                            <span className="text-gray-500 uppercase">AR</span>
                            <span className="text-gold font-bold font-mono">{soulsSnapshot?.attackRating ?? profile.strength}</span>
                        </div>
                        <div className="flex justify-between text-[9px] border-b border-[#2a2a2a] py-0.5">
                            <span className="text-gray-500 uppercase">DEF</span>
                            <span className="text-gold font-bold font-mono">{profile.defense + (soulsSnapshot?.bonuses.defense || 0)}</span>
                        </div>
                        <div className="flex justify-between text-[9px] border-b border-[#2a2a2a] py-0.5">
                            <span className="text-gray-500 uppercase">AGI</span>
                            <span className="text-gold font-bold font-mono">
                                {profile.agility + (soulsSnapshot?.bonuses.agility || 0) + (soulsSnapshot?.dodgeBonus || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between text-[9px] border-b border-[#2a2a2a] py-0.5">
                            <span className="text-gray-500 uppercase">PRE</span>
                            <span className="text-gold font-bold font-mono">
                                {Math.floor((profile.accuracy + (soulsSnapshot?.bonuses.accuracy || 0)) * (soulsSnapshot?.requirementPenalty || 1))}
                            </span>
                        </div>
                    </div>

                    {soulsSnapshot && (
                        <div className="w-full mt-2 text-[9px] uppercase tracking-wider text-gray-500 border-t border-[#2a2a2a] pt-2 space-y-1">
                            <div className="flex justify-between">
                                <span>Carga</span>
                                <span className="text-gold">{soulsSnapshot.equipTier} ({soulsSnapshot.equipLoadPct.toFixed(1)}%)</span>
                            </div>
                            {soulsSnapshot.unmetRequirements.length > 0 && (
                                <div className="text-red-400">Requisitos faltando: {soulsSnapshot.unmetRequirements.join(', ')}</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-1 px-2">
                    <div className="vs-indicator text-3xl font-black text-gold">VS</div>
                    {isFighting && (
                        <div className="text-[9px] text-gray-500 uppercase tracking-widest animate-pulse">Em combate</div>
                    )}
                </div>

                <div className="medieval-border p-5 flex flex-col items-center gap-3 text-center">
                    <CharacterPortrait
                        src={null}
                        fallbackEmoji="👹"
                        borderColor="red"
                        size="lg"
                        name={selectedEnemy?.name || '???'}
                        isHit={enemyHit}
                    />

                    <div className="w-full space-y-1">
                        <div className="text-[9px] uppercase text-gray-500 tracking-widest mb-1">HP</div>
                        <StatBar value={enemyHp} max={enemyHpMax} type="hp" label="HP" showValues compact />
                    </div>

                    {selectedEnemy && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 w-full mt-1">
                            <div className="flex justify-between text-[9px] border-b border-[#2a2a2a] py-0.5">
                                <span className="text-gray-500 uppercase">FOR</span>
                                <span className="text-red-400 font-bold font-mono">{selectedEnemy.strength}</span>
                            </div>
                            <div className="flex justify-between text-[9px] border-b border-[#2a2a2a] py-0.5">
                                <span className="text-gray-500 uppercase">DEF</span>
                                <span className="text-red-400 font-bold font-mono">5</span>
                            </div>
                            <div className="flex justify-between text-[9px] border-b border-[#2a2a2a] py-0.5">
                                <span className="text-gray-500 uppercase">AGI</span>
                                <span className="text-red-400 font-bold font-mono">{selectedEnemy.agility}</span>
                            </div>
                            <div className="flex justify-between text-[9px] border-b border-[#2a2a2a] py-0.5">
                                <span className="text-gray-500 uppercase">PRE</span>
                                <span className="text-red-400 font-bold font-mono">{selectedEnemy.precision}</span>
                            </div>
                        </div>
                    )}

                    <div className="w-full mt-2 ornament-divider text-[9px]">INIMIGO</div>
                    <select
                        className="w-full bg-[#111] border border-[#3a3a3a] text-white text-xs p-2 outline-none focus:border-red-600 transition-colors rounded-sm"
                        onChange={(e) => handleEnemyChange(e.target.value)}
                        disabled={isFighting}
                    >
                        {enemies.map(en => (
                            <option key={en.id} value={en.id}>{en.name} - Nvl {en.level} (HP: {en.hp_max})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleFight}
                    disabled={isFighting || !selectedEnemy}
                    className="btn-medieval px-16 py-4 text-xl"
                    style={!isFighting ? { boxShadow: '0 0 24px rgba(242,185,13,0.25), 0 4px 16px rgba(0,0,0,0.6)' } : {}}
                >
                    {isFighting ? (
                        <span className="flex items-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                            Combatendo...
                        </span>
                    ) : '⚔️ DESAFIAR INIMIGO'}
                </button>
            </div>

            <div className="medieval-border bg-black/50 rounded-sm overflow-hidden" style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)' }}>
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a]" style={{ background: 'linear-gradient(90deg, rgba(242,185,13,0.05), transparent)' }}>
                    <span className="text-[11px] font-bold text-gold uppercase tracking-[0.3em]">Cronica do Combate</span>
                    {combatLog.length > 0 && <span className="text-[9px] text-gray-600 font-mono">{combatLog.length} turnos</span>}
                </div>

                <div className="h-56 overflow-y-auto p-3 font-mono text-xs space-y-0.5 scroll-smooth">
                    {combatLog.length === 0 && !winner && (
                        <div className="text-gray-600 text-center italic mt-8 text-[11px]">
                            O campo de batalha aguarda sua coragem...
                        </div>
                    )}

                    {combatLog.map((log, i) => {
                        const s = getLogStyle(log)
                        return (
                            <div
                                key={i}
                                className={`combat-log-entry flex items-start gap-2 px-2 py-2 rounded-sm border-l-2 ${log.isCritical ? 'border-red-600 my-1' : 'border-transparent'}`}
                                style={s}
                            >
                                <span className={`text-[9px] flex-shrink-0 mt-0.5 ${log.isCritical ? 'text-red-400 font-black' : 'text-gray-700 font-bold'}`}>
                                    Turno {log.turn}
                                </span>
                                <span className="flex-1 leading-relaxed text-[13px]">{log.narrative}</span>
                                {log.damage > 0 && (
                                    <span className="text-[9px] flex-shrink-0 opacity-60 mt-0.5 whitespace-nowrap">
                                        -{log.damage} HP
                                    </span>
                                )}
                            </div>
                        )
                    })}

                    {winner && (
                        <div
                            className="mt-4 py-4 text-center rounded-sm fade-in-up"
                            style={{
                                background: playerIsWinner
                                    ? 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(242,185,13,0.05))'
                                    : 'linear-gradient(135deg, rgba(178,34,34,0.1), rgba(220,38,38,0.05))',
                                border: `1px solid ${playerIsWinner ? '#f2b90d44' : '#dc262644'}`,
                            }}
                        >
                            <div className="text-2xl mb-1">{playerIsWinner ? '🏆' : '💀'}</div>
                            <div
                                className="text-base font-black uppercase tracking-widest title-medieval"
                                style={{ color: playerIsWinner ? '#f2b90d' : '#ef4444' }}
                            >
                                {playerIsWinner ? 'Vitoria!' : 'Derrota!'}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                                {winner} prevalece
                            </div>
                        </div>
                    )}
                    <div ref={logEndRef} />
                </div>
            </div>
        </div>
    )
}
