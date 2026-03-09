'use client'

import { useEffect, useState } from 'react'
import { Profile, getUserInventory } from '@/lib/gameActions'
import { supabase } from '@/lib/supabase'
import { ITEMS } from '@/lib/items'
import { deriveSoulsStats } from '@/lib/soulslike'
import CharacterPortrait from './CharacterPortrait'

interface StatusTabProps {
    profile: Profile
    onRefresh: () => void
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

/* ─── Atributos "base" do personagem ─── */
const ATTRIBUTES = [
    { key: 'strength', label: 'Força', icon: '⚔️', color: '#ef4444', desc: 'Aumenta o dano causado nos seus disparos.' },
    { key: 'defense', label: 'Defesa', icon: '🛡️', color: '#60a5fa', desc: 'Sua resistência a ferimentos.' },
    { key: 'agility', label: 'Agilidade', icon: '💨', color: '#4ade80', desc: 'Sua destreza e chance de esquiva.' },
    { key: 'accuracy', label: 'Pontaria', icon: '🎯', color: '#f97316', desc: 'Precisão crucial para acertar o alvo.' },
    { key: 'vigor', label: 'Vigor', icon: '💪', color: '#a855f7', desc: 'Sua vitalidade total. Cada ponto concede +10 de Vida máxima.' },
] as const

function buildTrend(p: Profile): { label: string; color: string } {
    const stats = [
        { label: 'Força', val: p.strength, color: '#ef4444' },
        { label: 'Agilidade', val: p.agility, color: '#4ade80' },
        { label: 'Defesa', val: p.defense, color: '#60a5fa' },
        { label: 'Vigor', val: p.vigor, color: '#a855f7' },
        { label: 'Pontaria', val: p.accuracy, color: '#f97316' },
    ]
    const highest = [...stats].sort((a, b) => b.val - a.val)[0]
    const avg = stats.reduce((acc, s) => acc + s.val, 0) / stats.length

    if (highest.val > avg + 5) return { label: `Especialista em ${highest.label}`, color: highest.color }
    if (highest.val > avg + 3) return { label: `Tendência: ${highest.label}`, color: highest.color }
    return { label: 'Pistoleiro Equilibrado', color: '#f2b90d' }
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
function StatRow({ label, value, base, bonus, positive, icon }: { label: string; value: string | number; base?: number; bonus?: number; positive?: boolean; icon?: string }) {
    const isNum = typeof value === 'number'
    const color = positive === undefined ? '#c9a84c'
        : isNum && (value as number) >= 0 ? '#4ade80' : '#f87171'
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid #1a1a1a', paddingBottom: 8, marginBottom: 8
        }}>
            <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6b7280', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6 }}>
                {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
                {label}
            </span>
            <div className="flex items-center gap-1.5 justify-end flex-wrap">
                <span style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 900, color }}>{value}</span>
                <div className="flex items-center text-[10px] font-bold text-gray-500 gap-1">
                    {base !== undefined && <span>({base})</span>}
                    {bonus !== undefined && bonus > 0 && <span>(+{bonus})</span>}
                </div>
            </div>
        </div>
    )
}

export default function StatusTab({ profile, onRefresh }: StatusTabProps) {
    const [saving, setSaving] = useState(false)
    const [souls, setSouls] = useState<ReturnType<typeof deriveSoulsStats> | null>(null)
    const [pending, setPending] = useState<Record<string, number>>({
        strength: 0,
        defense: 0,
        agility: 0,
        accuracy: 0,
        vigor: 0
    })

    const loadSouls = async () => {
        const inventory = await getUserInventory(profile.id)
        const equipped = (inventory || [])
            .filter((inv: any) => inv.is_equipped)
            .map((inv: any) => ITEMS.find(it => it.id === inv.item_id))
            .filter(Boolean)

        // Preview with pending stats
        const previewProfile = {
            ...profile,
            strength: profile.strength + (pending.strength || 0),
            defense: profile.defense + (pending.defense || 0),
            agility: profile.agility + (pending.agility || 0),
            accuracy: profile.accuracy + (pending.accuracy || 0),
            vigor: profile.vigor + (pending.vigor || 0)
        }
        setSouls(deriveSoulsStats(previewProfile, equipped as any))
    }

    useEffect(() => { loadSouls() }, [
        profile.id, profile.vigor, profile.strength, profile.agility, profile.accuracy, profile.defense,
        pending
    ])

    const totalPending = Object.values(pending).reduce((a, b) => a + b, 0)
    const hasPending = totalPending > 0

    const adjustPending = (attr: string, delta: number) => {
        if (delta > 0 && totalPending >= profile.stat_points_available) return
        if (delta < 0 && (pending[attr] || 0) <= 0) return

        setPending(prev => ({
            ...prev,
            [attr]: (prev[attr] || 0) + delta
        }))
    }

    const handleConfirm = async () => {
        const { distributeStatsBatch } = await import('@/lib/gameActions')
        setSaving(true)
        const success = await distributeStatsBatch(profile.id, pending as any)
        if (success) {
            setPending({ strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0 })
            await onRefresh()
        }
        setSaving(false)
    }

    const handleCancel = () => {
        setPending({ strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0 })
    }

    const xpToNext = profile.level * 100
    const trend = buildTrend(profile)

    return (
        <div className="flex flex-col gap-5 md:gap-6 max-w-[820px] mx-auto pb-24">

            {/* ─── CABEÇALHO DO PERSONAGEM ─── */}
            <div className="western-border p-4 md:p-5 flex items-center gap-4 md:gap-5 bg-gradient-to-br from-[#1f140c] to-[#140d07]">
                <div className="flex-1 flex flex-col gap-2 md:gap-3">
                    <div className="flex flex-col md:flex-row justify-between md:items-baseline gap-1">
                        <h2 className="title-western m-0 text-xl md:text-2xl text-[#d9c5b2]">
                            {profile.username ?? 'Pistoleiro'}
                        </h2>
                        <span className="text-[10px] md:text-xs color-gold-dark uppercase tracking-[0.15em] font-bold">
                            Nível {profile.level} · {trend.label}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] md:text-sm text-[#9ca3af] uppercase tracking-[0.2em] font-black">
                            <span>Vida</span>
                            <span className="text-[#f87171] font-mono font-bold">
                                {profile.hp_current + (pending.vigor * 10)} / {profile.hp_max + (pending.vigor * 10)}
                            </span>
                        </div>
                        <Bar value={profile.hp_current + (pending.vigor * 10)} max={profile.hp_max + (pending.vigor * 10)} color="#ef4444" height={8} />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] md:text-sm text-[#9ca3af] uppercase tracking-[0.2em] font-black">
                            <span>Experiência</span>
                            <span className="text-[#a855f7] font-mono font-bold">{profile.xp} / {xpToNext} XP</span>
                        </div>
                        <Bar value={profile.xp} max={xpToNext} color="#a855f7" height={8} />
                    </div>
                </div>
            </div>

            {profile.stat_points_available > 0 && (
                <div className={`relative western-border p-4 md:p-6 text-center border-gold shadow-[0_0_30px_rgba(242,185,13,0.2)] overflow-hidden group transition-all duration-500 ${hasPending ? 'bg-gold/5 opacity-80' : 'bg-gold/10 animate-pulse'}`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gold"></div>
                    <div className="absolute -top-10 -left-10 w-20 h-20 bg-gold/20 rotate-45 blur-xl group-hover:left-[110%] transition-all duration-1000"></div>
                    
                    <span className="text-xl md:text-2xl font-black text-gold uppercase tracking-[0.2em] block mb-2">
                        {hasPending ? '✨ DISTRIBUINDO PONTOS' : '✨ EVOLUÇÃO DISPONÍVEL!'}
                    </span>
                    
                    <span className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">
                        {hasPending 
                            ? `Você ainda tem ${profile.stat_points_available - totalPending} ponto(s) para distribuir.`
                            : `Você tem ${profile.stat_points_available} ponto(s) para distribuir e se tornar mais forte.`
                        }
                    </span>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gold"></div>
                </div>
            )}

            {hasPending && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl western-border bg-black/95 backdrop-blur-md border-gold p-4 flex items-center justify-between shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-bottom duration-500 rounded-sm">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gold uppercase font-black tracking-[0.2em]">Confirmar Atributos?</span>
                        <span className="text-white font-bold text-sm tracking-widest">{totalPending} ponto(s) aplicados</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleCancel} disabled={saving} className="px-4 py-2 border border-red-900/50 text-red-500 text-[10px] font-black uppercase hover:bg-red-950/30 transition-all active:scale-95">Descartar</button>
                        <button onClick={handleConfirm} disabled={saving} className="px-6 py-2 bg-gold text-black text-[11px] font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-lg border-2 border-black/20">{saving ? 'Salvando...' : 'Confirmar'}</button>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_260px] gap-5 items-start">
                <div className="w-full lg:w-auto order-first lg:order-last">
                    <div className="western-border p-4 bg-gradient-to-b from-[#1a120c] to-[#0d0906] border-gold shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        <div className="w-full aspect-square mb-6 relative border-2 border-gold-dark p-1 bg-black">
                            <CharacterPortrait
                                src={profile.image_url || CLASS_PORTRAITS[profile.class] || null}
                                fallbackEmoji="🤠"
                                size="full"
                                borderColor="transparent"
                                name={profile.username}
                            />
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gold text-black px-4 md:px-6 py-1.5 md:py-2 text-sm md:text-base font-black uppercase whitespace-nowrap tracking-[0.15em] rounded-sm shadow-xl border-2 border-black">
                                {profile.username}
                            </div>
                        </div>

                        <div className="text-[10px] md:text-[11px] uppercase text-[#c9a84c] mb-3 font-extrabold text-center tracking-[0.2em] border-b border-[#c9a84c33] pb-1">
                            Dados de Duelo
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <StatRow 
                                label="HP Máximo" 
                                value={profile.hp_max + (pending.vigor * 10) + (souls?.hpBonus || 0)} 
                                base={profile.hp_max + (pending.vigor * 10)} 
                                bonus={souls?.hpBonus || 0}
                                positive={pending.vigor > 0 || (souls?.hpBonus || 0) > 0} 
                                icon="❤️" 
                            />
                            <StatRow label="Energia" value={`${profile.energy} / 100`} icon="⚡" />
                            <StatRow 
                                label="Pontaria" 
                                value={(profile.accuracy + (pending.accuracy || 0) + (souls?.bonuses.accuracy || 0))} 
                                base={profile.accuracy + (pending.accuracy || 0)}
                                bonus={souls?.bonuses.accuracy || 0}
                                positive={pending.accuracy > 0 || (souls?.bonuses.accuracy || 0) > 0} 
                                icon="🎯" 
                            />
                            <StatRow 
                                label="Defesa" 
                                value={(profile.defense + (pending.defense || 0) + (souls?.bonuses.defense || 0))} 
                                base={profile.defense + (pending.defense || 0)}
                                bonus={souls?.bonuses.defense || 0}
                                positive={pending.defense > 0 || (souls?.bonuses.defense || 0) > 0} 
                                icon="🛡️" 
                            />
                        </div>

                        <div className="mt-3 pt-3 border-top border-[#c9a84c33]">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] text-[#6b7280] uppercase">Dano Estimado</span>
                                <span className={`text-xs font-bold font-mono transition-colors ${hasPending ? 'text-green-400' : 'text-white'}`}>
                                    {souls?.minDamage || 5}-{souls?.maxDamage || 10}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full flex flex-col gap-3 md:gap-4 order-last lg:order-first">
                    {ATTRIBUTES.map(({ key, label, icon, color, desc }) => {
                        const baseValue = profile[key] ?? 5
                        const pendingValue = pending[key] || 0
                        const totalValue = baseValue + pendingValue

                        return (
                            <div key={key} className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-black/45 border rounded-lg transition-all duration-300 group ${pendingValue > 0 ? 'border-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-[#2b1f14]'}`}>
                                <span className="text-xl md:text-2xl flex-shrink-0 w-8 text-center">{icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="text-base md:text-lg font-black uppercase text-[#e5e7eb] tracking-[0.1em]">{label}</span>
                                        <div className="flex items-baseline gap-2">
                                            {pendingValue > 0 && (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-black text-gold animate-bounce">+{pendingValue}</span>
                                                    {key === 'vigor' && (
                                                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter mt-[-4px]">+{pendingValue * 10} HP</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex flex-col items-end">
                                                <span className="text-2xl md:text-3xl font-black font-mono transition-all" style={{ color: pendingValue > 0 ? '#d4af37' : color, textShadow: `0 0 10px ${pendingValue > 0 ? '#d4af3744' : color + '44'}` }}>
                                                    {totalValue + (souls?.bonuses[key as keyof typeof souls.bonuses] || 0) + (key === 'vigor' ? (souls?.hpBonus || 0) : 0)}
                                                </span>
                                                <div className="flex items-center text-[10px] font-bold text-gray-500 gap-1 mt-[-4px]">
                                                    <span>({totalValue})</span>
                                                    {(souls?.bonuses[key as keyof typeof souls.bonuses] || 0) > 0 && <span>(+{souls?.bonuses[key as keyof typeof souls.bonuses]})</span>}
                                                    {key === 'vigor' && (souls?.hpBonus || 0) > 0 && <span>(+{souls?.hpBonus} HP EM ITEM)</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5 md:gap-1 mb-2 md:mb-2.5 overflow-hidden">
                                        {Array(25).fill(null).map((_, i) => (
                                            <div key={i} className="flex-1 h-3 md:h-4 rounded-xs transition-all duration-300" style={{
                                                background: i < baseValue ? color : (i < totalValue ? '#d4af37' : '#1a1a1a'),
                                                border: `1px solid ${i < baseValue ? color + '66' : (i < totalValue ? '#d4af37' : '#222')}`,
                                                opacity: i >= baseValue && i < totalValue ? 0.8 : 1
                                            }} />
                                        ))}
                                    </div>
                                    <span className="text-[11px] md:text-sm text-[#9ca3af] italic leading-relaxed block">{desc}</span>
                                </div>

                                {profile.stat_points_available > 0 && (
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => adjustPending(key, 1)}
                                            disabled={totalPending >= profile.stat_points_available}
                                            className="w-8 h-8 md:w-10 md:h-10 rounded-sm bg-gold/10 border border-gold/40 font-black text-lg text-gold flex items-center justify-center transition-all hover:bg-gold/20 disabled:opacity-20 active:scale-90"
                                        >+</button>
                                        {pendingValue > 0 && (
                                            <button
                                                onClick={() => adjustPending(key, -1)}
                                                className="w-8 h-8 md:w-10 md:h-10 rounded-sm bg-red-900/10 border border-red-900/40 font-black text-lg text-red-500 flex items-center justify-center transition-all hover:bg-red-900/20 active:scale-90"
                                            >-</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
