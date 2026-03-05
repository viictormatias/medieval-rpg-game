import { useState, useEffect } from 'react'
import { Profile, getUserInventory, toggleEquip } from '@/lib/gameActions'
import { ITEMS as CATALOG_ITEMS, ItemType } from '@/lib/items'
import { checkItemRequirements, deriveSoulsStats } from '@/lib/soulslike'

const RARITY_COLORS: Record<string, { border: string; glow: string; label: string; textColor: string }> = {
    common: { border: '#3a3a3a', glow: 'transparent', label: 'Comum', textColor: '#9ca3af' },
    uncommon: { border: '#22c55e', glow: 'rgba(34,197,94,0.3)', label: 'Incomum', textColor: '#4ade80' },
    rare: { border: '#3b82f6', glow: 'rgba(59,130,246,0.3)', label: 'Raro', textColor: '#60a5fa' },
    epic: { border: '#a855f7', glow: 'rgba(168,85,247,0.4)', label: 'Epico', textColor: '#c084fc' },
    legendary: { border: '#f2b90d', glow: 'rgba(242,185,13,0.4)', label: 'Lendario', textColor: '#f2b90d' },
}

interface InventoryTabProps {
    profile: Profile
    onRefresh: () => void
}

export default function InventoryTab({ profile, onRefresh }: InventoryTabProps) {
    const [invItems, setInvItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null)

    const loadInventory = async () => {
        const items = await getUserInventory(profile.id)
        setInvItems(items || [])
        setLoading(false)
    }

    useEffect(() => {
        loadInventory()
    }, [profile.id])

    const handleToggleEquip = async (inventoryId: string) => {
        const success = await toggleEquip(profile.id, inventoryId)
        if (success) {
            loadInventory()
            onRefresh()
        }
    }

    const handleDragStart = (e: React.DragEvent, inventoryId: string) => {
        setDraggedItemId(inventoryId)
        e.dataTransfer.setData('inventoryId', inventoryId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

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
        return { ...spec, ...invEntry, catalogId: spec.id }
    }).filter(Boolean) as any[]

    const equippedItems = itemsWithDetails.filter(i => i.is_equipped)
    const equippedHelmet = equippedItems.find(i => i.type === 'helmet')
    const equippedChest = equippedItems.find(i => i.type === 'chest')
    const equippedGloves = equippedItems.find(i => i.type === 'gloves')
    const equippedLegs = equippedItems.find(i => i.type === 'legs')
    const equippedBoots = equippedItems.find(i => i.type === 'boots')
    const equippedWeapon = equippedItems.find(i => i.type === 'weapon')
    const equippedShield = equippedItems.find(i => i.type === 'shield')
    const soulsStats = deriveSoulsStats(profile, equippedItems)

    const totalBonuses: Record<string, number> = {}
    equippedItems.forEach(item => {
        Object.entries(item.stats || {}).forEach(([stat, val]) => {
            totalBonuses[stat] = (totalBonuses[stat] || 0) + (val as number)
        })
    })

    const unequippedItems = itemsWithDetails.filter(i => !i.is_equipped)
    const grid = Array(GRID_SIZE).fill(null).map((_, i) => unequippedItems[i] || null)

    const handleDropOnPaperdoll = async (e: React.DragEvent, slotType: ItemType) => {
        e.preventDefault()
        const inventoryId = e.dataTransfer.getData('inventoryId')
        if (!inventoryId) return

        const itemToEquip = itemsWithDetails.find(i => i.id === inventoryId)
        if (!itemToEquip) return
        if (itemToEquip.type !== slotType) return

        const req = checkItemRequirements(profile, itemToEquip)
        if (!req.meets) return

        if (!itemToEquip.is_equipped) await handleToggleEquip(inventoryId)
        setDraggedItemId(null)
    }

    const handleDropOnGrid = async (e: React.DragEvent) => {
        e.preventDefault()
        const inventoryId = e.dataTransfer.getData('inventoryId')
        if (!inventoryId) return

        const itemToUnequip = itemsWithDetails.find(i => i.id === inventoryId)
        if (!itemToUnequip) return
        if (itemToUnequip.is_equipped) await handleToggleEquip(inventoryId)
        setDraggedItemId(null)
    }

    const renderPaperdollSlot = (item: any, slotType: ItemType, label: string, fallbackEmoji: string) => {
        const rarity = item ? getRarity(item) : 'common'
        const rc = RARITY_COLORS[rarity] || RARITY_COLORS.common
        const req = item ? checkItemRequirements(profile, item) : null

        return (
            <div className="flex flex-col items-center flex-1">
                <span className="text-[9px] uppercase tracking-widest text-gray-500 mb-2">{label}</span>
                <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnPaperdoll(e, slotType)}
                    onClick={() => item && req?.meets && handleToggleEquip(item.id)}
                    className={`aspect-square w-full max-w-[100px] flex items-center justify-center text-4xl group relative cursor-pointer transition-all ${!item ? 'bg-[#0d0d0d] border border-dashed border-[#3a3a3a]' : 'hover:scale-105'}`}
                    style={item ? {
                        background: 'linear-gradient(135deg, #1a1208, #0d0d0d)',
                        border: `2px solid ${req?.meets ? rc.border : '#dc2626'}`,
                        boxShadow: `0 0 16px ${req?.meets ? rc.glow : 'rgba(220,38,38,0.35)'}`
                    } : {}}
                    draggable={!!item}
                    onDragStart={(e) => item && handleDragStart(e, item.id)}
                >
                    {item ? (
                        <>
                            <span style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' }}>{item.icon}</span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-44 p-3 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
                                style={{
                                    background: '#0d0d0d',
                                    border: `1px solid ${req?.meets ? rc.border : '#dc2626'}`,
                                    boxShadow: `0 0 20px rgba(0,0,0,0.8), 0 0 10px ${rc.glow}`,
                                }}
                            >
                                <div className="text-[11px] font-bold text-gold mb-1">{item.name}</div>
                                <div className="text-[9px] mb-1" style={{ color: rc.textColor }}>{rc.label}</div>
                                <div className="text-[9px] text-gray-400 mb-1">Peso {Number(item.weight || 0).toFixed(1)}</div>
                                {item.scaling && (
                                    <div className="text-[9px] text-gray-400 mb-1">
                                        Scaling: {Object.entries(item.scaling).map(([k, v]) => `${k.slice(0, 3).toUpperCase()} ${v}`).join(' | ')}
                                    </div>
                                )}
                                {item.requirements && (
                                    <div className={`text-[9px] mb-1 ${req?.meets ? 'text-green-400' : 'text-red-400'}`}>
                                        Req: {Object.entries(item.requirements).map(([k, v]) => `${k.slice(0, 3).toUpperCase()} ${v}`).join(' | ')}
                                    </div>
                                )}
                                {!req?.meets && (
                                    <div className="text-[9px] text-red-400">Faltando: {req?.unmetLabels.join(', ')}</div>
                                )}
                            </div>
                        </>
                    ) : (
                        <span className="opacity-20">{fallbackEmoji}</span>
                    )}
                </div>
            </div>
        )
    }

    if (loading) return <div className="text-center text-gray-500 text-sm">Carregando inventario...</div>

    return (
        <div className="space-y-8">
            <div className="ornament-divider text-[10px]">Equipamentos Ativos</div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_230px] gap-6">
                <div className="p-4 medieval-border bg-black/40 grid grid-cols-2 md:grid-cols-4 gap-4 min-h-[260px]">
                    {renderPaperdollSlot(equippedHelmet, 'helmet', 'Capacete', '🪖')}
                    {renderPaperdollSlot(equippedWeapon, 'weapon', 'Arma', '⚔️')}
                    {renderPaperdollSlot(equippedChest, 'chest', 'Peitoral', '🛡️')}
                    {renderPaperdollSlot(equippedShield, 'shield', 'Escudo', '🔰')}
                    {renderPaperdollSlot(equippedGloves, 'gloves', 'Luvas', '🧤')}
                    {renderPaperdollSlot(equippedLegs, 'legs', 'Calcas', '👖')}
                    {renderPaperdollSlot(equippedBoots, 'boots', 'Botas', '👢')}
                </div>

                <div className="medieval-border p-4 bg-black/40 flex flex-col justify-center">
                    <h3 className="text-[10px] text-gold uppercase tracking-widest text-center mb-3">Resumo Souls</h3>
                    <div className="space-y-1.5 text-[10px]">
                        <div className="flex justify-between border-b border-[#222] pb-1">
                            <span className="text-gray-400 uppercase">Carga</span>
                            <span className="text-gold">{soulsStats.equipLoadCurrent.toFixed(1)} / {soulsStats.equipLoadMax.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#222] pb-1">
                            <span className="text-gray-400 uppercase">Tier</span>
                            <span className="text-gold">{soulsStats.equipTier} ({soulsStats.equipLoadPct.toFixed(1)}%)</span>
                        </div>
                        <div className="flex justify-between border-b border-[#222] pb-1">
                            <span className="text-gray-400 uppercase">AR</span>
                            <span className="text-gold">{soulsStats.attackRating}</span>
                        </div>
                    </div>

                    <h4 className="text-[9px] text-gray-500 uppercase tracking-widest mt-4 mb-2">Bonus Equipados</h4>
                    {Object.keys(totalBonuses).length > 0 ? (
                        <div className="space-y-1.5">
                            {Object.entries(totalBonuses).map(([stat, val]) => (
                                <div key={stat} className="flex justify-between items-center text-[11px] border-b border-[#222] pb-1">
                                    <span className="text-gray-400 uppercase tracking-wider">{stat}</span>
                                    <span className={`font-mono font-bold ${val >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {val > 0 ? '+' : ''}{val}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-[9px] text-gray-600 text-center italic">
                            Nenhum bonus ativo.
                        </div>
                    )}
                </div>
            </div>

            <div className="ornament-divider text-[10px]">Bolsa Geral ({unequippedItems.length}/{GRID_SIZE} slots)</div>

            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 p-4 medieval-border min-h-[200px]" onDragOver={handleDragOver} onDrop={handleDropOnGrid}>
                {grid.map((item, i) => {
                    const rarity = item ? getRarity(item) : 'common'
                    const rc = RARITY_COLORS[rarity] || RARITY_COLORS.common
                    const req = item ? checkItemRequirements(profile, item) : null
                    return (
                        <div
                            key={item ? item.id : `empty-${i}`}
                            onClick={() => item && req?.meets && handleToggleEquip(item.id)}
                            onDragStart={(e) => item && handleDragStart(e, item.id)}
                            draggable={!!item}
                            className={`aspect-square flex items-center justify-center text-xl group relative transition-all ${item ? 'hover:scale-110 cursor-grab active:cursor-grabbing' : 'opacity-20'}`}
                            style={{
                                background: item ? 'linear-gradient(135deg, #1a1a1a, #0d0d0d)' : 'rgba(0,0,0,0.3)',
                                border: item ? `1px solid ${req?.meets ? rc.border : '#dc2626'}` : '1px dashed #2a2a2a',
                                borderRadius: '3px',
                                opacity: draggedItemId === item?.id ? 0.5 : 1
                            }}
                        >
                            {item ? (
                                <>
                                    <span style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))' }}>{item.icon}</span>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-40 p-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
                                        style={{ background: '#0d0d0d', border: `1px solid ${req?.meets ? rc.border : '#dc2626'}`, boxShadow: '0 0 16px rgba(0,0,0,0.9)' }}
                                    >
                                        <div className="text-[9px] font-bold text-gold mb-0.5">{item.name}</div>
                                        <div className="text-[8px]" style={{ color: rc.textColor }}>{rc.label} - {item.type}</div>
                                        <div className="text-[8px] text-gray-400">Peso {Number(item.weight || 0).toFixed(1)}</div>
                                        {item.requirements && (
                                            <div className={`text-[8px] ${req?.meets ? 'text-green-400' : 'text-red-400'}`}>
                                                Req: {Object.entries(item.requirements).map(([k, v]) => `${k.slice(0, 3).toUpperCase()} ${v}`).join(' | ')}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <span className="text-[8px] text-gray-700 font-mono">{i + 1}</span>
                            )}
                        </div>
                    )
                })}
            </div>
            <div className="text-center text-[9px] text-gray-500 italic mt-2">
                Arraste para equipar ou clique para equipar/desequipar. Itens com borda vermelha estao sem requisitos.
            </div>
        </div>
    )
}
