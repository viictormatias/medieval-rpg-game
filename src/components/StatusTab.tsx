'use client'

import { useEffect, useState } from 'react'
import { Profile, getUserInventory } from '@/lib/gameActions'
import { supabase } from '@/lib/supabase'
import { ITEMS } from '@/lib/items'
import { deriveSoulsStats } from '@/lib/soulslike'

interface StatusTabProps {
    profile: Profile
    onRefresh: () => void
}

/* ─── Atributos "base" do personagem ─── */
const ATTRIBUTES = [
    { key: 'strength', label: 'Força', icon: '⚔️', color: '#ef4444', desc: 'Dano físico, armas pesadas' },
    { key: 'defense', label: 'Defesa', icon: '🛡️', color: '#60a5fa', desc: 'Mitigação de dano recebido' },
    { key: 'agility', label: 'Agilidade', icon: '💨', color: '#4ade80', desc: 'Esquiva, velocidade de ação' },
    { key: 'accuracy', label: 'Precisão', icon: '🎯', color: '#f97316', desc: 'Chance de acerto e scaling fino' },
    { key: 'vigor', label: 'Vigor', icon: '🩸', color: '#a855f7', desc: 'HP máx e carga de equipamento' },
] as const

function buildArchetype(p: Profile): { label: string; color: string } {
    if (p.strength >= p.agility + 6) return { label: 'Força (Greatsword)', color: '#ef4444' }
    if (p.agility >= p.strength + 6) return { label: 'Destreza (Rapier)', color: '#4ade80' }
    if (p.strength >= 14 && p.agility >= 14) return { label: 'Quality Build', color: '#f2b90d' }
    if (p.vigor >= 18 && p.defense >= 14) return { label: 'Build Tanque', color: '#60a5fa' }
    return { label: 'Build Híbrida', color: '#c084fc' }
}

/* ─── Mini barra de progresso ─── */
function Bar({ value, max, color, height = 8 }: { value: number; max: number; color: string; height?: number }) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100))
    return (
        <div style={{ height, background: '#111', borderRadius: 4, overflow: 'hidden', flex: 1 }}>
            <div style={{
                height: '100%', width: `${pct}%`,
                background: `linear-gradient(90deg, ${color}88, ${color})`,
                borderRadius: 4, transition: 'width 0.4s ease'
            }} />
        </div>
    )
}

/* ─── Stat row no painel de combate ─── */
function StatRow({ label, value, positive }: { label: string; value: string | number; positive?: boolean }) {
    const isNum = typeof value === 'number'
    const color = positive === undefined ? '#c9a84c'
        : isNum && (value as number) >= 0 ? '#4ade80' : '#f87171'
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid #1a1a1a', paddingBottom: 6, marginBottom: 6
        }}>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280' }}>{label}</span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color }}>{value}</span>
        </div>
    )
}

export default function StatusTab({ profile, onRefresh }: StatusTabProps) {
    const [spending, setSpending] = useState(false)
    const [souls, setSouls] = useState<ReturnType<typeof deriveSoulsStats> | null>(null)

    const loadSouls = async () => {
        const inventory = await getUserInventory(profile.id)
        const equipped = (inventory || [])
            .filter((inv: any) => inv.is_equipped)
            .map((inv: any) => ITEMS.find(it => it.id === inv.item_id))
            .filter(Boolean)
        setSouls(deriveSoulsStats(profile, equipped as any))
    }

    useEffect(() => { loadSouls() }, [
        profile.id, profile.vigor, profile.strength, profile.agility, profile.accuracy, profile.defense
    ])

    const spendPoint = async (attr: 'strength' | 'defense' | 'agility' | 'accuracy' | 'vigor') => {
        if (profile.stat_points_available <= 0 || spending) return
        setSpending(true)
        const updates: any = {
            [attr]: (profile[attr] ?? 5) + 1,
            stat_points_available: profile.stat_points_available - 1
        }
        if (attr === 'vigor') {
            updates.hp_max = profile.hp_max + 10
            updates.hp_current = profile.hp_current + 10
        }
        await supabase.from('profiles').update(updates).eq('id', profile.id)
        await onRefresh()
        setSpending(false)
    }

    const xpToNext = profile.level * 100
    const xpPct = Math.min(100, (profile.xp / xpToNext) * 100)
    const hpPct = Math.min(100, (profile.hp_current / profile.hp_max) * 100)
    const archetype = buildArchetype(profile)

    const loadPct = souls?.equipLoadPct ?? 0
    const tierColor = loadPct < 30 ? '#4ade80' : loadPct < 70 ? '#f2b90d' : loadPct < 100 ? '#f97316' : '#dc2626'

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 820, margin: '0 auto' }}>

            {/* ═══ CABEÇALHO DO PERSONAGEM ═══ */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(18,10,2,0.9), rgba(10,10,10,0.9))',
                border: '1px solid #2a200a',
                borderRadius: 8,
                boxShadow: '0 0 24px rgba(242,185,13,0.08)',
            }}>
                {/* Avatar */}
                <div style={{
                    width: 72, height: 72, flexShrink: 0,
                    border: '2px solid #c9a84c', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, background: 'rgba(0,0,0,0.6)',
                    boxShadow: '0 0 20px rgba(242,185,13,0.2)',
                }}>⚔️</div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Nome / Nível */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {profile.username ?? 'Herói'}
                        </h2>
                        <span style={{ fontSize: 11, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                            Nível {profile.level} · {archetype.label}
                        </span>
                    </div>

                    {/* HP */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <span>Vida</span>
                            <span style={{ color: '#f87171', fontFamily: 'monospace' }}>{profile.hp_current} / {profile.hp_max}</span>
                        </div>
                        <Bar value={profile.hp_current} max={profile.hp_max} color="#ef4444" height={7} />
                    </div>

                    {/* XP */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <span>Experiência</span>
                            <span style={{ color: '#a855f7', fontFamily: 'monospace' }}>{profile.xp} / {xpToNext} XP</span>
                        </div>
                        <Bar value={profile.xp} max={xpToNext} color="#a855f7" height={7} />
                    </div>
                </div>
            </div>

            {/* Alerta de pontos disponíveis */}
            {profile.stat_points_available > 0 && (
                <div style={{
                    padding: '10px 16px', textAlign: 'center', borderRadius: 6,
                    border: '1px solid rgba(242,185,13,0.4)', background: 'rgba(242,185,13,0.06)',
                    fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.15em',
                    animation: 'pulse 2s infinite',
                }}>
                    ✨ {profile.stat_points_available} ponto(s) de atributo disponível(is) — distribua abaixo
                </div>
            )}

            {/* ═══ GRID PRINCIPAL: Atributos + Stats de Combate ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16, alignItems: 'start' }}>

                {/* ── Atributos ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ATTRIBUTES.map(({ key, label, icon, color, desc }) => {
                        const value = profile[key] ?? 5
                        const MAX_PIPS = 20
                        return (
                            <div key={key} style={{
                                display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px',
                                background: 'rgba(0,0,0,0.35)', border: '1px solid #1e1e1e', borderRadius: 7,
                                transition: 'border-color 0.2s',
                            }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = color + '55'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1e1e1e'}
                            >
                                {/* Ícone */}
                                <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e5e7eb' }}>{label}</span>
                                        <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color }}>{value}</span>
                                    </div>
                                    {/* Pips */}
                                    <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                                        {Array(MAX_PIPS).fill(null).map((_, i) => (
                                            <div key={i} style={{
                                                width: 8, height: 10, borderRadius: 2, flexShrink: 0,
                                                background: i < value ? color : '#1a1a1a',
                                                border: `1px solid ${i < value ? color + '55' : '#222'}`,
                                                boxShadow: i < value ? `0 0 4px ${color}44` : 'none',
                                                transition: 'background 0.2s',
                                            }} />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: 9, color: '#4b5563', fontStyle: 'italic' }}>{desc}</span>
                                </div>

                                {/* Botão gastar ponto */}
                                {profile.stat_points_available > 0 && (
                                    <button
                                        onClick={() => spendPoint(key)}
                                        disabled={spending}
                                        style={{
                                            flexShrink: 0, width: 30, height: 30, borderRadius: 6,
                                            background: `linear-gradient(135deg, ${color}22, ${color}11)`,
                                            border: `1px solid ${color}55`,
                                            color, fontSize: 18, fontWeight: 900, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s', opacity: spending ? 0.5 : 1,
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}33`; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 10px ${color}44` }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg,${color}22,${color}11)`; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                                    >+</button>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* ── Painel de Stats de Combate ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Vitais */}
                    <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid #1e1e1e', borderRadius: 7 }}>
                        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c9a84c', marginBottom: 10, fontWeight: 700 }}>
                            Recursos
                        </div>
                        <StatRow label="Vida Atual" value={`${profile.hp_current} / ${profile.hp_max}`} />
                        <StatRow label="Energia" value={profile.energy} />
                        <StatRow label="Gold" value={profile.gold} />
                        <StatRow label="XP Total" value={profile.xp} />
                        <StatRow label="Nível" value={profile.level} />
                    </div>

                    {/* Stats de combate derivados */}
                    {souls && (
                        <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid #1e1e1e', borderRadius: 7 }}>
                            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c9a84c', marginBottom: 10, fontWeight: 700 }}>
                                Combate
                            </div>
                            <StatRow label="Attack Rating" value={souls.attackRating} />
                            <StatRow label="Build" value={archetype.label} />

                            {/* Barra de carga */}
                            <div style={{ marginBottom: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>
                                    <span>Carga</span>
                                    <span style={{ fontFamily: 'monospace', color: tierColor }}>
                                        {souls.equipLoadCurrent.toFixed(1)} / {souls.equipLoadMax.toFixed(1)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Bar value={souls.equipLoadCurrent} max={souls.equipLoadMax} color={tierColor} height={6} />
                                    <span style={{ fontSize: 9, color: tierColor, fontFamily: 'monospace', flexShrink: 0 }}>
                                        {souls.equipLoadPct.toFixed(0)}%
                                    </span>
                                </div>
                            </div>

                            <StatRow label="Tier de Carga" value={souls.equipTier} />
                            <StatRow label="Bônus Esquiva" value={`${souls.dodgeBonus >= 0 ? '+' : ''}${souls.dodgeBonus}`}
                                positive={souls.dodgeBonus >= 0} />
                            <StatRow label="Pen. Stamina" value={`-${souls.staminaRegenPenalty}%`}
                                positive={souls.staminaRegenPenalty === 0} />

                            {souls.unmetRequirements.length > 0 && (
                                <div style={{
                                    marginTop: 6, padding: '6px 8px', borderRadius: 5,
                                    background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.35)',
                                    fontSize: 9, color: '#f87171'
                                }}>
                                    ⚠ Req. faltando: {souls.unmetRequirements.join(', ')}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bônus de equipamentos */}
                    {souls && Object.values(souls.bonuses).some(v => v !== 0) && (
                        <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid #1e1e1e', borderRadius: 7, fontSize: 10 }}>
                            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c9a84c', marginBottom: 10, fontWeight: 700 }}>
                                Bônus de Equipamento
                            </div>
                            {Object.entries(souls.bonuses).map(([stat, val]) =>
                                val !== 0 ? (
                                    <div key={stat} style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        borderBottom: '1px solid #1a1a1a', paddingBottom: 5, marginBottom: 5
                                    }}>
                                        <span style={{ textTransform: 'uppercase', color: '#6b7280', fontSize: 9 }}>{stat}</span>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 10, color: val >= 0 ? '#4ade80' : '#f87171' }}>
                                            {val > 0 ? '+' : ''}{val}
                                        </span>
                                    </div>
                                ) : null
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
