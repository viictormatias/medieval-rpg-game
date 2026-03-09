'use client'
import { useState, useEffect } from 'react'
import { Profile, getUserInventory, toggleEquip, consumeItem, sellItem } from '@/lib/gameActions'
import { ITEMS as CATALOG_ITEMS, ItemType } from '@/lib/items'
import { checkItemRequirements, deriveSoulsStats } from '@/lib/soulslike'
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
                className={`w-full h-full object-contain ${className}`}
                onError={() => setImgError(true)}
            />
        )
    }

    return <span className="text-xl md:text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{item.icon}</span>
}

interface InventoryTabProps {
    profile: Profile
    onRefresh: () => void
    isActive?: boolean
}

export default function InventoryTab({ profile, onRefresh, isActive }: InventoryTabProps) {
    const [invItems, setInvItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
    const [selectedItem, setSelectedItem] = useState<any | null>(null)
    const [filter, setFilter] = useState<'all' | ItemType>('all')
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
    const [lightboxAlt, setLightboxAlt] = useState<string | null>(null)
    const [lightboxStats, setLightboxStats] = useState<Record<string, number> | undefined>(undefined)
    const [activeBagIndex, setActiveBagIndex] = useState<number>(0)

    const FILTER_LABELS: Record<'all' | ItemType, string> = {
        all: 'Tudo',
        weapon: 'Armas',
        shield: 'Acessório Extra',
        helmet: 'Chapeus',
        chest: 'Casacos',
        gloves: 'Luvas',
        legs: 'Calcas',
        boots: 'Botas',
        consumable: 'Consumiveis'
    }

    const loadInventory = async () => {
        const items = await getUserInventory(profile.id)
        setInvItems(items || [])
        setLoading(false)
    }

    useEffect(() => {
        if (isActive === undefined || isActive) {
            loadInventory()
        }
    }, [profile.id, isActive])

    const handleToggleEquip = async (inventoryId: string) => {
        const success = await toggleEquip(profile.id, inventoryId)
        if (success) { loadInventory(); onRefresh() }
    }

    const handleSellItem = async (inventoryId: string, sellPrice: number) => {
        const success = await sellItem(profile.id, inventoryId, sellPrice)
        if (success) {
            loadInventory()
            onRefresh()
        } else {
            alert('Erro ao vender item. Certifique-se de que não está equipado.')
        }
    }

    const handleDragStart = (e: React.DragEvent, inventoryId: string) => {
        setDraggedItemId(inventoryId)
        e.dataTransfer.setData('inventoryId', inventoryId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault() }

    const GRID_SIZE = 30
    const getRarity = (item: any) => {
        if (item.rarity && RARITY_COLORS[item.rarity]) return item.rarity
        if (item.price > 2000) return 'legendary'
        if (item.price > 1000) return 'epic'
        if (item.price > 500) return 'rare'
        if (item.price > 100) return 'uncommon'
        return 'common'
    }

    const itemsWithDetails = invItems.map(invEntry => {
        const spec = CATALOG_ITEMS.find(it => it.id === invEntry.item_id)
        if (!spec) return null
        return { ...spec, quantity: invEntry.quantity || 1, is_equipped: invEntry.is_equipped, inventory_id: invEntry.id }
    }).filter(Boolean) as any[]

    const equippedItems = itemsWithDetails.filter(i => i.is_equipped)
    const equippedHelmet = equippedItems.find(i => i.type === 'helmet')
    const equippedChest = equippedItems.find(i => i.type === 'chest')
    const equippedGloves = equippedItems.find(i => i.type === 'gloves')
    const equippedLegs = equippedItems.find(i => i.type === 'legs')
    const equippedBoots = equippedItems.find(i => i.type === 'boots')
    const equippedWeapon = equippedItems.find(i => i.type === 'weapon')
    const equippedShield = equippedItems.find(i => i.type === 'shield')
    const equippedRelics = equippedItems.filter(i => i.type === 'relic')
    const soulsStats = deriveSoulsStats(profile, equippedItems)

    const unequippedItems = itemsWithDetails.filter(i => !i.is_equipped)
    const filteredUnequippedItems = unequippedItems.filter(it => filter === 'all' || it.type === filter)

    // Calcula quantos slots e bags o jogador tem
    const hasBag2 = itemsWithDetails.some(i => i.id === 'leather_bag' || i.item_id === 'leather_bag')
    const totalSlots = hasBag2 ? 60 : 30
    const displayedItems = filteredUnequippedItems.slice(activeBagIndex * 30, (activeBagIndex + 1) * 30)
    const grid = Array(GRID_SIZE).fill(null).map((_, i) => displayedItems[i] || null)

    const handleDropOnPaperdoll = async (e: React.DragEvent, slotType: ItemType) => {
        e.preventDefault()
        const inventoryId = e.dataTransfer.getData('inventoryId')
        if (!inventoryId) return
        const itemToEquip = itemsWithDetails.find(i => i.inventory_id === inventoryId)
        if (!itemToEquip || itemToEquip.type !== slotType) return
        const req = checkItemRequirements(profile, itemToEquip)
        if (!req.meets) return
        if (!itemToEquip.is_equipped) await handleToggleEquip(inventoryId)
        setDraggedItemId(null)
    }

    const handleDropOnGrid = async (e: React.DragEvent) => {
        e.preventDefault()
        const inventoryId = e.dataTransfer.getData('inventoryId')
        if (!inventoryId) return
        const itemToUnequip = itemsWithDetails.find(i => i.inventory_id === inventoryId)
        if (!itemToUnequip) return
        if (itemToUnequip.is_equipped) await handleToggleEquip(inventoryId)
        setDraggedItemId(null)
    }

    const handleItemClick = async (item: any, req: any) => {
        if (!item) return
        if (item.type === 'consumable') {
            // item.inventory_id is now safely the database UUID
            const res = await consumeItem(profile.id, item.inventory_id, item)
            alert(res.message)
            if (res.success) {
                loadInventory()
                onRefresh()
            }
        } else {
            // Always allow opening Lightbox if there is an image
            if (item.image_url) {
                setLightboxSrc(item.image_url)
                setLightboxAlt(item.name)
                setLightboxStats(item.stats)
            } else if (req?.meets) {
                // Only auto-equip if requirements are met and there's no image to show
                handleToggleEquip(item.inventory_id)
            } else if (!req?.meets) {
                alert(`Você não tem os requisitos necessários para este item: ${req?.reason || ''}`)
            }
        }
    }

    /* Slot Component */
    const EquipmentSlot = ({ item, slotType, icon, label, className }: { item: any, slotType: ItemType, icon: string, label: string, className?: string }) => {
        const rc = item ? (RARITY_COLORS[getRarity(item)] || RARITY_COLORS.common) : null
        const req = item ? checkItemRequirements(profile, item) : null

        return (
            <div
                className="group relative w-16 h-16 bg-black/40 border-2 transition-all flex items-center justify-center rounded-sm"
                style={{
                    borderColor: item ? (req?.meets ? rc?.border : '#8b0000') : '#423020',
                    boxShadow: item ? `0 0 10px ${req?.meets ? rc?.glow : 'rgba(139,0,0,0.3)'}` : 'none'
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnPaperdoll(e, slotType)}
                onClick={() => {
                    if (item) {
                        if (item.image_url) {
                            setLightboxSrc(item.image_url)
                            setLightboxAlt(item.name)
                            setLightboxStats(item.stats)
                        } else {
                            handleToggleEquip(item.inventory_id)
                        }
                    }
                }}
            >
                {item ? (
                    <ItemIcon item={item} />
                ) : (
                    <span className="text-xl opacity-20">{icon}</span>
                )}

                {/* Tooltip */}
                <div className="absolute top-0 left-full ml-3 w-64 p-4 bg-black/90 border border-gold/30 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-[999] pointer-events-none shadow-2xl">
                    <div className="text-base font-bold text-gold uppercase tracking-wider">{label}</div>
                    {item ? (
                        <>
                            <div className="text-lg text-white mt-2 border-b border-white/10 pb-2 font-serif">{item.name}</div>
                            <div className="mt-1 mb-1">
                                <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border border-white/15 text-gray-300 bg-black/30">
                                    {ITEM_TYPE_LABELS[item.type as ItemType]}
                                </span>
                            </div>

                            {/* Requisitos no hover do equipado */}
                            {item.requirements && !req?.meets && (
                                <div className="mt-2 mb-2 p-1.5 bg-red-950/30 border border-red-900/50 rounded-sm">
                                    <div className="text-[10px] text-red-400 font-black uppercase mb-1">Requisitos Insuficientes</div>
                                    <div className="space-y-0.5">
                                        {req?.unmet.map((u: any) => (
                                            <div key={u.attr} className="text-[11px] text-red-300 flex justify-between">
                                                <span>{u.attr === 'strength' ? '⚔️ FOR' : u.attr === 'agility' ? '💨 AGI' : u.attr === 'accuracy' ? '🎯 PON' : '💪 VIG'} {u.needed}</span>
                                                <span className="font-black">Faltam {u.diff}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {item.stats && Object.entries(item.stats as Record<string, number>).map(([k, v]) => (
                                <div key={k} className="flex justify-between text-base mt-1.5">
                                    <span className="text-gray-400 capitalize flex items-center gap-1">
                                        {k === 'strength' ? '⚔️ Força' :
                                            k === 'agility' ? '💨 Agilidade' :
                                                k === 'accuracy' ? '🎯 Pontaria' :
                                                    k === 'vigor' ? '💪 Vigor' :
                                                        k === 'defense' ? '🛡️ Defesa' :
                                                            k === 'hp_current' ? '❤️ Vida' :
                                                                k === 'energy' ? '⚡ Energia' : k}
                                    </span>
                                    <span className="text-gold font-bold">+{v as number}</span>
                                </div>
                            ))}
                            {relicEffectsForDisplay(item).map((effect) => (
                                <div key={effect} className="flex justify-between text-base mt-1.5">
                                    <span className="text-gray-300">{effect}</span>
                                </div>
                            ))}

                            {/* Botão de Venda no Tooltip */}
                            {!item.is_equipped && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleSellItem(item.id, Math.floor(item.price * 0.5))
                                    }}
                                    className="w-full mt-4 py-1.5 bg-red-900/20 border border-red-800 text-red-400 text-[10px] font-black uppercase hover:bg-red-700 hover:text-white transition-all pointer-events-auto"
                                >
                                    Vender por {Math.floor(item.price * 0.5)} G
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="text-[9px] text-gray-500 mt-1 italic">Vazio</div>
                    )}
                </div>
            </div>
        )
    }

    if (loading) return <div className="text-center p-12 text-gold animate-pulse">CARREGANDO ARSENAL...</div>

    return (
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-full min-h-[500px] lg:min-h-[600px]">
            {/* LADO ESQUERDO: MOCHILA */}
            <div className="flex-1 western-border p-3 md:p-4 bg-black/40 flex flex-col order-2 lg:order-1">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
                    <h2 className="title-western text-lg md:text-xl text-gold uppercase tracking-widest flex items-center gap-2">
                        Bolsa de Viagem
                    </h2>
                    <div className="flex flex-wrap justify-center gap-1">
                        {['all', 'weapon', 'chest', 'helmet', 'relic', 'consumable'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-2 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm uppercase font-black border transition-all ${filter === f ? 'border-gold text-gold bg-gold/10 shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'border-white/10 text-gray-500 hover:text-white'}`}
                            >
                                {FILTER_LABELS[f as 'all' | ItemType] || f}
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    className="grid grid-cols-4 md:grid-cols-5 gap-1.5 md:gap-2 flex-1 auto-rows-fr"
                    onDragOver={handleDragOver}
                    onDrop={handleDropOnGrid}
                >
                    {grid.map((item, i) => {
                        const rc = item ? (RARITY_COLORS[getRarity(item)] || RARITY_COLORS.common) : null
                        const req = item ? checkItemRequirements(profile, item) : null

                        return (
                            <div
                                key={item ? item.inventory_id : `empty-${i}`}
                                draggable={!!item}
                                onDragStart={(e) => item && handleDragStart(e, item.inventory_id)}
                                onClick={() => item && handleItemClick(item, req)}
                                className="aspect-square bg-black/60 border border-white/5 relative group transition-all hover:border-gold/30 hover:bg-white/5 flex items-center justify-center cursor-pointer hover:z-[100]"
                                style={{
                                    borderColor: item ? (req?.meets ? rc?.border : '#8b0000') : '',
                                    boxShadow: item ? `inset 0 0 10px ${req?.meets ? rc?.glow : 'rgba(139,0,0,0.2)'}` : ''
                                }}
                            >
                                {item ? (
                                    <>
                                        <ItemIcon item={item} className="p-1" />
                                        {item.quantity > 1 && (
                                            <span className="absolute bottom-0.5 right-0.5 text-[8px] md:text-xs font-black text-white bg-black/80 px-1 md:px-2 py-0.5 rounded-sm border border-white/10">x{item.quantity}</span>
                                        )}
                                        {/* Tooltip de status para itens da mochila (desktop) */}
                                        <div className="hidden md:group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 p-3 bg-black/95 border border-gold/40 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-2xl text-left">
                                            <div className="text-base text-gold font-bold truncate mb-1">{item.name}</div>
                                            <div className="mb-2">
                                                <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border border-white/15 text-gray-300 bg-black/30">
                                                    {ITEM_TYPE_LABELS[item.type as ItemType]}
                                                </span>
                                            </div>

                                            {/* Requisitos no hover da mochila */}
                                            {item.requirements && !req?.meets && (
                                                <div className="mb-2 p-1.5 bg-red-950/30 border border-red-900/50 rounded-sm">
                                                    <div className="text-[9px] text-red-400 font-black uppercase mb-1">Status Insuficientes</div>
                                                    <div className="space-y-0.5">
                                                        {req?.unmet.map((u: any) => (
                                                            <div key={u.attr} className="text-[10px] text-red-300 flex justify-between">
                                                                <span>{u.attr === 'strength' ? '⚔️ FOR' : u.attr === 'agility' ? '💨 AGI' : u.attr === 'accuracy' ? '🎯 PON' : '💪 VIG'} {u.needed}</span>
                                                                <span className="font-black">-{u.diff}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {((item.stats && Object.keys(item.stats).length > 0) || relicEffectsForDisplay(item).length > 0) ? (
                                                <div className="space-y-1">
                                                    {Object.entries(item.stats as Record<string, number>).map(([k, v]) => {
                                                        // Comparison logic
                                                        const equipped = equippedItems.find(ei => ei.type === item.type);
                                                        const equippedVal = (equipped?.stats as any)?.[k] || 0;
                                                        const diff = v - equippedVal;

                                                        return (
                                                            <div key={k} className="flex justify-between text-xs items-center">
                                                                <span className="text-gray-400 capitalize flex items-center gap-1">
                                                                    {k === 'strength' ? '⚔️ Força' :
                                                                        k === 'agility' ? '💨 Agilidade' :
                                                                            k === 'accuracy' ? '🎯 Pontaria' :
                                                                                k === 'vigor' ? '💪 Vigor' :
                                                                                    k === 'defense' ? '🛡️ Defesa' :
                                                                                        k === 'hp_current' ? '❤️ Vida' :
                                                                                            k === 'energy' ? '⚡ Energia' : k}
                                                                </span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-gold font-bold">+{v as number}</span>
                                                                    {equipped && diff !== 0 && (
                                                                        <span className={`text-[10px] font-black ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                            ({diff > 0 ? `+${diff}` : diff})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {relicEffectsForDisplay(item).map((effect) => (
                                                        <div key={effect} className="flex justify-between text-xs items-center">
                                                            <span className="text-gold font-black uppercase">{effect}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-400 uppercase font-black mt-1 text-center">{item.type}</div>
                                            )}

                                            {/* Sell Button for Inventory Grid Tooltip */}
                                            {!item.is_equipped && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleSellItem(item.id, Math.floor(item.price * 0.5))
                                                    }}
                                                    className="w-full mt-3 py-1 bg-red-900/20 border border-red-800 text-red-400 text-[9px] font-black uppercase hover:bg-red-700 hover:text-white transition-all pointer-events-auto"
                                                >
                                                    Vender por {Math.floor(item.price * 0.5)} G
                                                </button>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-[8px] text-white/5 font-mono">{i + 1}</span>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4 flex gap-1 md:gap-2">
                    {['BAG 1', 'BAG 2'].map((b, i) => {
                        const isUnlocked = i === 0 || hasBag2
                        const isActive = activeBagIndex === i

                        return (
                            <button
                                key={b}
                                disabled={!isUnlocked}
                                onClick={() => setActiveBagIndex(i)}
                                className={`flex-1 py-1 text-center text-[8px] md:text-[9px] border font-bold uppercase transition-all ${isActive
                                        ? 'border-gold/50 text-gold bg-gold/10 shadow-[0_0_8px_rgba(212,175,55,0.2)]'
                                        : isUnlocked
                                            ? 'border-white/10 text-gray-400 hover:text-white hover:border-white/30 cursor-pointer'
                                            : 'border-white/5 text-gray-700 bg-black/50 cursor-not-allowed line-through'
                                    }`}
                            >
                                {b} {!isUnlocked && <span className="text-[6px] ml-1">(Fechado)</span>}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* LADO DIREITO: PERSONAGEM & STATUS */}
            <div className="w-full lg:w-[420px] western-border bg-black/60 p-4 md:p-5 flex flex-col gap-4 md:gap-6 relative overflow-hidden order-1 lg:order-2">
                {/* Background Decor */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-sm">
                    <div className="absolute inset-0 opacity-5 flex items-center justify-center">
                        <img src="/images/logo-semfundo.png" className="w-[80%] grayscale invert" alt="" />
                    </div>
                </div>

                <h2 className="title-western text-lg md:text-xl text-center text-gold tracking-widest relative z-10">
                    O PISTOLEIRO
                </h2>

                <div className="flex flex-col md:flex-row lg:flex-col gap-4 relative z-10">
                    {/* Character Equipment Layout */}
                    <div className="flex-1 flex flex-col items-center gap-4">
                        <EquipmentSlot item={equippedHelmet} slotType="helmet" icon="🤠" label="Cabeça" />

                        <div className="flex gap-4 items-center">
                            <EquipmentSlot item={equippedWeapon} slotType="weapon" icon="🔫" label="Mão Principal" />
                            <EquipmentSlot item={equippedChest} slotType="chest" icon="🧥" label="Tronco" />
                            <EquipmentSlot item={equippedShield} slotType="shield" icon="🔰" label="Acessório Defensivo" />
                        </div>

                        <div className="flex gap-8 md:gap-12">
                            <div className="flex flex-col gap-4">
                                <EquipmentSlot item={equippedGloves} slotType="gloves" icon="🧤" label="Luvas" />
                                <div className="w-14 h-14 md:w-16 md:h-16 border-2 border-dashed border-white/5 flex items-center justify-center opacity-20">
                                    <span className="text-xl">💍</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <EquipmentSlot item={equippedLegs} slotType="legs" icon="👖" label="Pernas" />
                                <EquipmentSlot item={equippedBoots} slotType="boots" icon="🥾" label="Pés" />
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary Panel */}
                    <div className="w-full md:w-48 lg:w-full flex md:flex-col gap-2 md:gap-3">
                        <div className="hidden md:block bg-black/60 border border-gold/20 p-3 rounded-sm space-y-3">
                            <h3 className="text-[10px] text-gold font-bold uppercase border-b border-gold/20 pb-1 text-center">Relíquias</h3>
                            <div className="flex flex-row md:flex-col gap-2 items-center justify-center">
                                <EquipmentSlot item={equippedRelics[0]} slotType="relic" icon="💎" label="Relíquia" className="w-14 h-14 md:w-16 md:h-16 block" />
                                <EquipmentSlot item={equippedRelics[1]} slotType="relic" icon="💎" label="Relíquia" className="w-14 h-14 md:w-16 md:h-16 block" />
                            </div>
                        </div>

                        <div className="flex-1 bg-black/80 border border-gold/30 p-3 md:p-4 rounded-sm flex flex-col justify-between">
                            <h3 className="text-[10px] md:text-[11px] text-gold font-bold uppercase tracking-widest text-center mb-2 md:mb-4">Potencial</h3>

                            <div className="space-y-2 md:space-y-4">
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] md:text-[9px] text-gray-500 uppercase">Dano Total</span>
                                    <span className="text-lg md:text-2xl font-black text-white title-western tracking-tight">
                                        {soulsStats.minDamage}-{soulsStats.maxDamage}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-1 gap-1 md:gap-2 lg:gap-2">
                                    {[
                                        { label: 'HP Máx', base: profile.hp_max, bonus: soulsStats.bonuses.vigor * 10, icon: '❤️' },
                                        { label: 'Força', base: profile.strength, bonus: soulsStats.bonuses.strength, icon: '⚔️' },
                                        { label: 'Defesa', base: profile.defense, bonus: soulsStats.bonuses.defense, icon: '🛡️' },
                                        { label: 'Agilidade', base: profile.agility, bonus: soulsStats.bonuses.agility, icon: '💨' },
                                        { label: 'Pontaria', base: profile.accuracy, bonus: soulsStats.bonuses.accuracy, icon: '🎯' },
                                        { label: 'Vigor', base: profile.vigor, bonus: soulsStats.bonuses.vigor, icon: '💪' },
                                    ].map(({ label, base, bonus, icon }) => (
                                        <div key={label} className="flex justify-between items-center text-[10px] md:text-sm lg:text-base border-b border-white/5 py-1">
                                            <span className="text-gray-400 md:uppercase font-black tracking-tighter truncate flex items-center gap-1">
                                                <span className="text-xs">{icon}</span> {label}
                                            </span>
                                            <div className="flex items-center gap-1 md:gap-1.5 flex-wrap justify-end">
                                                <span className="text-white font-black text-xs md:text-base">{base + bonus}</span>
                                                <div className="flex items-center text-[8px] md:text-[10px] font-bold">
                                                    <span className="text-gray-500">({base})</span>
                                                    <span className="text-gray-500 ml-1">({bonus > 0 ? `+${bonus}` : bonus})</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="mt-4 md:mt-auto text-center relative z-10">
                    <p className="text-[8px] md:text-[10px] text-gold/30 italic uppercase tracking-[0.2em]">
                        "Arma leve, mente focada"
                    </p>
                </div>
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

