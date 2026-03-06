'use client'

import { useState } from 'react'
import { Profile, buyItem } from '@/lib/gameActions'
import { ITEMS, Item, ItemType } from '@/lib/items'
import { checkItemRequirements } from '@/lib/soulslike'
import Lightbox from './Lightbox'

const RARITY_COLORS: Record<string, { border: string; glow: string; label: string; textColor: string }> = {
    common: { border: '#3a3a3a', glow: 'transparent', label: 'Comum', textColor: '#9ca3af' },
    uncommon: { border: '#22c55e', glow: 'rgba(34,197,94,0.3)', label: 'Incomum', textColor: '#4ade80' },
    rare: { border: '#3b82f6', glow: 'rgba(59,130,246,0.3)', label: 'Raro', textColor: '#60a5fa' },
    epic: { border: '#a855f7', glow: 'rgba(168,85,247,0.4)', label: 'Épico', textColor: '#c084fc' },
    legendary: { border: '#f2b90d', glow: 'rgba(242,185,13,0.4)', label: 'Lendário', textColor: '#f2b90d' },
}

interface ShopTabProps {
    profile: Profile
    onRefresh: () => void
}

export default function ShopTab({ profile, onRefresh }: ShopTabProps) {
    const [buyingId, setBuyingId] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | ItemType>('all')
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
    const [lightboxAlt, setLightboxAlt] = useState<string | null>(null)
    const [lightboxStats, setLightboxStats] = useState<Record<string, number> | undefined>(undefined)

    const FILTER_LABELS: Record<'all' | ItemType, string> = {
        all: 'Tudo',
        weapon: 'Armas',
        shield: 'Off-hand',
        helmet: 'Chapeus',
        chest: 'Casacos',
        gloves: 'Luvas',
        legs: 'Calcas',
        boots: 'Botas',
        consumable: 'Suprimentos',
        misc: 'Diversos'
    }

    const handleBuy = async (item: Item) => {
        if (profile.gold < item.price) return
        setBuyingId(item.id)

        const success = await buyItem(profile.id, item.id, item.price)
        if (success) onRefresh()
        else alert('Falha na compra. Tente novamente.')

        setBuyingId(null)
    }

    const filteredItems = ITEMS.filter(it => filter === 'all' || it.type === filter)

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-[#d9c5b2] title-western uppercase tracking-widest text-shadow text-center md:text-left">
                    Loja da Fronteira
                </h2>
                <div className="flex flex-wrap gap-1.5 justify-center bg-[#1a120c] p-1.5 md:p-2 rounded-sm border border-[#2b1f14]">
                    {(['all', 'weapon', 'shield', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'consumable', 'misc'] as Array<'all' | ItemType>).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm uppercase font-black border transition-all ${filter === f ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_12px_rgba(212,175,55,0.3)]' : 'border-transparent text-[#a3907c] hover:text-[#d9c5b2]'}`}
                        >
                            {FILTER_LABELS[f]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredItems.map((item) => {
                    const canAfford = profile.gold >= item.price
                    const reqStatus = checkItemRequirements(profile, item)
                    const rarityColor = RARITY_COLORS[item.rarity || 'common']
                    return (
                        <div key={item.id} className="western-border p-3 md:p-4 flex gap-3 md:gap-4 items-start group relative overflow-hidden" style={{
                            background: 'linear-gradient(135deg, #1f140c, #140d07)',
                            borderColor: rarityColor.border,
                            boxShadow: `inset 0 0 15px rgba(0,0,0,0.7), 0 0 15px ${rarityColor.glow}`
                        }}>
                            <div className="absolute inset-0 border border-dashed opacity-20 pointer-events-none rounded-sm m-1" style={{ borderColor: rarityColor.border }}></div>

                            <div className="flex flex-col items-center gap-2 z-10">
                                <div
                                    className={`w-14 h-14 md:w-16 md:h-16 bg-[#2b1f14] border-2 flex items-center justify-center text-2xl md:text-3xl rounded-sm shadow-inner overflow-hidden ${item.image_url ? 'cursor-pointer hover:border-gold transition-colors' : ''}`}
                                    style={{ borderColor: rarityColor.border }}
                                    onClick={() => {
                                        if (item.image_url) {
                                            setLightboxSrc(item.image_url)
                                            setLightboxAlt(item.name)
                                            setLightboxStats(item.stats)
                                        }
                                    }}
                                >
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover hover:scale-110 transition-transform" />
                                    ) : (
                                        item.icon
                                    )}
                                </div>
                                <span className="text-[#d4af37] font-mono font-black text-sm md:text-lg bg-[#140d07] px-2 py-0.5 border border-[#2b1f14] rounded-sm shadow-inner whitespace-nowrap">{item.price} G</span>
                            </div>

                            <div className="flex-1 z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <h3 className="font-bold text-[#d9c5b2] group-hover:text-[#d4af37] transition-colors text-sm md:text-base font-serif tracking-wide">{item.name}</h3>
                                        <span className="text-[8px] md:text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border" style={{ color: rarityColor.textColor, borderColor: rarityColor.border, background: 'rgba(0,0,0,0.4)' }}>
                                            {rarityColor.label}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs md:text-base text-[#d9c5b2] leading-relaxed mb-3 italic font-medium">"{item.description}"</p>

                                <div className="text-[8px] md:text-[9px] text-gray-400 mb-2 flex gap-3 uppercase">
                                    {item.scaling && <span>Escalonamento: <span className="text-gold">{Object.entries(item.scaling).map(([k, v]) => `${(k === 'strength' ? 'FOR' : k === 'agility' ? 'AGI' : k === 'accuracy' ? 'PON' : 'VIG')} ${v}`).join(' | ')}</span></span>}
                                </div>

                                {item.requirements && (
                                    <div className={`text-[10px] md:text-sm mb-3 font-black uppercase tracking-tight ${reqStatus.meets ? 'text-green-400' : 'text-red-400'}`}>
                                        Requisitos: {Object.entries(item.requirements).map(([k, v]) => `${k.slice(0, 3).toUpperCase()} ${v}`).join(' | ')}
                                        {!reqStatus.meets && <div className="mt-1">Faltando: {reqStatus.unmetLabels.join(', ')}</div>}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-1.5 md:gap-2.5 mb-4">
                                    {item.stats && Object.entries(item.stats).map(([stat, val]) => (
                                        <div key={stat} className="flex justify-between items-center bg-[#1a140f] p-1.5 md:p-2 rounded-sm border border-[#3a2a1a] min-w-[70px] md:min-w-[100px]">
                                            <span className="text-[9px] md:text-xs text-gray-500 font-black uppercase">{(stat === 'strength' ? 'FORÇA' : stat === 'agility' ? 'AGILIDADE' : stat === 'accuracy' ? 'PONTARIA' : stat === 'vigor' ? 'VIGOR' : stat === 'defense' ? 'DEFESA' : stat === 'hp_current' ? 'VIDA' : stat === 'energy' ? 'ENERGIA' : stat.toUpperCase())}</span>
                                            <span className="text-gold font-black text-xs md:text-lg ml-2 md:ml-3">+{val}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleBuy(item)}
                                    disabled={!canAfford || buyingId === item.id}
                                    className={`w-full mt-auto py-2.5 md:py-4 text-xs md:text-base uppercase font-black transition-all shadow-lg ${canAfford
                                        ? 'bg-gold/10 border-2 border-gold text-gold hover:bg-gold hover:text-black hover:shadow-gold/20 shadow-[0_0_10px_rgba(212,175,55,0.1)] active:scale-95'
                                        : 'bg-gray-900 border-2 border-gray-800 text-gray-600 grayscale cursor-not-allowed'
                                        }`}
                                >
                                    {buyingId === item.id ? 'Processando...' : canAfford ? 'Comprar' : 'Sem Grana'}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            <Lightbox
                src={lightboxSrc}
                isOpen={!!lightboxSrc}
                onClose={() => {
                    setLightboxSrc(null)
                    setLightboxStats(undefined)
                }}
                alt={lightboxAlt || undefined}
                stats={lightboxStats}
            />
        </div>

    )
}
