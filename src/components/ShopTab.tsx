'use client'

import { useState, useEffect } from 'react'
import { Profile, buyItem, sellItem, getUserInventory } from '@/lib/gameActions'
import { ITEMS, Item, ItemType, getItemById } from '@/lib/items'
import { checkItemRequirements } from '@/lib/soulslike'
import Lightbox from './Lightbox'

const RARITY_COLORS: Record<string, { border: string; glow: string; label: string; textColor: string }> = {
    common: { border: '#3a3a3a', glow: 'transparent', label: 'Comum', textColor: '#9ca3af' },
    uncommon: { border: '#22c55e', glow: 'rgba(34,197,94,0.3)', label: 'Incomum', textColor: '#4ade80' },
    rare: { border: '#3b82f6', glow: 'rgba(59,130,246,0.3)', label: 'Raro', textColor: '#60a5fa' },
    epic: { border: '#a855f7', glow: 'rgba(168,85,247,0.4)', label: 'Épico', textColor: '#c084fc' },
    legendary: { border: '#f2b90d', glow: 'rgba(242,185,13,0.4)', label: 'Lendário', textColor: '#f2b90d' },
}

function ItemIcon({ item, className = "" }: { item: any; className?: string }) {
    const [imgError, setImgError] = useState(false)
    const displayUrl = item.image_url

    if (displayUrl && !imgError) {
        return (
            <img
                src={displayUrl}
                alt={item.name}
                className={`w-full h-full object-cover transition-all duration-300 ease-out group-hover:scale-[1.08] group-hover:brightness-110 ${className}`}
                onError={() => setImgError(true)}
            />
        )
    }

    return <span className="text-xl md:text-2xl">{item.icon}</span>
}

interface ShopTabProps {
    profile: Profile
    onRefresh: () => void
}

export default function ShopTab({ profile, onRefresh }: ShopTabProps) {
    const [mode, setMode] = useState<'buy' | 'sell'>('buy')
    const [invItems, setInvItems] = useState<any[]>([])
    const [actionId, setActionId] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | ItemType>('all')
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
    const [lightboxAlt, setLightboxAlt] = useState<string | null>(null)
    const [lightboxStats, setLightboxStats] = useState<Record<string, number> | undefined>(undefined)

    const FILTER_LABELS: Record<'all' | ItemType, string> = {
        all: 'Tudo',
        weapon: 'Armas',
        shield: 'Acessório Extra',
        helmet: 'Chapéus',
        chest: 'Casacos',
        gloves: 'Luvas',
        legs: 'Calças',
        boots: 'Botas',
        consumable: 'Suprimentos',
        relic: 'Relíquias'
    }

    const ITEM_TYPE_LABELS: Record<ItemType, string> = {
        weapon: 'Arma',
        shield: 'Acessório Extra',
        helmet: 'Chapéu',
        chest: 'Casaco',
        gloves: 'Luvas',
        legs: 'Calça',
        boots: 'Botas',
        consumable: 'Consumível',
        relic: 'Relíquia'
    }

    const loadInventory = async () => {
        const items = await getUserInventory(profile.id)
        setInvItems(items || [])
    }

    useEffect(() => {
        loadInventory()
    }, [profile.id])

    const handleBuy = async (item: Item) => {
        if (profile.gold < item.price) return
        setActionId(item.id)

        const success = await buyItem(profile.id, item.id, item.price)
        if (success) {
            onRefresh()
            loadInventory()
        } else {
            alert('Falha na compra. Tente novamente.')
        }

        setActionId(null)
    }

    const handleSell = async (item: any) => {
        const sellPrice = Math.floor(item.price * 0.5)
        setActionId(item.inventoryId)

        const success = await sellItem(profile.id, item.inventoryId, sellPrice)
        if (success) {
            loadInventory()
            onRefresh()
        } else {
            alert('Falha ao vender. Tente novamente.')
        }

        setActionId(null)
    }

    const ownedItemIds = new Set(invItems.map(i => i.item_id))
    const filteredItems = ITEMS.filter(it => {
        const matchFilter = filter === 'all' || it.type === filter
        const alreadyOwned = it.type !== 'consumable' && ownedItemIds.has(it.id)
        return matchFilter && !alreadyOwned
    })

    const relicEffectsForDisplay = (item: Item) => {
        const effects: string[] = []
        if (item.relic_effect?.gold_per_duel_pct) effects.push(`+${item.relic_effect.gold_per_duel_pct}% Ouro por duelo`)
        if (item.relic_effect?.item_drop_per_duel_pct) effects.push(`+${item.relic_effect.item_drop_per_duel_pct}% Chance de drop`)
        return effects
    }

    const formatSigned = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-[#d9c5b2] title-western uppercase tracking-widest text-shadow text-center md:text-left">
                        Loja da Fronteira
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMode('buy')}
                            className={`px-3 py-1 font-black text-xs uppercase border rounded-sm transition-all ${mode === 'buy' ? 'bg-gold/20 text-gold border-gold' : 'bg-transparent text-[#a3907c] border-[#3a2a1a] hover:text-[#d9c5b2]'}`}
                        >
                            Comprar
                        </button>
                        <button
                            onClick={() => setMode('sell')}
                            className={`px-3 py-1 font-black text-xs uppercase border rounded-sm transition-all ${mode === 'sell' ? 'bg-gold/20 text-gold border-gold' : 'bg-transparent text-[#a3907c] border-[#3a2a1a] hover:text-[#d9c5b2]'}`}
                        >
                            Vender
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center bg-[#1a120c] p-1.5 md:p-2 rounded-sm border border-[#2b1f14]">
                    {(['all', 'weapon', 'shield', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'consumable'] as Array<'all' | ItemType>).map((f) => (
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

            {mode === 'buy' ? (
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredItems.map((item) => {
                        const canAfford = profile.gold >= item.price
                        const reqStatus = checkItemRequirements(profile, item)
                        const rarityColor = RARITY_COLORS[item.rarity || 'common']
                        return (
                            <div key={item.id} className="western-border p-3 md:p-4 flex gap-3 md:gap-4 items-start group relative transition-all duration-300 ease-out hover:-translate-y-0.5 hover:ring-1 hover:ring-[#d4af37]/40 hover:shadow-[0_14px_32px_rgba(0,0,0,0.6)]" style={{
                                background: 'linear-gradient(135deg, #1f140c, #140d07)',
                                borderColor: rarityColor.border,
                                boxShadow: `inset 0 0 15px rgba(0,0,0,0.7), 0 0 15px ${rarityColor.glow}`
                            }}>
                                <div className="absolute inset-0 border border-dashed opacity-20 group-hover:opacity-35 pointer-events-none rounded-sm m-1 transition-opacity duration-300" style={{ borderColor: rarityColor.border }}></div>

                                <div className="flex flex-col items-center gap-2 z-10">
                                    <div className="relative group">
                                        <div
                                            className={`w-14 h-14 md:w-16 md:h-16 bg-[#2b1f14] border-2 flex items-center justify-center text-2xl md:text-3xl rounded-sm shadow-inner overflow-hidden transition-all duration-300 ${item.image_url ? 'cursor-pointer hover:border-gold hover:shadow-[0_0_14px_rgba(212,175,55,0.35)]' : ''}`}
                                            style={{ borderColor: rarityColor.border }}
                                            onClick={() => {
                                                if (item.image_url) {
                                                    setLightboxSrc(item.image_url ?? null)
                                                    setLightboxAlt(item.name)
                                                    setLightboxStats(item.stats)
                                                }
                                            }}
                                        >
                                            {
                                                <ItemIcon item={item} />
                                            }
                                        </div>

                                    </div>
                                    <span className="text-[#d4af37] font-mono font-black text-sm md:text-lg bg-[#140d07] px-2 py-0.5 border border-[#2b1f14] rounded-sm shadow-inner whitespace-nowrap">{item.price} G</span>
                                </div>

                                <div className="flex-1 z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <h3 className="font-bold text-[#d9c5b2] group-hover:text-[#d4af37] transition-colors text-sm md:text-base font-serif tracking-wide">{item.name}</h3>
                                            <span className="text-[8px] md:text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border border-[#3a2a1a] text-[#b8a38e] bg-black/30">
                                                {ITEM_TYPE_LABELS[item.type]}
                                            </span>
                                            <span className="text-[8px] md:text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border" style={{ color: rarityColor.textColor, borderColor: rarityColor.border, background: 'rgba(0,0,0,0.4)' }}>
                                                {rarityColor.label}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-xs md:text-base text-[#d9c5b2] leading-relaxed mb-3 italic font-medium">"{item.description}"</p>

                                    <div className="text-[8px] md:text-[9px] text-gray-400 mb-2 flex gap-3 uppercase">
                                        {item.scaling && <span>Escalonamento: <span className="text-gold">{Object.entries(item.scaling).map(([k, v]) => `${(k === 'strength' ? '⚔️ FOR' : k === 'agility' ? '💨 AGI' : k === 'accuracy' ? '🎯 PON' : '💪 VIG')} ${v}`).join(' | ')}</span></span>}
                                    </div>

                                    {item.requirements && (
                                        <div className={`text-[10px] md:text-sm mb-3 font-black uppercase tracking-tight ${reqStatus.meets ? 'text-green-400' : 'text-red-400'}`}>
                                            Requisitos: {Object.entries(item.requirements).map(([k, v]) => `${(k === 'strength' ? '⚔️' : k === 'agility' ? '💨' : k === 'accuracy' ? '🎯' : '💪')} ${k.slice(0, 3).toUpperCase()} ${v}`).join(' | ')}
                                            {!reqStatus.meets && (
                                                <div className="mt-1 flex flex-col gap-0.5">
                                                    <div className="text-red-500/80">Faltando:</div>
                                                    {reqStatus.unmet.map((u: any) => (
                                                        <div key={u.attr} className="flex justify-between items-center text-[9px] md:text-[11px] bg-red-950/20 px-1.5 py-0.5 rounded-xs border border-red-900/30">
                                                            <span>{u.attr === 'strength' ? '⚔️ FOR' : u.attr === 'agility' ? '💨 AGI' : u.attr === 'accuracy' ? '🎯 PON' : '💪 VIG'}</span>
                                                            <span className="text-red-300">Faltam {u.diff}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-1.5 md:gap-2.5 mb-4">
                                        {item.stats && Object.entries(item.stats).map(([stat, val]) => (
                                            <div key={stat} className="flex justify-between items-center bg-[#1a140f] p-1.5 md:p-2 rounded-sm border border-[#3a2a1a] min-w-[70px] md:min-w-[100px]">
                                                <span className="text-[9px] md:text-xs text-gray-500 font-black uppercase flex items-center gap-1">{(stat === 'strength' ? 'FORÇA' : stat === 'agility' ? 'AGILIDADE' : stat === 'accuracy' ? 'PONTARIA' : stat === 'vigor' ? 'VIGOR' : stat === 'defense' ? 'DEFESA' : stat === 'hp_current' ? 'VIDA' : stat === 'energy' ? 'ENERGIA' : stat.toUpperCase())}</span>
                                                <span className="text-gold font-black text-xs md:text-lg ml-2 md:ml-3">{formatSigned(Number(val))}</span>
                                            </div>
                                        ))}
                                        {relicEffectsForDisplay(item).map(effect => (
                                            <div key={effect} className="flex items-center bg-[#1a140f] p-1.5 md:p-2 rounded-sm border border-[#3a2a1a]">
                                                <span className="text-[9px] md:text-xs text-gold font-black uppercase">{effect}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleBuy(item)}
                                        disabled={!canAfford || actionId === item.id}
                                        className={`w-full mt-auto py-2.5 md:py-4 text-xs md:text-base uppercase font-black transition-all shadow-lg ${canAfford
                                            ? 'bg-gold/10 border-2 border-gold text-gold hover:bg-gold hover:text-black hover:shadow-gold/20 shadow-[0_0_10px_rgba(212,175,55,0.1)] active:scale-95'
                                            : 'bg-gray-900 border-2 border-gray-800 text-gray-600 grayscale cursor-not-allowed'
                                            }`}
                                    >
                                        {actionId === item.id ? 'Processando...' : canAfford ? 'Comprar' : 'Sem Grana'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                    {(() => {
                        const itemsWithDetails = invItems.map(invEntry => {
                            const spec = getItemById(invEntry.item_id)
                            if (!spec) return null
                            return { ...spec, inventoryId: invEntry.id, is_equipped: invEntry.is_equipped }
                        }).filter(Boolean) as any[]

                        const unequippedItems = itemsWithDetails.filter(i => !i.is_equipped && (filter === 'all' || i.type === filter))

                        if (unequippedItems.length === 0) {
                            return (
                                <div className="col-span-full py-12 text-center">
                                    <p className="text-gold/50 italic capitalize">Nenhum item na mochila para vender.</p>
                                </div>
                            )
                        }

                        return unequippedItems.map((item) => {
                            const rarityColor = RARITY_COLORS[item.rarity || 'common']
                            const sellPrice = Math.floor(item.price * 0.5)

                            return (
                                <div key={item.inventoryId} className="western-border p-3 md:p-4 flex gap-3 md:gap-4 items-start group relative transition-all duration-300 ease-out hover:-translate-y-0.5 hover:ring-1 hover:ring-[#d4af37]/35 hover:shadow-[0_14px_32px_rgba(0,0,0,0.6)]" style={{
                                    background: 'linear-gradient(135deg, #1f140c, #140d07)',
                                    borderColor: rarityColor.border,
                                }}>
                                    <div className="absolute inset-0 border border-dashed opacity-20 group-hover:opacity-35 pointer-events-none rounded-sm m-1 transition-opacity duration-300" style={{ borderColor: rarityColor.border }}></div>

                                    <div className="flex flex-col items-center gap-2 z-10">
                                        <div className="relative group">
                                            <div
                                                className={`w-14 h-14 md:w-16 md:h-16 bg-[#2b1f14] border-2 flex items-center justify-center text-2xl md:text-3xl rounded-sm shadow-inner overflow-hidden transition-all duration-300 ${item.image_url ? 'cursor-pointer hover:border-gold hover:shadow-[0_0_14px_rgba(212,175,55,0.35)]' : ''}`}
                                                style={{ borderColor: rarityColor.border }}
                                                onClick={() => {
                                                    if (item.image_url) {
                                                        setLightboxSrc(item.image_url ?? null)
                                                        setLightboxAlt(item.name)
                                                        setLightboxStats(item.stats)
                                                    }
                                                }}
                                            >
                                                {
                                                    <ItemIcon item={item} />
                                                }
                                            </div>
                                        </div>
                                        <span className="text-[#d4af37] font-mono font-black text-sm md:text-lg bg-[#140d07] px-2 py-0.5 border border-[#2b1f14] rounded-sm shadow-inner whitespace-nowrap">+{sellPrice} G</span>
                                    </div>

                                    <div className="flex-1 z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="font-bold text-[#d9c5b2] group-hover:text-[#d4af37] transition-colors text-sm md:text-base font-serif tracking-wide">{item.name}</h3>
                                                <span className="text-[8px] md:text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border border-[#3a2a1a] text-[#b8a38e] bg-black/30">
                                                    {ITEM_TYPE_LABELS[item.type as ItemType]}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs md:text-base text-[#d9c5b2] leading-relaxed mb-3 italic font-medium">"{item.description}"</p>

                                        <button
                                            onClick={() => handleSell(item)}
                                            disabled={actionId === item.inventoryId}
                                            className={`w-full mt-auto py-2.5 md:py-4 text-xs md:text-base uppercase font-black transition-all shadow-lg bg-green-900/40 border-2 border-green-800 text-green-400 hover:bg-green-700 hover:text-white hover:border-green-400 active:scale-95`}
                                        >
                                            {actionId === item.inventoryId ? 'Processando...' : `Vender por ${sellPrice} G`}
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    })()}
                </div>
            )}

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

