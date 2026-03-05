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

const ATTRIBUTES = [
    { key: 'strength', label: 'Forca', icon: '⚔️', desc: 'Dano base e armas pesadas' },
    { key: 'defense', label: 'Defesa', icon: '🛡️', desc: 'Mitigacao de dano recebido' },
    { key: 'agility', label: 'Agilidade', icon: '💨', desc: 'Esquiva e velocidade' },
    { key: 'accuracy', label: 'Precisao', icon: '🎯', desc: 'Taxa de acerto e scaling fino' },
    { key: 'vigor', label: 'Vigor', icon: '🩸', desc: 'HP maximo e carga de equipamento' },
] as const

function buildArchetype(profile: Profile) {
    if (profile.strength >= profile.agility + 6) return 'Build Forca (Greatsword)'
    if (profile.agility >= profile.strength + 6) return 'Build Destreza (Rapier)'
    if (profile.strength >= 14 && profile.agility >= 14) return 'Build Quality'
    if (profile.vigor >= 18 && profile.defense >= 14) return 'Build Tank'
    return 'Build Hibrida'
}

export default function StatusTab({ profile, onRefresh }: StatusTabProps) {
    const [spending, setSpending] = useState(false)
    const [soulsSummary, setSoulsSummary] = useState<ReturnType<typeof deriveSoulsStats> | null>(null)

    const loadSoulsSummary = async () => {
        const inventory = await getUserInventory(profile.id)
        const equipped = (inventory || [])
            .filter((inv: any) => inv.is_equipped)
            .map((inv: any) => ITEMS.find(it => it.id === inv.item_id))
            .filter(Boolean)
        setSoulsSummary(deriveSoulsStats(profile, equipped as any))
    }

    useEffect(() => {
        loadSoulsSummary()
    }, [profile.id, profile.vigor, profile.strength, profile.agility, profile.accuracy, profile.defense])

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

    const xpToNextLevel = profile.level * 100
    const xpPct = Math.min(100, (profile.xp / xpToNextLevel) * 100)

    return (
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 border-2 border-gold rounded-full flex items-center justify-center text-4xl bg-black/40" style={{ boxShadow: '0 0 20px rgba(242,185,13,0.2)' }}>
                    ⚔️
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Ficha de Personagem</h2>
                    <div className="text-gold text-sm uppercase tracking-widest">Nivel {profile.level} · {profile.gold} Gold</div>
                    <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>Experiencia</span>
                            <span>{profile.xp} / {xpToNextLevel} XP</span>
                        </div>
                        <div className="h-2 bg-black/50 border border-white/10 rounded-full overflow-hidden w-48">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${xpPct}%`, background: 'linear-gradient(to right, #7c3aed, #a855f7)' }} />
                        </div>
                    </div>
                </div>
            </div>

            {profile.stat_points_available > 0 && (
                <div className="border border-yellow-500/50 bg-yellow-500/5 p-4 text-center rounded animate-pulse" style={{ boxShadow: '0 0 15px rgba(242,185,13,0.1)' }}>
                    <span className="text-yellow-400 font-bold uppercase tracking-[0.2em] text-xs">
                        {profile.stat_points_available} ponto(s) de atributo disponivel(is)
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ATTRIBUTES.map(({ key, label, icon, desc }) => {
                    const value = profile[key] ?? 5
                    return (
                        <div key={key} className="medieval-border p-4 flex items-center gap-4 bg-black/20">
                            <div className="text-3xl">{icon}</div>
                            <div className="flex-1">
                                <div className="text-white font-bold text-xs uppercase tracking-wider">{label}</div>
                                <div className="text-gray-500 text-[10px] italic">{desc}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex gap-[2px]">
                                        {Array(10).fill(null).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-2.5 h-3.5 rounded-sm"
                                                style={{
                                                    background: i < value ? (key === 'vigor' ? '#ef4444' : '#f2b90d') : '#1a1a1a',
                                                    border: '1px solid #333',
                                                    boxShadow: i < value ? `0 0 5px ${key === 'vigor' ? '#ef444444' : '#f2b90d44'}` : 'none'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-white font-black text-sm ml-1">{value}</span>
                                </div>
                            </div>
                            {profile.stat_points_available > 0 && (
                                <button onClick={() => spendPoint(key)} disabled={spending} className="btn-medieval px-3 py-1 text-lg font-black" title="Gastar 1 ponto">
                                    +
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="medieval-border p-4 grid grid-cols-3 gap-4 text-sm bg-black/40">
                <h3 className="col-span-3 text-gold uppercase text-[10px] tracking-[0.3em] font-bold border-b border-[#3a3a3a] pb-2 mb-1">
                    Estatisticas Vitais
                </h3>
                <div className="flex flex-col">
                    <span className="text-gray-600 text-[9px] uppercase tracking-widest">Vida Maxima</span>
                    <span className="text-red-500 font-bold text-lg">{profile.hp_max}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-600 text-[9px] uppercase tracking-widest">Energia</span>
                    <span className="text-blue-500 font-bold text-lg">{profile.energy}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-600 text-[9px] uppercase tracking-widest">Tesouro</span>
                    <span className="text-gold font-bold text-lg">{profile.gold}</span>
                </div>
            </div>

            {soulsSummary && (
                <div className="medieval-border p-4 bg-black/40 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-gold uppercase text-[10px] tracking-[0.3em] font-bold mb-2">Resumo Souls-like</h3>
                        <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between border-b border-[#222] pb-1">
                                <span className="text-gray-400">Build</span>
                                <span className="text-gold">{buildArchetype(profile)}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#222] pb-1">
                                <span className="text-gray-400">Attack Rating</span>
                                <span className="text-gold">{soulsSummary.attackRating}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#222] pb-1">
                                <span className="text-gray-400">Equip Load</span>
                                <span className="text-gold">{soulsSummary.equipLoadCurrent.toFixed(1)} / {soulsSummary.equipLoadMax.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#222] pb-1">
                                <span className="text-gray-400">Tier</span>
                                <span className="text-gold">{soulsSummary.equipTier} ({soulsSummary.equipLoadPct.toFixed(1)}%)</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-gray-500 uppercase text-[10px] tracking-[0.2em] mb-2">Impacto de Mobilidade</h4>
                        <div className="text-[11px] space-y-1">
                            <div className="flex justify-between border-b border-[#222] pb-1">
                                <span className="text-gray-400">Bonus de Esquiva</span>
                                <span className={soulsSummary.dodgeBonus >= 0 ? 'text-green-400' : 'text-red-400'}>
                                    {soulsSummary.dodgeBonus >= 0 ? '+' : ''}{soulsSummary.dodgeBonus}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-[#222] pb-1">
                                <span className="text-gray-400">Penalidade de Folego</span>
                                <span className="text-red-400">-{soulsSummary.staminaRegenPenalty}%</span>
                            </div>
                            {soulsSummary.unmetRequirements.length > 0 && (
                                <div className="text-red-400 mt-2">
                                    Requisitos faltando: {soulsSummary.unmetRequirements.join(', ')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
